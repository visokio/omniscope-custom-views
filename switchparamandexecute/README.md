# ![](icon.svg) Switch Param and Execute Workflow

Custom view that shows a group of radio buttons to update a project parameter with one of the unique values obtained from a data field and subsequently to execute the specified blocks in the workflow.

It uses the [Workflow Execution REST API](https://help.visokio.com/support/solutions/articles/42000073133-workflow-execution-rest-apis) to get and set the parameter and to execute the workflow.

## Settings

 - Param name : the name of the parameter to set
 - Field with param values: the field in the dataset from which obtain the unique values
 - Blocks : the list of block names, comma separated, to execute.
 - Refresh from source : whether to force execution of the blocks even if they are already executed.
 - Limit number of items shown : limits the number of radio buttons that can be selected.
 - Show job state : whether to show a text field on top of the view informing about the state of the workflow execution.

![](thumbnail.png)
