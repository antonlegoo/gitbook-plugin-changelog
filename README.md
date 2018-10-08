# Change-log Gitbook Plugin

A plugin for Gitbook that generates a change-log page based on git history.

## How to use it

1) Configure the plugin in your `book.json`:

```
{
    "plugins": ["changelog"]
}
```

2) Create the change-log page

```
{% changelog %}
    {% date %}
    {% message %}
    {% files %}
        {% badge %}
        {% filename link=true %}
        {% changes truncate=true %}
    {% endfiles %}
{% endchangelog %} 
```

3) Update your `SUMMARY.md` to add a link to the change-log page.

```
### Changelog

* [Change Log](changelog.md)
```

## Options

This plugin takes the following options:

* `diffFilter` : filters the inclusion files based their status. See the [diff-filter](https://git-scm.com/docs/git-diff#git-diff---diff-filterACDMRTUXB82308203) argument of the `git diff` command for options.
* `dateFormat` : formats the output of dates. See [momentjs formatting](https://momentjs.com/docs/#/displaying/format/) for formatting options.
* `ignore`
    * `files` : an array of file names to ignore
    * `exts` : an array of file extensions to ignore
    * `firstCommit` : ignore the very first commit in the history
    * `commits` : an array of commit hashes to ignore, e.g ["1e3f1b8",...]

The default options are: 

```
{
    "diffFilter" : "ADM",
    "dateFormat" :  "MMM, DD YYYY",
    "ignore" : 
    {
        "files" : [ "README.md", "SUMMARY.md", "book.json", "package-lock.json", "package.json", ],
        "exts" : [],
        "firstCommit" : false,
        "commits" : [],
    }
}
```

To customize the options for your project update your `book.json`:
```
"pluginsConfig": {
    "changelog" : {
        // your custom options here
    },
}
```