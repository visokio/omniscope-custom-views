# ![](icon.svg) 3D Force Graph

Custom view that renders a 3D force-directed graph using the [3d-force-graph](https://github.com/vasturiano/3d-force-graph) library.

## Use case

Visualise network relationships in 3D using Three.js force layout.

Hover over a node to see its value in a tooltip.
Hover over a link to see the connection displayed as `source -> target`.

 - **Link width (optional)**: Numeric measure controlling the thickness of each link.
 - **Background (optional)**: Background colour of the graph. Defaults to `#ffffff`.
=======

## Settings

 - **Source**: Field representing the link source node.
 - **Target**: Field representing the link target node.
 - **Group (optional)**: Categorical field used to colour nodes.


## Libraries
 - [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
 - [Three.js](https://threejs.org/)
