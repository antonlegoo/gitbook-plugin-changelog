let _ = require("lodash");

let differ = require( "./differ.js" );

let commits;

module.exports = 
{
     "book": {
        "assets": './assets',
        "js": [ 'changelog.js' ],
        "css": [ 'changelog.css' ]
    },

    // Blocks
    "blocks" : 
    {
        "changelog" : 
        {
            "blocks" : ['date','message','files','endfiles','badge','filename','changes'],
            "process" : function( block )
            {
                // Create the template string
                var templateString = `
                <div class="changelog">
                    <% _.each( commits, function(c){ %>
                        <div class="changelog--commit">
                            <div class="changelog--header">
                                <a name="<%= c.commit %>"></a>
                                <% if(_.find( block.blocks, (b)=> b.name == 'date')) { %>
                                    <div class="changelog--date"><%= c.date %></div>
                                <% } %>
                                <% if(_.find( block.blocks, (b)=> b.name == 'message')) { %>
                                    <h2 class="changelog--message"><%= c.message %></h2>
                                <% } %>
                            </div>
                            <% if(_.find( block.blocks, (b)=> b.name == 'files')) { %>
                                <% _.each( c.files, function(f){ %>
                                <div class="changelog--file -<%= f.type %>">
                                    <% if(_.find( block.blocks, (b)=> b.name == 'badge')) { %>
                                        <span class="changelog--badge"><%= f.type %></span>
                                    <% } %>
                                    <%  var filename = _.find( block.blocks, (b)=> b.name == 'filename'); 
                                        if( filename ) { 
                                        %>
                                        <% if( filename.kwargs.link || filename.kwargs.link == undefined ) { 
                                        %>
                                            <a class="changelog--filename" target="_self" href="/<%= f.name %>"><%= f.name %></a>
                                        <% } else { %>
                                            <%= f.name %>
                                        <% } %>
                                    <% } %>
                                    <% if(_.find( block.blocks, (b)=> b.name == 'changes')) { %>
                                        <% if( !f.binary && f.changes.length > 0 && f.type != 'deleted') { %>
                                        <% 
                                            var changes = _.find( block.blocks, (b)=> b.name == 'changes'); 
                                            var hasDisclose = ( changes.kwargs.truncate || changes.kwargs.truncate == undefined );
                                        %>
                                        <div class="changelog--change <%= (hasDisclose) ? '-show-less' : '' %>" id='<%= c.commit+"_"+f.name.split("/").join("_").split(".").join("_") %>'>
                                            <% if( hasDisclose ) { %>
                                            <a class="changelog--disclosure" onclick="changeLogToggle('<%= c.commit+"_"+f.name.split("/").join("_").split(".").join("_") %>')">
                                                <span class="-more">Show More</span>
                                                <span class="-less">Show Less</span>
                                            </a>
                                            <% } %>
                                            <% _.each( f.changes, function(change){ %>
                                            <pre><code class="lang-diff"><%= change %></code></pre>
                                            <% }.bind(this)) %>
                                        </div>
                                        <% } %>
                                    <% } %>
                                </div>
                                <% }.bind(this)) %>
                            <% } %>
                        </div>
                    <% }.bind(this)) %>
                </div>
                `;
                templateString += block.body;
                // Return the rendered template
                return _.template( templateString ).bind(this)( { "commits" : commits, "block" : block } );
            } 
        },
        
    },

    // Hook process during build
    "hooks": 
    {
        "init": function() 
        {
            // Get options
            let pluginsConfig = this.config.values.pluginsConfig;
            let options = ( pluginsConfig && pluginsConfig.changelog ) ? _.merge( differ.defaultOptions, pluginsConfig.changelog ) : differ.defaultOptions;
            // Process commits
            commits = differ.diff( options );
        },

        "finish": function() 
        {
            // this.log.info.ln( "----------------" );
            // this.log.info.ln( this );
        },
    }
};
