importScripts('https://d3js.org/d3.v5.min.js');
importScripts('d3-ForceEdgeBundling.js');
self.onmessage = function(e) {
    var fbundling = d3.ForceEdgeBundling()
        .nodes(e.data.beesArray)
        .edges(e.data.linkIds);
    var results = fbundling();
    self.postMessage(results);
};