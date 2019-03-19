importScripts('https://d3js.org/d3.v5.min.js');
importScripts('d3-ForceEdgeBundling.js');
onmessage = function(e) {
    var fbundling = d3.ForceEdgeBundling()
        .nodes(e.data.nodes)
        .edges(e.data.edges);
    var results = fbundling();
    postMessage({edges: results});
};