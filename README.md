# Omniscope Custom Views

Public repository for custom views for Omniscope 2018+.

The views added here are available to install in the view picker of Omniscope.

Visit our forums for more info and discussion https://help.visokio.com/support/discussions/topics/42000001524 

Documentation: https://omniscope.me/_global_/customview/v1/docs/

### List of views

<table>
    <tr valign="top">
        <td width="33%">Bubble Chart<br><a href="bubblechart" title="Bubble Chart"><img width="290" src="https://github.com/visokio/custom-views/raw/master/bubblechart/thumbnail.png"></a></td>
        <td width="33%">Calendar<br><a href="calendar" title="Calendar"><img width="290" src="https://github.com/visokio/custom-views/raw/master/calendar/thumbnail.png"></a></td>
        <td width="33%">France Choropleth<br><a href="francechoropleth" title="France Choropleth"><img width="290" src="https://github.com/visokio/custom-views/raw/master/francechoropleth/thumbnail.png"></a></td>
    </tr>
    <tr valign="top">
        <td width="33%">KPI<br><a href="kpi" title="KPI"><img width="290" src="https://github.com/visokio/custom-views/raw/master/kpi/thumbnail.png"></a></td>
        <td width="33%">Venn Diagram<br><a href="venndiagram" title="Venn Diagram"><img width="290" src="https://github.com/visokio/custom-views/raw/master/venndiagram/thumbnail.png"></a></td>
        <td width="33%">Beeswarm<br><a href="beeswarm" title="Beeswarm"><img width="290" src="https://github.com/visokio/custom-views/raw/master/beeswarm/thumbnail.png"></a></td>
    </tr>
    <tr valign="top">
        <td width="33%">Spain Force Dot Density Map<br><a href="spainforcedotdensitymap" title="Spain Force Dot Density Map"><img width="290" src="https://github.com/visokio/custom-views/raw/master/spainforcedotdensitymap/thumbnail.png"></a></td>
        <td width="33%">Force Coordinate Graph<br><a href="forcecoordinategraph" title="Force Coordinate Graph"><img width="290" src="https://github.com/visokio/custom-views/raw/master/forcecoordinategraph/thumbnail2.png"></a></td>
        <td width="33%">Orbital Transaction Flow<br><a href="orbitaltransactionflow" title="Orbital Transaction Flow"><img width="290" src="https://github.com/visokio/custom-views/raw/master/orbitaltransactionflow/thumbnail.png"></a></td>
    </tr>
    <tr valign="top">
        <td width="33%">Web View<br><a href="web" title="Web View"><img width="290" src="https://github.com/visokio/custom-views/raw/master/web/thumbnail.png"></a></td>
        <td width="33%">Workflow Execution<br><a href="workflowexecution" title="Workflow Execution"><img width="290" src="https://github.com/visokio/custom-views/raw/master/workflowexecution/thumbnail.png"></a></td>
        <td width="33%">Custom View Demo<br><a href="customviewdemo" title="Custom View Demo"><img width="290" src="https://github.com/visokio/custom-views/raw/master/customviewdemo/thumbnail.png"></a></td>
    </tr>
    <tr valign="top">
        <td width="33%">Switch Param<br><a href="web" title="Switch Param"><img width="290" src="https://github.com/visokio/custom-views/raw/master/switchparam/thumbnail.png"></a></td>
        <td width="33%">Lambda Workflow Execution<br><a href="lambdaworkflowexecution" title="Lambda Workflow Execution"><img width="290" src="https://github.com/visokio/custom-views/raw/master/lambdaworkflowexecution/thumbnail.png"></a></td>
        <td width="33%">Set Parameters and Execute<br><a href="setparamandexecute" title="Set Parameters and Execute"><img width="290" src="https://github.com/visokio/custom-views/raw/master/setparamandexecute/thumbnail.png"></a></td>
    </tr>
        <tr valign="top">
        <td width="33%">Upload and Execute<br><a href="uploadandexecute" title="Upload and Execute"><img width="290" src="https://github.com/visokio/custom-views/raw/master/uploadandexecute/thumbnail.png"></a></td>
        <td width="33%">TradingView<br><a href="tradingview" title="TradingView"><img width="290" src="https://github.com/visokio/omniscope-custom-views/tree/master/tradingview/thumbnail.png"></a></td>
    </tr>
</table>

### How to create a new view

 - Add a folder with a name matching the unique view id (the view name which must not conflict with other view names).
 - The folder should have the following files (all file names have to be case-sensitive):
    * icon.svg

        32x32 px SVG icon following the same style as the existing icons.

    * index.html

        Main page loaded by the application to show the view.

    * manifest.json

        Configuration file for the view that defines the options and limitations. Manifest options should be declared with necessary restrictions (e.g. you should not be able to pick a text field in calendar view) and with descriptions inside them (for tooltips).

    * README.md

        Markdown file that describes the view following the same format as the existing readme files. Each view's readme.md file should explain what it's for (typical use case), what data structure you need for it to work, how to configure it / how the options work.

    * thumbnail.png

        290x290 px screenshot.

    * test.ioz

        Omniscope file to test the view.

 - Add an entry to the file views.json:
    ```
    {
        "name": "<<unique view id in lower case>>",
        "displayName": "<<view name to display in the view picker>>",
        "tags": [<<list of tags to identify the view with>>],
        "files": [<<list of additional file names that the view requires>>],
        "version": 0
    }
    ```
 - Make sure manifest.json has the entries for "icon", "tags" and "thumbnail". See other view manifests.
 - Update the gallery of views in the README.md to include a thumbnail of the new view that links to the view readme file.
 - Filtering must work. If you filter, the view needs to update cleanly, and if you then reload the page, the view should look the same. Make sure each render is clean, and there isn't some UI effects hanging over from the previous state. This also implies poor man's brushing works properly.

### Nice things to have

 - Selection
 - Tooltips/Labelling
 - Sizing, colouring, etc.
 - Suitability to any data. It's ok for a view to have specific data structure requirements (as long as you it's described in the readme file, and where possible manifest option tooltips)
 - Pixel-perfect (minor visual glitches that don't appear in every scenario are ok)
 - Proper brushing (note poor man's brushing is perfectly acceptable)
