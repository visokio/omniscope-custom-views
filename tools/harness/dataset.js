// CSV -> typed dataset {fields:[{name,type}], rows:[[...]]}. Works in Node and the browser.
(function (root) {
  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || r[0] !== ''; });
  }
  var DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  // Omniscope imports a time of day such as 08:00 as a DATE on 1970-01-01; mimic that.
  var TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
  function toDataset(text, types) {
    var all = parseCSV(text), head = all[0] || [], body = all.slice(1);
    var fields = head.map(function (name, c) {
      var vals = body.map(function (r) { return r[c]; }).filter(function (v) { return v !== undefined && v !== ''; });
      var type = (types && types[name]) || (vals.length && vals.every(function (v) { return !isNaN(+v) && /^\s*-?[\d.]+([eE][-+]?\d+)?\s*$/.test(v); }) ? 'NUMBER'
        : vals.length && vals.every(function (v) { return DATE_RE.test(v) || TIME_RE.test(v); }) ? 'DATE' : 'TEXT');
      return { name: name, type: type };
    });
    var rows = body.map(function (r) {
      return fields.map(function (f, c) {
        var v = r[c];
        if (v === undefined || v === '') return null;
        if (f.type === 'NUMBER') return +v;
        // The real server returns date-only values as 'yyyy-MM-dd' strings; keep them so.
        if (f.type === 'DATE' && TIME_RE.test(v)) { var hm = v.split(':'); return '1970-01-01T' + ('0' + hm[0]).slice(-2) + ':' + hm[1] + ':' + (hm[2] || '00') + '.000Z'; }
        if (f.type === 'DATE') return v.length === 10 ? v : new Date(/Z|[+-]\d{2}:?\d{2}$/.test(v) ? v : v + 'Z').toISOString();
        return v;
      });
    });
    return { fields: fields, rows: rows };
  }
  var api = { parseCSV: parseCSV, toDataset: toDataset };
  if (typeof module !== 'undefined') module.exports = api; else root.OmniDataset = api;
})(this);
