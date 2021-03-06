let execSync = require( "child_process" ).execSync;
let _ = require("lodash");
let moment = require("moment");

let defaultOptions = require( "./defaultOptions.js" );


module.exports = 
{
	"defaultOptions" : defaultOptions,

	"diff" : function( options )
	{
		console.time("Formatting commits took");
		///////////////////////////////////////////////////////////
        //  Get the commits
        ///////////////////////////////////////////////////////////
        // Get the commits, which returns something like:
        //      708aaa2 Update README.md
        //      dc8422a Initial commit.
        let commitLines = execSync( `git log --pretty=format:"%h %ct %s"`, { "encoding" : "utf8" } )
                            // Make it an array by breaking it by newlines
                            .split("\n");

        // Sort from oldest to newest
        commitLines.reverse();

        // Get an array of just the hashes
        let commits = _.map( commitLines, function(c) { 
                                                    let split = c.split(" ");
                                                    let commit = split[0];
                                                    let date = moment.unix( split[1] ).toJSON();
                                                    let message = c.replace(`${commit} ${split[1]} `, "");
                                                    return { "commit" : commit, "message" : message, "date" : moment(date).format(options.dateFormat) } 
                                                }.bind(this) 
                            )
                            // Filter out any nulls
                            .filter( (c)=> c.commit.length > 0 );

        ///////////////////////////////////////////////////////////
        //  For each commit, get the files that have changed
        ///////////////////////////////////////////////////////////

        commits = _.map( commits, (c,i) => 
        {
        	// Skip first
        	if( i==0 ) return;
            // Build the command
            let c1 = commits[i-1]['commit'];
            let c2 = commits[i]['commit'];
            // Do diff
            let result = execSync( `git diff --diff-filter=${options.diffFilter} ${c1} ${c2}`, { "encoding" : "utf8" } );
            // Parse diff per file
            c.files = this.splitDiff( result, options );
            // Return
            return c;
        });

        // Remove any nulls
        _.remove( commits, c => !c );

        // Remove the first (initial) commit
        if( options.ignore.firstCommit ) commits.shift();

        // Remove commits with no files (e.g. theyve all been ignored)
        commits = _.filter( commits, (c)=> c.files.length > 0 );

        // Remove ignored commits
        if( options.ignore.commits.length > 0 ) 
            commits = _.filter( commits, (c)=> !_.find( options.ignore.commits, i=> i == c.commit) );

        // Re-order to latest commit first
        commits.reverse();

        // Debug
        // _.each( commits, c => console.log( c.commit, c.message ) );

		///////////////////////////////////////////////////////////
        //  Return
        ///////////////////////////////////////////////////////////

        console.timeEnd("Formatting commits took");

		return commits;
	},

	"isBinaryFile" : function( diff ) {
		return ( diff.search(/(Binary files).*(differ)/gm) > -1 );
	},

	"splitDiff" : function ( diff, options ) {
		// Split by file
		diff = diff.split( "diff --git" );
		// Remove first, which is always null
        diff.shift();
        // For each
        let r = _.map( diff, (e,i) => 
        {
        	// Return an object representing the file
        	return {
        		"name" : this.getFilename(e), 
			    "binary" : this.isBinaryFile(e),
			    "type" : this.getDiffType(e), 
        		"changes" : this.cleanUpDiff(e) 
			};
        })
        .filter( (f) => 
        {
			// Skip nulls
			if( f.changes.length == 0 ) return false;
			// Skip if its a filename we should ignore
			if( _.indexOf(options.ignore.files, f.name) != -1 ) return false;
			let ext = f.name.split(".")[1];
			// Skip if its a file extension we should ignore
			if( _.indexOf(options.ignore.exts, ext) >= 0 ) return false;
			// If we got this far, it deserves to be included
			return true;
        });

        // Return
		return r;
	},

	"getFilename" : function ( diff ) {
		// FInd the filename
		let filename = diff.match( /a\/.*b\//g )[0];
		// Return it
		return filename.substr(2,filename.length-5);
	},

	"cleanUpDiff" : function ( diff ) {

		// Remove the meta-info at the top part of the diff
		diff = diff.replace( diff.substring( 0, diff.indexOf("@@")+2 ), "" );
		// Remove the @@ line
		diff = diff.replace( diff.substring( 0, diff.indexOf("@@")+2 ), "" );
		// Split by @@
		diff = diff.split(/^(@@.*@@)/gm);
		// For some reason regex split doesnt remove delmiter
		diff = _.filter( diff, (e,i)=> i%2 == 0 );

		// console.log( typeof diff, diff.length, diff, "\n\n\n\n\n" );
		return diff;
	},

	"getDiffType" : function( diff ) {
		if( diff.indexOf("new file mode") > -1 ) return "added";
		else if( diff.indexOf("deleted file mode") > -1 || diff.length == 0 ) return "deleted";
		else return "updated";
	}
}