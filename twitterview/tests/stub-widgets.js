// Test stand-in for X's widgets.js: follows the documented twttr.ready queue and createTweet(id, el, options)
// promise, draws a placeholder instead of the post, and records each call in window.__tw.
(function () {
  var t = window.twttr || {}, queue = t._e || [];
  window.__tw = { calls: [] };
  t.widgets = {
    createTweet: function (id, el, opts) {
      window.__tw.calls.push({ id: id, opts: opts });
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (id === '1') return resolve(undefined); // "post not available"
          var d = document.createElement('div');
          d.className = 'stub-post';
          d.setAttribute('data-id', id);
          d.style.cssText = 'width:100%;max-width:550px;height:180px;margin:0 auto;border:1px solid #cfd9de;border-radius:12px;' +
            'display:flex;align-items:center;justify-content:center;font:14px sans-serif;' +
            (opts.theme === 'dark' ? 'background:#000;color:#e7e9ea;' : 'background:#fff;color:#0f1419;');
          d.textContent = 'Post ' + id + ' (test stand-in for the X embed)';
          el.appendChild(d);
          resolve(d);
        }, 30);
      });
    }
  };
  t.ready = function (f) { f(t); };
  window.twttr = t;
  queue.forEach(function (f) { f(t); });
})();
