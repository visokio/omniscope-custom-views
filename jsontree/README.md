# ![](icon.svg) JSON Tree

Shows a text field holding JSON as an expandable tree: objects and arrays open and close, keys and values are coloured by type, and each object or array shows how many entries it holds. Each record is one top-level node, named by an optional label field.

## Use case

Inspecting JSON kept in a dataset: API responses, event payloads, configuration records, documents from a NoSQL database. It shows the shape of the data and lets you drill into nested objects before deciding which parts to extract in the workflow.

## Data

A text field whose values are JSON, one document per record. Records whose value is empty, or is not valid JSON, show as such in the tree, with the parser's message. The view follows the report's filters and shows up to 500 records; above that a note says so.

## Settings

- **JSON field**: the text field holding the JSON.
- **Record label** (optional): a field that names each record's node, for example an ID or an endpoint. Without it the nodes are named Record 1, Record 2, and so on.

## Interaction

Click the triangle beside a node, or the node itself, to open or close it. The first record opens when the view draws. With **Record label** set, clicking a record's top-level node selects the records with that label in the rest of the report; click it again, or click empty space, to clear. Long string values are cut at 200 characters in the tree; hover them for the text (up to 2,000 characters).

Values are shown as text, never run as HTML, whatever the JSON holds.

## Third-party libraries

Loaded from the jsDelivr CDN when the view opens, so the browser showing the report needs internet access:

- [jsTree](https://www.jstree.com/) 3.3.17, MIT licence
- [jQuery](https://jquery.com/) 3.7.1, MIT licence (needed by jsTree)

The sample data in `sample-data/` is invented for the demo.
