/*
 * omniscope-mock.js: a local stand-in for /_global_/customview/v1/omniscope.js.
 *
 * Provides omniscope.view (context, on/once/off, updated, busy, error, endpoint,
 * whitespaceClick, queryBuilder) and omniscope.query.builder() with table/schema/batch
 * queries answered in the browser from a bundled dataset.
 *
 * Shapes follow what the real server returns (see real-context-kpi.json and
 * real-query-shapes.json, captured from a live Omniscope Evo server).
 *
 * Configuration is read from window.__OMNI_MOCK_CONFIG__ (set inline, e.g. by the showcase
 * builder) or from window.parent.__OMNI_MOCK_CONFIG__ (set by the host page):
 *   { viewName, manifest, options: {items:{...}}, dataset: {fields:[{name,type}], rows:[[...]]},
 *     filter, variables }
 * The host can drive the view through window.__omniMock (update, resize, setFilter, log).
 */
(function () {
  "use strict";

  var cfgFromParent = false;
  function getConfig() {
    if (window.__OMNI_MOCK_CONFIG__) return window.__OMNI_MOCK_CONFIG__;
    try { if (window.parent && window.parent !== window && window.parent.__OMNI_MOCK_CONFIG__) { cfgFromParent = true; return window.parent.__OMNI_MOCK_CONFIG__; } } catch (e) { }
    return { viewName: "Mock", manifest: { tags: [], sandbox: false, autoPane: true, autoQuery: true }, options: { items: {} }, dataset: { fields: [], rows: [] } };
  }
  var cfg = getConfig();
  // Showcase pages embed each dataset once in the parent page and pass a reference.
  if (cfg.datasetRef && !cfg.dataset) { try { cfg.dataset = window.parent.__DEMO_DATASETS__[cfg.datasetRef]; } catch (e) { } }
  var log = [];
  function emitHost(type, data) {
    var entry = { type: type, data: data, t: Date.now() };
    log.push(entry);
    try { if (window.parent && window.parent !== window && window.parent.__omniHostEvent) window.parent.__omniHostEvent(entry); } catch (e) { }
    try { if (window.__omniHostEvent) window.__omniHostEvent(entry); } catch (e) { }
  }

  // ---------------------------------------------------------------- query engine
  var FN_LABEL = { SUM: "Sum", MEAN: "Mean", MIN: "Min", MAX: "Max", MEDIAN: "Median", MODE: "Mode", SINGLETON: "Singleton",
    UNIQUE_VALUE_COUNT: "Unique values", STANDARD_DEVIATION: "Std dev", LOWER_QUARTILE: "Lower quartile", UPPER_QUARTILE: "Upper quartile",
    PERCENTILE: "Percentile", EMPTY_COUNT: "Empty count", NON_EMPTY_COUNT: "Non-empty count" };

  function table(fields, rows) { return { fields: fields, rows: rows }; }
  function baseTable() {
    var ds = cfg.dataset || { fields: [], rows: [] };
    return table(ds.fields.map(function (f) { return { name: f.name, type: f.type || "TEXT" }; }), ds.rows);
  }
  function idx(t, name) {
    for (var i = 0; i < t.fields.length; i++) if (t.fields[i].name === name) return i;
    throw queryError("No such field: " + name);
  }
  function queryError(msg) { var e = new Error(msg); e.queryValidation = true; return e; }

  function cmp(a, b) {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a) < String(b) ? -1 : 1;
  }
  function valueOf(v) { return (v && typeof v === "object" && "@visokiotype" in v) ? v.value : v; }
  function matches(t, row, f) {
    if (!f) return true;
    var type = f.type || (f.filters ? "AND" : (f.filter ? "NOT" : "FIELD_VALUE"));
    if (type === "AND") return (f.filters || []).every(function (x) { return matches(t, row, x); });
    if (type === "OR") return (f.filters || []).some(function (x) { return matches(t, row, x); });
    if (type === "NOT") return !matches(t, row, f.filter || (f.filters || [])[0]);
    if (type === "GEO_DISTANCE") return true;
    var v = row[idx(t, f.inputField)], op = f.operator || "=", target = f.value;
    if (target && typeof target === "object" && !Array.isArray(target) && ("lower" in target || "upper" in target || "start" in target || "end" in target)) {
      var lo = target.lower !== undefined ? target.lower : target.start, hi = target.upper !== undefined ? target.upper : target.end;
      return (lo === undefined || lo === null || cmp(v, lo) >= 0) && (hi === undefined || hi === null || cmp(v, hi) < 0);
    }
    switch (op) {
      case "=": return cmp(v, target) === 0 || (v !== null && target !== null && String(v) === String(target));
      case "EQUALS_IGNORE_CASE": return String(v).toLowerCase() === String(target).toLowerCase();
      case "!=": return !(cmp(v, target) === 0);
      case "<": return v !== null && cmp(v, target) < 0;
      case "<=": return v !== null && cmp(v, target) <= 0;
      case ">": return v !== null && cmp(v, target) > 0;
      case ">=": return v !== null && cmp(v, target) >= 0;
      case "IN": var arr = f.values || target || []; return arr.some(function (x) { return cmp(v, x) === 0 || String(v) === String(x); });
      case "CONTAINS": return v !== null && String(v).indexOf(String(target)) >= 0;
      case "CONTAINS_IGNORE_CASE": return v !== null && String(v).toLowerCase().indexOf(String(target).toLowerCase()) >= 0;
    }
    return true;
  }
  function filterTable(t, f) { return f ? table(t.fields, t.rows.filter(function (r) { return matches(t, r, f); })) : t; }

  function quantile(sorted, q) {
    if (!sorted.length) return null;
    var pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }
  function aggregate(fn, values, weights) {
    var nonNull = values.filter(function (v) { return v !== null && v !== undefined && v !== ""; });
    var nums = nonNull.filter(function (v) { return typeof v === "number"; });
    switch (fn) {
      case "RECORD_COUNT": return values.length;
      case "NON_EMPTY_COUNT": return nonNull.length;
      case "EMPTY_COUNT": return values.length - nonNull.length;
      case "SUM": return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) : null;
      case "MEAN":
        if (weights) { var sw = 0, s = 0; values.forEach(function (v, i) { if (typeof v === "number" && typeof weights[i] === "number") { s += v * weights[i]; sw += weights[i]; } }); return sw ? s / sw : null; }
        return nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null;
      case "MIN": return nonNull.length ? nonNull.reduce(function (a, b) { return cmp(a, b) <= 0 ? a : b; }) : null;
      case "MAX": return nonNull.length ? nonNull.reduce(function (a, b) { return cmp(a, b) >= 0 ? a : b; }) : null;
      case "UNIQUE_VALUE_COUNT": return new Set(nonNull.map(String)).size;
      case "SINGLETON": var u = Array.from(new Set(nonNull.map(function (v) { return JSON.stringify(v); }))); return u.length === 1 ? JSON.parse(u[0]) : null;
      case "MODE": var c = {}, best = null, bc = 0; nonNull.forEach(function (v) { var k = JSON.stringify(v); c[k] = (c[k] || 0) + 1; if (c[k] > bc) { bc = c[k]; best = v; } }); return best;
      case "STANDARD_DEVIATION": if (nums.length < 2) return null; var m = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length; return Math.sqrt(nums.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (nums.length - 1));
      case "MEDIAN": return quantile(nums.slice().sort(function (a, b) { return a - b; }), 0.5);
      case "LOWER_QUARTILE": return quantile(nums.slice().sort(function (a, b) { return a - b; }), 0.25);
      case "UPPER_QUARTILE": return quantile(nums.slice().sort(function (a, b) { return a - b; }), 0.75);
    }
    return null;
  }
  function measureName(m) {
    if (m.name) return m.name;
    var fn = m.function || "RECORD_COUNT";
    if (fn === "RECORD_COUNT") return "Record count";
    return m.inputField + " (" + (FN_LABEL[fn] || fn) + ")";
  }
  function bucketDate(v, unit) {
    var d = new Date(v); if (isNaN(d)) return v;
    var y = d.getUTCFullYear(), mo = d.getUTCMonth(), da = d.getUTCDate();
    switch (unit) {
      case "YEAR": d = new Date(Date.UTC(y, 0, 1)); break;
      case "QUARTER": d = new Date(Date.UTC(y, mo - mo % 3, 1)); break;
      case "MONTH": d = new Date(Date.UTC(y, mo, 1)); break;
      case "WEEK": d = new Date(Date.UTC(y, mo, da - ((d.getUTCDay() + 6) % 7))); break;
      case "DAY": d = new Date(Date.UTC(y, mo, da)); break;
      case "HOUR": d.setUTCMinutes(0, 0, 0); break;
      case "MINUTE": d.setUTCSeconds(0, 0); break;
    }
    return ["HOUR", "MINUTE", "SECOND"].indexOf(unit) >= 0 ? d.toISOString() : d.toISOString().slice(0, 10);
  }
  function nextBucket(lower, unit, n) {
    var d = new Date(lower.length === 10 ? lower + "T00:00:00Z" : lower); n = n || 1;
    switch (unit) {
      case "YEAR": d.setUTCFullYear(d.getUTCFullYear() + n); break;
      case "QUARTER": d.setUTCMonth(d.getUTCMonth() + 3 * n); break;
      case "MONTH": d.setUTCMonth(d.getUTCMonth() + n); break;
      case "WEEK": d.setUTCDate(d.getUTCDate() + 7 * n); break;
      case "DAY": d.setUTCDate(d.getUTCDate() + n); break;
      case "HOUR": d.setUTCHours(d.getUTCHours() + n); break;
      case "MINUTE": d.setUTCMinutes(d.getUTCMinutes() + n); break;
      default: d.setUTCSeconds(d.getUTCSeconds() + n);
    }
    return lower.length === 10 ? d.toISOString().slice(0, 10) : d.toISOString();
  }
  function groupKey(t, row, g) {
    var i = idx(t, g.inputField), v = row[i];
    if (g.type === "HISTOGRAM") {
      if (t.fields[i].type === "DATE") return bucketDate(v, g.dateUnit || "DAY");
      if (typeof v === "number" && g.histogramInterval) return Math.floor(v / g.histogramInterval) * g.histogramInterval;
    }
    return v === undefined ? null : v;
  }
  function aggregateTable(t, groupings, measures) {
    groupings = groupings || []; measures = measures || [];
    // Real server: RECORD_COUNT with an inputField is rejected as MALFORMED_REQUEST.
    measures.forEach(function (m) { if ((m.function || "RECORD_COUNT") === "RECORD_COUNT" && m.inputField !== undefined && m.inputField !== null) throw queryError("MALFORMED_REQUEST: RECORD_COUNT must not have an inputField"); });
    var groups = new Map(), order = [];
    t.rows.forEach(function (row) {
      var keyVals = groupings.map(function (g) { return groupKey(t, row, g); });
      var k = JSON.stringify(keyVals);
      if (!groups.has(k)) { groups.set(k, { keys: keyVals, rows: [] }); order.push(k); }
      groups.get(k).rows.push(row);
    });
    if (!groupings.length && !groups.size) { groups.set("[]", { keys: [], rows: [] }); order.push("[]"); }
    // Real server: histogram groupings return {lower, upper} ranges, type RANGE_DATE / RANGE_NUMBER, named "Week (MONTH, 1)".
    var fields = groupings.map(function (g) {
      var ft = t.fields[idx(t, g.inputField)].type;
      if (g.type === "HISTOGRAM") return { name: g.name || (g.inputField + " (" + (ft === "DATE" ? (g.dateUnit || "DAY") : "") + (ft === "DATE" ? ", " : "") + (g.histogramInterval || 1) + ")"), type: ft === "DATE" ? "RANGE_DATE" : "RANGE_NUMBER" };
      return { name: g.name || g.inputField, type: ft };
    })
      .concat(measures.map(function (m) {
        var fn = m.function || "RECORD_COUNT";
        var type = (["MIN", "MAX", "SINGLETON", "MODE"].indexOf(fn) >= 0 && m.inputField) ? t.fields[idx(t, m.inputField)].type : "NUMBER";
        return { name: measureName(m), type: type };
      }));
    var rows = order.map(function (k) {
      var g = groups.get(k);
      return g.keys.concat(measures.map(function (m) {
        var fn = m.function || "RECORD_COUNT";
        if (fn === "RECORD_COUNT") return g.rows.length;
        var i = idx(t, m.inputField);
        var w = m.weightField ? g.rows.map(function (r) { return r[idx(t, m.weightField)]; }) : null;
        if (fn === "PERCENTILE") return quantile(g.rows.map(function (r) { return r[i]; }).filter(function (v) { return typeof v === "number"; }).sort(function (a, b) { return a - b; }), (m.percentileValue || 50) / 100);
        return aggregate(fn, g.rows.map(function (r) { return r[i]; }), w);
      }));
    });
    groupings.forEach(function (g, gi) {
      if (g.type !== "HISTOGRAM") return;
      var isDate = t.fields[idx(t, g.inputField)].type === "DATE", step = g.histogramInterval || 1;
      rows.forEach(function (r) { var lo = r[gi]; if (lo === null || lo === undefined) return; r[gi] = { lower: lo, upper: isDate ? nextBucket(lo, g.dateUnit || "DAY", step) : lo + step }; });
    });
    // Default ordering of grouped output: by grouping values ascending (the real server returns sorted groups).
    var kv = function (v) { return v && typeof v === "object" && "lower" in v ? v.lower : v; };
    if (groupings.length) rows.sort(function (a, b) { for (var i = 0; i < groupings.length; i++) { var c = cmp(kv(a[i]), kv(b[i])); if (c) return c; } return 0; });
    return table(fields, rows);
  }
  function sortTable(t, sorts) {
    if (!sorts || !sorts.length) return t;
    var rows = t.rows.slice().sort(function (a, b) {
      for (var s = 0; s < sorts.length; s++) {
        var i = idx(t, sorts[s].inputField || sorts[s].field), c = cmp(a[i], b[i]);
        if (c) return (sorts[s].direction === "DESCENDING") ? -c : c;
      }
      return 0;
    });
    return table(t.fields, rows);
  }
  function rangeTable(t, r) { if (!r) return t; var s = r.start || 0; return table(t.fields, t.rows.slice(s, r.length == null ? undefined : s + r.length)); }
  function project(t, fields) {
    if (!fields) return t;
    var is = fields.map(function (f) { return idx(t, typeof f === "string" ? f : (f.inputField || f.name)); });
    return table(is.map(function (i) { return t.fields[i]; }), t.rows.map(function (r) { return is.map(function (i) { return r[i]; }); }));
  }
  function evalQuery(q) {
    if (!q) return baseTable();
    var vt = q["@visokiotype"] || "";
    if (/DefaultSource|NamedSource|IndexedSource/.test(vt)) return baseTable();
    var input = q.input ? evalQuery(q.input) : baseTable();
    if (/RecordFilterOperation/.test(vt)) return filterTable(input, q.filter);
    if (/AggregateOperation/.test(vt)) return aggregateTable(input, q.groupings, q.measures);
    if (/SortOperation/.test(vt)) return sortTable(input, q.sorts);
    if (/RangeOperation/.test(vt)) return rangeTable(input, q.range || q);
    // SimpleQuery
    var t = filterTable(input, q.filter);
    if ((q.groupings && q.groupings.length) || (q.measures && q.measures.length)) t = aggregateTable(t, q.groupings, q.measures);
    else t = project(t, q.fields);
    t = sortTable(t, q.sorts);
    return rangeTable(t, q.range);
  }
  function schemaOut(t) { return { schema: { fields: t.fields.map(function (f) { return { name: f.name, type: f.type }; }), isEditable: false } }; }
  function tableOut(t) { var o = schemaOut(t); o.records = t.rows; return o; }

  // ---------------------------------------------------------------- query builder
  function Request(kind, q) {
    var handlers = {}, self = this, cancelled = false;
    this.on = function (ev, fn) { [].concat(ev).forEach(function (e) { (handlers[e] = handlers[e] || []).push(fn); }); return self; };
    this.cancel = function () { cancelled = true; return self; };
    this.execute = function () {
      var delay = (cfg.queryDelayMs != null) ? cfg.queryDelayMs : 15;
      setTimeout(function () {
        if (cancelled) return;
        var data, type = "load";
        try {
          if (kind === "table") data = tableOut(evalQuery(q));
          else if (kind === "schema") data = schemaOut(q ? evalQuery(q) : baseTable()).schema;
          else if (kind === "batch") data = { results: (q.queries || q || []).map(function (x) { return tableOut(evalQuery(x)); }) };
          else if (kind === "formula") data = { value: null };
          emitHost("query", { kind: kind, query: q, rows: data && data.records ? data.records.length : undefined });
        } catch (e) {
          type = "error";
          data = { message: "Invalid request received on the server: " + e.message, internal: { validationMessage: e.message, reason: "INVALID_REQUEST" }, responseCode: 400 };
          emitHost("queryError", data);
        }
        (handlers[type] || []).forEach(function (fn) { fn({ type: type, data: data }); });
      }, delay);
      return self;
    };
  }
  function builder(endpoint) {
    return {
      endpoint: endpoint,
      table: function (q) { return new Request("table", q); },
      schema: function (q) { return new Request("schema", q); },
      batch: function (q) { return new Request("batch", q); },
      formula: function (q) { return new Request("formula", q); }
    };
  }

  // ---------------------------------------------------------------- view context
  var ENDPOINT = "mock://query/input/0/api";
  var FILTER_EMPTY = function () { return { "@visokiotype": "QueryApi.Filter", type: "AND", inputField: null, operator: null, value: null, filters: [], geoDistance: null }; };
  var listeners = {};
  var ctx;

  function paneOptions() {
    // Defaults copied from a real server context (real-context-kpi.json).
    return Object.assign({ "@visokiotype": "CustomViewApi.AutoPaneOptions", yAxisHeaderWidth: 75, paneWidth: 100, paneHeight: 100, showGridLines: true, gridLineThickness: 1,
      gridLineColour: "rgba(36,45,59,0.149)", showPaneXHeader: true, showPaneYHeader: true, showTileHeader: true, tileHeaderAlignment: "CENTER", xHeaderPlacement: "TOP", yHeaderPlacement: "LEFT",
      showColourKeyInEveryPane: false, enableTouchScrolling: false },
      ((cfg.manifest || {}).defaultOptions || {}).pane || {});
  }
  // The schema: "'paneX' and 'paneY' are special properties that apply to auto paning and are always skipped by
  // auto query". Options merely placed on the X or Y axis by options.structure are still queried.
  function paneOptionKeys() {
    return ["paneX", "paneY"];
  }
  function autoQuery() {
    var m = cfg.manifest || {};
    if (!m.autoQuery) return null;
    var defs = (m.options || {}).items || {}, items = (cfg.options || {}).items || {}, paneKeys = paneOptionKeys();
    var groupings = [], measures = [], gmap = [], mmap = [];
    // The real server does not keep manifest order (a capture gave colour before point), so the mock
    // orders option keys alphabetically: views must read columns through result.mappings.
    Object.keys(defs).sort().forEach(function (k) {
      if (paneKeys.indexOf(k) >= 0) return;
      var v = items[k];
      if (v === undefined || v === null) return;
      var arr = Array.isArray(v) ? v : [v];
      if (defs[k].type === "GROUPING") arr.forEach(function (g) { gmap.push([k, defs[k].list]); groupings.push(typeof g === "string" ? { inputField: g } : g); });
      if (defs[k].type === "MEASURE") arr.forEach(function (x) { mmap.push([k, defs[k].list]); measures.push(typeof x === "string" ? { inputField: x, function: "SUM" } : x); });
    });
    var q = { groupings: groupings, measures: measures, filter: ctx ? ctx.dataConfig.filter : null, range: { start: 0, length: m.dataLimit || 10000 } };
    var t, mappings = {};
    try {
      if (!groupings.length && !measures.length) t = table([], []);
      else t = rangeTable(aggregateTable(filterTable(baseTable(), q.filter), groupings, measures), q.range);
    } catch (e) { return { "@visokiotype": "CustomViewApi.AutoQueryResult", data: null, error: e.message }; }
    var all = gmap.concat(mmap), counters = {};
    var fields = t.fields.map(function (f, i) {
      var k = all[i][0];
      if (all[i][1]) { (mappings[k] = mappings[k] || []).push(i); } else mappings[k] = i;
      counters[k] = (counters[k] || 0) + 1;
      return { "@visokiotype": "QueryApi.SchemaField", name: "_" + (i + 1) + "_" + (i < gmap.length ? "grouping" : "measure") + "_" + f.name, type: f.type };
    });
    return { "@visokiotype": "CustomViewApi.AutoQueryResult", data: { "@visokiotype": "QueryApi.TableQueryOutput", schema: { "@visokiotype": "QueryApi.SchemaFieldsQueryOutput", fields: fields, isEditable: false }, records: t.rows }, shadowData: null, mappings: mappings };
  }

  function buildContext() {
    var m = cfg.manifest || {};
    var items = JSON.parse(JSON.stringify(Object.assign({}, (m.defaultOptions || {}).items || {}, (cfg.options || {}).items || {})));
    ctx = {
      "@visokiotype": "CustomViewApi.ViewApiContext",
      viewName: cfg.viewName || m.name || "Custom view",
      viewInstanceId: 1,
      // cfg.baseUrl lets a test give a realistic report URL (<project>.iox/er/Report/customview/<View>/).
      baseUrl: cfg.baseUrl || location.href.replace(/[^/]*$/, ""),
      dataConfig: {
        "@visokiotype": "CustomViewApi.DataConfig",
        queryApiEndpoint: ENDPOINT,
        queryApiRootNode: { "@visokiotype": "QueryApi.DefaultSource" },
        paneXFilter: FILTER_EMPTY(), paneYFilter: FILTER_EMPTY(),
        filter: cfg.filter || FILTER_EMPTY(),
        shadowFilter: null, baseFilter: FILTER_EMPTY(), baseShadowFilter: null
      },
      viewSelection: ctx ? ctx.viewSelection : null,
      globalOptions: { "@visokiotype": "CustomViewApi.GlobalOptions", viewerMode: true, isDataEditingAllowed: false, isReportInEditMode: false, canExportData: false, showViewMenu: false, imageSets: [], linkDefinitions: [], viewSelectionMode: "INHERIT" },
      options: { "@visokiotype": "CustomViewApi.ViewOptions", items: items, custom: null, pane: paneOptions() },
      supportsSelection: !!m.supportsSelection,
      // The real server hands back a normalised manifest with every pane default filled in.
      manifest: Object.assign({}, m, { defaultOptions: Object.assign({ items: {} }, m.defaultOptions || {}, { pane: paneOptions() }) }),
      pane: { "@visokiotype": "CustomViewApi.AutoPaneCell", position: { x: 0, y: 0 } },
      variables: cfg.variables || {},
      variableDefinitions: [],
      customViewVersion: 1
    };
    ctx.result = autoQuery();
    return ctx;
  }

  function fire(ev, data) {
    (listeners[ev] || []).slice().forEach(function (l) {
      if (l.once) off(ev, l.fn);
      try { l.fn({ type: ev, data: data }); } catch (e) { emitHost("exception", { event: ev, message: e.message, stack: e.stack }); setTimeout(function () { throw e; }); }
    });
  }
  function on(evs, fn, once) { [].concat(evs).forEach(function (e) { (listeners[e] = listeners[e] || []).push({ fn: fn, once: !!once }); }); }
  function off(evs, fn) { [].concat(evs).forEach(function (e) { listeners[e] = (listeners[e] || []).filter(function (l) { return l.fn !== fn; }); }); }

  var view = {
    context: function () { return ctx; },
    endpoint: function () { return ENDPOINT; },
    on: function (e, f) { on(e, f, false); },
    once: function (e, f) { on(e, f, true); },
    off: off,
    busy: function (b) { emitHost("busy", !!b); },
    error: function (message, internal) { emitHost("error", { message: String(message), internal: internal }); },
    updated: function () {
      var sel = ctx.viewSelection;
      if (sel && !sel.filter && sel.type) sel = ctx.viewSelection = { filter: sel };
      emitHost("updated", { viewSelection: sel ? JSON.parse(JSON.stringify(sel)) : null });
    },
    whitespaceClick: function () { emitHost("whitespaceClick", null); },
    queryBuilder: function () { return builder(ENDPOINT); },
    parent: null
  };
  window.omniscope = { view: view, query: { builder: builder }, __mock: true };

  // ---------------------------------------------------------------- workflow REST API
  // A stand-in for the project's Workflow REST API (<project>.iox/w/...), which control views call with
  // XMLHttpRequest or fetch: execute, lambdaexecute, uploadandexecute, job/<id>/state, param, updateparams.
  // Requests are answered in the browser (never sent) and logged as "workflowRequest" host events, so tests can
  // check what each click would send. Configure with cfg.workflow:
  //   { params: [{name, type, value}],  blocks: [names] (if given, other block names give BLOCKS_NOT_FOUND),
  //     states: ["QUEUED", "RUNNING", "COMPLETED"] (successive job state polls; the last repeats),
  //     failBlocks: [names] (a job running one of them ends FAILED), permission: false (every call 401),
  //     respond: { "POST w/execute": {status, body} } (fixed answer for one endpoint), delayMs }
  // Shapes follow the Workflow REST API article in the Omniscope knowledge base.
  var WF_RE = /\/w\/(execute|lambdaexecute|uploadandexecute|updateparams\/?|param(\/.*)?|job\/([^/]+)\/state)$/;
  var wf = { jobs: {}, seq: 0, requests: [] };
  // In the host page the server-side state (jobs, requests, parameter values) outlives the view's iframe, as on a
  // real server, so a test can reload the view mid-job ({reload: true} in run-test.js).
  try { if (cfgFromParent) { if (window.parent.__omniMockWorkflowState) wf = window.parent.__omniMockWorkflowState; else window.parent.__omniMockWorkflowState = wf; } } catch (e) { }
  function wfCfg() { return cfg.workflow || {}; }
  function wfParams() { var w = wfCfg(); if (!w.params) w.params = []; return w.params; }
  function wfBody(body) {
    if (body === undefined || body === null) return null;
    if (typeof body === "string") { try { return JSON.parse(body); } catch (e) { return body; } }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      var o = {};
      body.forEach(function (v, k) {
        if (typeof File !== "undefined" && v instanceof File) o[k] = { file: v.name, size: v.size, type: v.type };
        else { try { o[k] = JSON.parse(v); } catch (e) { o[k] = v; } }
      });
      return o;
    }
    return String(body);
  }
  function wfProjectPath(url) { var m = /^[a-z]+:\/\/[^/]+\/(.*\.iox)\//i.exec(url); return m ? m[1] : "Project.iox"; }
  function wfStartJob(blocks, url, lambda) {
    var w = wfCfg(), known = w.blocks;
    if (known && blocks.some(function (b) { return known.indexOf(b) < 0; }))
      return { status: 404, body: { errorType: "BLOCKS_NOT_FOUND", errorMessage: "One or more blocks could not be found in the workflow: " +
        blocks.filter(function (b) { return known.indexOf(b) < 0; }).join(", ") + " could not be found." } };
    var running = Object.keys(wf.jobs).some(function (id) { return !wf.jobs[id].done && !wf.jobs[id].lambda; });
    if (running && !lambda) return { status: 409, body: { errorType: "WORKFLOW_ALREADY_RUNNING", errorMessage: "There is another execution running or queued for this file." } };
    var id = "JOB_" + (++wf.seq);
    var states = (w.states || ["QUEUED", "RUNNING", "COMPLETED"]).slice();
    if ((w.failBlocks || []).some(function (b) { return blocks.indexOf(b) >= 0 || (!blocks.length); })) states[states.length - 1] = "FAILED";
    wf.jobs[id] = { blocks: blocks, states: states, polls: 0, done: false, lambda: !!lambda };
    var out = { jobId: id };
    if (lambda) out.lambdaProjectPath = wfProjectPath(url).replace(/\.iox$/, "") + " lambda " + wf.seq + ".iox/";
    return { status: 200, body: out };
  }
  function wfApplyParams(updates) {
    var ps = wfParams(), bad = (updates || []).filter(function (u) { return !ps.some(function (p) { return p.name === u.name; }); });
    if (bad.length) return { status: 400, body: { status: "FAIL", errorType: "PARAM_NOT_FOUND", errorMessage: "Parameter '" + bad[0].name + "' not found" } };
    (updates || []).forEach(function (u) { ps.forEach(function (p) { if (p.name === u.name) p.value = u.value; }); });
    return null;
  }
  function wfAnswer(method, url, body) {
    var w = wfCfg(), m = WF_RE.exec(url.split("?")[0]), ep = m[1].replace(/\/$/, ""), key = method + " w/" + ep.replace(/^job\/[^/]+\/state$/, "job/state").replace(/^param\/.+$/, "param/name");
    if (w.permission === false) return { status: 401, body: "Unauthorised", text: true };
    if (w.respond && w.respond[key]) return w.respond[key];
    if (ep === "execute" && method === "POST") {
      var bad = body && body.params ? wfApplyParams(body.params.updates) : null;
      return bad || wfStartJob((body && body.blocks) || [], url, false);
    }
    if ((ep === "lambdaexecute" || ep === "uploadandexecute") && method === "POST") {
      var req = ep === "uploadandexecute" ? (body && body.execution) || {} : body || {};
      return wfStartJob(req.blocks || [], url, true);
    }
    if (ep === "updateparams" && method === "POST") return wfApplyParams(body && body.updates) || { status: 200, body: { status: "SUCCESS" } };
    if (/^param/.test(ep) && method === "GET") {
      var name = m[2] ? decodeURIComponent(m[2].slice(1)) : "";
      if (!name) return { status: 200, body: { paramValues: JSON.parse(JSON.stringify(wfParams())) } };
      var p = wfParams().filter(function (x) { return x.name === name; })[0];
      return p ? { status: 200, body: JSON.parse(JSON.stringify(p)) } : { status: 404, body: { status: "FAIL", errorType: "PARAM_NOT_FOUND", errorMessage: "Parameter '" + name + "' not found" } };
    }
    if (m[3] && method === "GET") {
      var job = wf.jobs[decodeURIComponent(m[3])];
      if (!job) return { status: 404, body: { errorType: "JOB_NOT_FOUND", errorMessage: "Job with id " + m[3] + " could not be found" } };
      var st = job.states[Math.min(job.polls++, job.states.length - 1)];
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(st) >= 0) job.done = true;
      return { status: 200, body: { jobState: st } };
    }
    return { status: 405, body: { errorMessage: "Method not allowed" } };
  }
  function wfHandle(method, url, rawBody) {
    var body = wfBody(rawBody), entry = { method: method, url: url, body: body };
    wf.requests.push(entry);
    emitHost("workflowRequest", entry);
    var a = wfAnswer(method, url, body);
    return { status: a.status, text: typeof a.body === "string" ? a.body : JSON.stringify(a.body) };
  }
  (function patchXhr() {
    var Real = window.XMLHttpRequest;
    if (!Real || Real.__omniMock) return;
    function Mock() {
      var real = new Real(), self = this, mocked = null, listeners = {};
      this._real = real;
      this.open = function (method, url) {
        var abs = String(url);
        try { abs = new URL(url, location.href).href; } catch (e) { }
        if (WF_RE.test(String(url).split("?")[0]) || WF_RE.test(abs.split("?")[0])) { mocked = { method: String(method).toUpperCase(), url: abs, readyState: 1, status: 0, responseText: "" }; return; }
        mocked = null; return real.open.apply(real, arguments);
      };
      this.setRequestHeader = function () { if (!mocked) return real.setRequestHeader.apply(real, arguments); };
      this.send = function (b) {
        if (!mocked) return real.send.apply(real, arguments);
        var delay = wfCfg().delayMs != null ? wfCfg().delayMs : 20;
        setTimeout(function () {
          var r = wfHandle(mocked.method, mocked.url, b);
          mocked.readyState = 4; mocked.status = r.status; mocked.responseText = r.text;
          ["readystatechange", "load", "loadend"].forEach(function (t) {
            var ev = { type: t, target: self, currentTarget: self };
            if (typeof self["on" + t] === "function") self["on" + t].call(self, ev);
            (listeners[t] || []).forEach(function (fn) { fn.call(self, ev); });
          });
        }, delay);
      };
      this.addEventListener = function (t, fn) { (listeners[t] = listeners[t] || []).push(fn); real.addEventListener(t, fn); };
      this.removeEventListener = function (t, fn) { listeners[t] = (listeners[t] || []).filter(function (f) { return f !== fn; }); real.removeEventListener(t, fn); };
      this.abort = function () { if (!mocked) real.abort(); };
      this.getResponseHeader = function (h) { return mocked ? (/content-type/i.test(h) ? "application/json" : null) : real.getResponseHeader(h); };
      this.getAllResponseHeaders = function () { return mocked ? "content-type: application/json\r\n" : real.getAllResponseHeaders(); };
      ["readyState", "status", "responseText", "response", "statusText"].forEach(function (p) {
        Object.defineProperty(self, p, { get: function () {
          if (!mocked) return real[p];
          if (p === "response") return mocked.responseText;
          if (p === "statusText") return mocked.status === 200 ? "OK" : "Error";
          return mocked[p];
        } });
      });
      ["onreadystatechange", "onload", "onerror", "onloadend", "timeout", "withCredentials", "responseType"].forEach(function (p) {
        Object.defineProperty(self, p, { get: function () { return mocked ? self["_" + p] : real[p]; }, set: function (v) { self["_" + p] = v; real[p] = v; } });
      });
    }
    ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"].forEach(function (k, i) { Mock[k] = i; Mock.prototype[k] = i; });
    Mock.__omniMock = true;
    window.XMLHttpRequest = Mock;
    if (window.fetch) {
      var realFetch = window.fetch;
      window.fetch = function (input, init) {
        var url = typeof input === "string" ? input : (input && input.url) || String(input), abs = url;
        try { abs = new URL(url, location.href).href; } catch (e) { }
        if (!WF_RE.test(url.split("?")[0]) && !WF_RE.test(abs.split("?")[0])) return realFetch.apply(this, arguments);
        var method = ((init && init.method) || "GET").toUpperCase(), b = init && init.body;
        return new Promise(function (resolve) {
          setTimeout(function () {
            var r = wfHandle(method, abs, b);
            resolve(new Response(r.text, { status: r.status, headers: { "Content-Type": "application/json" } }));
          }, wfCfg().delayMs != null ? wfCfg().delayMs : 20);
        });
      };
    }
  })();

  // ---------------------------------------------------------------- host controls
  window.__omniMock = {
    log: log,
    config: cfg,
    evalQuery: evalQuery,
    workflow: wf,
    update: function (patch) {
      if (patch) {
        if (patch.options) cfg.options = patch.options;
        if (patch.dataset) cfg.dataset = patch.dataset;
        if ("filter" in patch) cfg.filter = patch.filter;
        if (patch.variables) cfg.variables = patch.variables;
      }
      buildContext(); fire("update", ctx);
    },
    setFilter: function (f) { this.update({ filter: f }); },
    resize: function () { fire("resize", ctx); },
    action: function (name) { fire("action", name); }
  };

  buildContext();
  window.addEventListener("resize", function () { fire("resize", ctx); });
  function start() { setTimeout(function () { emitHost("load", null); fire("load", ctx); }, 0); }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
