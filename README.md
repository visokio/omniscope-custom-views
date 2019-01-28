# omniscope-custom-views

Public repository for custom views for Omniscope 2018+.
The views added here are available to install in the view picker of Omniscope.

### List of views

<table>
    <tr valign="top">
        <td width="33%">Bubble Chart<br><a href="bubblechart/README.md" title="Bubble Chart"><img width="290" src="https://github.com/visokio/custom-views/raw/master/bubblechart/thumbnail.png"></a></td>
        <td width="33%">Calendar<br><a href="calendar/README.md" title="Calendar"><img width="290" src="https://github.com/visokio/custom-views/raw/master/calendar/thumbnail.png"></a></td>
        <td width="33%">France Choropleth<br><a href="francechoropleth/README.md" title="France Choropleth"><img width="290" src="https://github.com/visokio/custom-views/raw/master/francechoropleth/thumbnail.png"></a></td>
    </tr>
    <tr valign="top">
        <td width="33%">KPI<br><a href="kpi/README.md" title="KPI"><img width="290" src="https://github.com/visokio/custom-views/raw/master/kpi/thumbnail.png"></a></td>
        <td width="33%">Venn Diagram<br><a href="venndiagram/README.md" title="Venn Diagram"><img width="290" src="https://github.com/visokio/custom-views/raw/master/venndiagram/thumbnail.png"></a></td>
        <td width="33%">Beeswarm<br><a href="beeswarm/README.md" title="Beeswarm"><img width="290" src="https://github.com/visokio/custom-views/raw/master/beeswarm/thumbnail.png"></a></td>
    </tr>
</table>

### How to create a new view

 - Add a folder with a name matching the unique view id (the view name which must not conflict with other view names).
 - The folder should have the following files (all file names have to be case-sensitive):
    * icon.svg - 32x32 px SVG icon following the same style as the existing icons.
    * index.html - main page loaded by the application to show the view.
    * manifest.json - configuration file for the view that defines the options and limitations.
    * README.md - markdown file that describes the view following the same format as the existing readme files.
    * thumbnail.png - 290x290 px screenshot.
    * test.ioz - Omniscope file to test the view and create a thumbnail.
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
 - Update the gallery of views in the README.md to include a thumbnail of the new view that links to the view readme file.
