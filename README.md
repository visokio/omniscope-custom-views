# custom-views

Public repository for custom views for Omniscope 2018+.
The views added here are available to install in the view picker of Omniscope.

### List of views
[<img src="https://github.com/visokio/custom-views/raw/master/bubblechart/thumbnail.png">](bubblechart/README.md "Bubble Chart")
[<img src="https://github.com/visokio/custom-views/raw/master/calendar/thumbnail.png">](calendar/README.md "Calendar")
[<img src="https://github.com/visokio/custom-views/raw/master/francechoropleth/thumbnail.png">](francechoropleth/README.md "France Choropleth")
[<img src="https://github.com/visokio/custom-views/raw/master/kpi/thumbnail.png">](kpi/README.md "KPI")
[<img src="https://github.com/visokio/custom-views/raw/master/venndiagram/thumbnail.png">](venndiagram/README.md "Venn Diagram")

### How to create a new view

 - Add a folder with a name matching the unique view id (the view name which must not conflict with other view names).
 - The folder should have the following files (all file names have to be case-sensitive):
    * icon.svg - 32x32 px SVG icon following the same style as the existing icons.
    * index.html - main page loaded by the application to show the view.
    * manifest.json - configuration file for the view that defines the options and limitations.
    * README.md - markdown file that describes the view following the same format as the existing readme files.
    * thumbnail.png - 256x256 px screenshot.
 - Add an entry to the file view.json:
    ```
    {
        "name": "<<unique view id in lower case>>",
        "displayName": "<<view name to display in the view picker>>",
        "tags": [<<list of tags to identify the view with>>],
        "files": [<<list of additional file names that the view requires],
        "version": 0
    }
    ```
 - Make sure manifest.json has the entries for "icon", "tags" and "thumbnail". See other view manifests.