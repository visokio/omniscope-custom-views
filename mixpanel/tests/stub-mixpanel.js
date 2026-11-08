// Test stand-in for Mixpanel's library (mixpanel.min.js): takes over the loader snippet's queue as the real library
// does, and records init and track calls in window.__mp instead of sending them anywhere.
(function () {
  var queue = window.mixpanel || [], rec = window.__mp = { inits: [], events: [] };
  var api = {
    init: function (token, config) { rec.inits.push({ token: token, config: config }); },
    track: function (name, props) { rec.events.push({ name: name, props: props }); }
  };
  (queue._i || []).forEach(function (i) { api.init(i[0], i[1]); });
  for (var i = 0; i < queue.length; i++) {
    var call = queue[i];
    if (Array.isArray(call) && api[call[0]]) api[call[0]].apply(api, call.slice(1));
  }
  window.mixpanel = api;
})();
