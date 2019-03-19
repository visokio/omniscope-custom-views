importScripts('https://d3js.org/d3.v5.min.js');
onmessage = function(e) {
    var nodes = e.data.nodes;
    var simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX(function(d) { return (d.xValue !== null) ? d.x : e.data.width / 2; }).strength(1))
        .force("y", d3.forceY(function(d) { return (d.yValue !== null) ? d.y : e.data.height / 2; }).strength(1))
        .force("collide", d3.forceCollide(function(d) {
            return (e.data.mappings.markerSize) ? e.data.nodeMargin + d.size : e.data.nodeMargin + e.data.nodeRadius;
        }))
        .stop();

    for (var i = 0; i < 500; ++i) {
        simulation.tick();
        // Bound nodes inside view box
        nodes.forEach(function(d) {
            var radius = (e.data.mappings.markerSize && d) ? d.size : e.data.nodeRadius;
            d.x = Math.min(e.data.width-radius-e.data.nodeMargin, Math.max(radius+e.data.nodeMargin, d.x));
            d.y = Math.min(e.data.height-radius-e.data.nodeMargin, Math.max(radius+e.data.nodeMargin, d.y));
        });
    }

    postMessage({nodes: nodes});
};