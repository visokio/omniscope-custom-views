# ![](icon.svg) Switch Param and Execute Workflow

Radio buttons that set a project parameter to one of a field's values, then execute workflow blocks with it. Pick a region, a year or a scenario in the report, and the workflow re-runs and the report updates.

The view uses the project's [Workflow REST API](https://help.visokio.com/support/solutions/articles/42000073133-workflow-execution-rest-apis): `GET <project>.iox/w/param/<name>` to read the parameter, `POST <project>.iox/w/updateparams` to set it, then `POST <project>.iox/w/execute` and `GET <project>.iox/w/job/<job id>/state` once a second until the job ends.

## Use case

- A region or scenario picker for a report whose data is produced by a parameterised workflow: a filter, a formula or a database query that uses the parameter.
- Switching which period an expensive extract covers, from the report that shows it.

## Data

The choices are the distinct values of a field in the view's data, in Omniscope's order (sorted). Empty values are left out. The view's data follows the report's filters. Feed the view from a source that lists every value (for example the unfiltered data, as a second input of the report): if the list came from data filtered by the parameter itself, after the first switch it would only offer the current value.

## Settings

- **Parameter name** (required): the project parameter to set, exactly as named in the workflow.
- **Values from** (required): the field whose distinct values become the choices.
- **Blocks to execute**: block names separated by commas, for example `Report`. Leave empty to execute the whole workflow.
- **Refresh from source** (default on): the blocks reload their data from the sources. Off: data already loaded upstream is reused, which is quicker when the parameter is only used by a filter or a formula.
- **Most values shown** (default 10): the view lists at most this many values and says how many there are.
- **Show job state** (default on): shows the progress under the values ("Region set to South; running"). Errors are shown whether or not this is on.

## Values

The current value of the parameter is ticked when the view opens, and read again when the report's data or the view's settings change. If the current value is not among the choices, the view says "Current value: ...". Number parameters are set to numbers, others to the text of the value. Opening, filtering or resizing the view never sets the parameter or executes anything; only a click does.

## Requirements

The viewer's user needs the **Project parameters access via APIs** and **Workflow Execution via APIs** permissions on the Omniscope server (both off by default). If the server refuses the change, its message is shown, the previous value stays ticked and nothing is executed.

## Interaction

Click a value: the parameter is set, then the blocks are executed. The values are disabled until the job ends. Clicking the value already set does nothing. If Omniscope reloads the view while the job runs (it does when a block the view reads is executed, or a parameter it reads changes), the view picks the job up again and shows its progress and result. The result stays shown for two minutes after such a reload.

The view has nothing to select. A click on empty space clears the report's selection, as in other views; a click on a value does not.

![screenshot](thumbnail.png)

## Related views

[Switch Param](../switchparam) sets the parameter without executing; [Set Parameters and Execute](../setparamandexecute) sets several parameters from typed values.

## Third-party libraries

None: the view is plain HTML and JavaScript and needs nothing beyond Omniscope's custom view API.
