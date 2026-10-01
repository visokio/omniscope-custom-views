// @ts-check
/*
 * strata-view.js - draws a Strata chart from data, at any zoom, in the browser.
 * Type-checked by tsc (JSDoc types, strict) and covered by the unit tests.
 *
 * The page carries data, not drawings; this lays it out with strata-cloth.js
 * and draws it into an <svg>. Kept free of the page's scrolling and controls,
 * so any page or an Omniscope custom view can use it.
 *
 *   const g = StrataView.layout(data, dayPx, viewportWidth)   // lay the cloth for a zoom
 *   StrataView.draw(svg, data, g, from, to)    // draw pixel columns from..to
 *
 * data (seconds are from the chart's left edge):
 *   span, view, left, right, room, labels ("end" | "start" | null)
 *   gap, radius, soften, minDrawnPx
 *   days: [[start, label, weekday]], axis: {work: [8, 16], dots: [8, 12, 16], standup: [9, 30]}
 *   segs: [{s, e, c: [strong, medium, faint] colours, name, f: strong [[a, b]], w: medium [[a, b]]}]
 *         in layer order, bottom first
 *   foot, foot2: the heavy line along the foot, two series [[a, b]], the first on top
 *   names: what the tooltip calls the states and the foot series (all optional)
 */
(function (root) {
  "use strict";
  /** @type {typeof import("./strata-cloth.js")} */
  // @ts-ignore - require exists only in Node, where the page's global does not
  const Cloth = root.StrataCloth || (typeof require !== "undefined" ? require("./strata-cloth.js") : null);

  /** @typedef {[number, number]} Pair - [from, to], seconds from the chart's left edge */
  /**
   * @typedef {object} Seg
   * @property {number} s  opened
   * @property {number} e  closed, or the right edge if still open
   * @property {[string, string, string]} c  colours: strong, medium, faint
   * @property {string} name  what it is called on screen
   * @property {Pair[]} f  its strong stretches (in a session: someone's focus)
   * @property {Pair[]} w  its medium ones (in a session: an agent at work)
   * @property {number[]} [m]  moments on it (a commit), sorted: drawn as small pinches on the line
   * @property {number[]} [b]  moments of a second kind (a merge), sorted: drawn as small ticked badges
   */
  /**
   * @typedef {object} StrataData
   * @property {number} span  seconds from left edge to right
   * @property {number} view  the screen width assumed when none is given
   * @property {number} left  @property {number} right  margins, px
   * @property {number} room  px beside the plot for end labels
   * @property {"end" | "start" | null} labels
   * @property {number} gap  @property {number} radius  @property {number} soften  the cloth
   * @property {number} minDrawnPx  the least width a line is drawn
   * @property {boolean} [markPeak]  mark the moment the most layers were open, with the count
   * @property {number} [plotH]  at least this tall a plot, px (a pane to fill; default as the layers need)
   * @property {[number, string, number][]} days  [start, label, weekday (0 = Monday)]
   * @property {{work: number[], dots: number[], standup: number[] | null} | null} axis
   *   the working day under the foot line, in hours; null for none; standup, a daily meeting's
   *   time [hours, minutes], or null
   * @property {Seg[]} segs  in layer order, bottom first
   * @property {Pair[]} foot  @property {Pair[]} foot2  the foot line's two series, the first on top
   * @property {{strong?: string, medium?: string, faint?: string, foot?: string, foot2?: string}} [names]
   *   what the tooltip calls each state and each foot series
   * @property {{m?: string, b?: string}} [moments]  what the moments are called, pinches and badges
   *   ("commit", "merge")
   */
  /**
   * @typedef {object} Geometry
   * @property {number} dayPx @property {number} width @property {number} height
   * @property {number} left @property {number} right @property {number} columns
   * @property {number} spp  seconds a pixel
   * @property {{start: number, end: number}[]} segs  as drawn (widened if too narrow to see)
   * @property {{k0: number, ys: Float64Array}[]} laid  each layer's first column and heights
   * @property {number} floorY @property {number} baseY @property {number} plotH
   * @property {(t: number) => number} x
   */

  const TOP = 40, BOTTOM = 4, STEP = 2;
  // Moments closer together than this, in px, make one mark, a little bigger.
  const MOMENT_PX = 7;
  // A pinch's triangle: its point this far from the line's middle (half its
  // 5.5 px stroke; lit, 7.5), this long and this wide at its base; a few
  // together, a little longer, up to `more`.
  const PINCH = {edge: 2.75, litEdge: 3.75, long: 2.6, wide: 4.2, more: 1.2};

  /** @param {string} text */
  function esc(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /** Pixels a day below which the working-day marks are left off. */
  const AXIS_DAY_PX = 72;
  /** Pixels a day below which the cloth's curves shrink with the zoom. */
  const FIRM_DAY_PX = 48;

  /**
   * Lay the cloth for a zoom of dayPx pixels a day, at least `viewport` wide
   * (the screen it is shown in; data.view if not given).
   * @param {StrataData} data @param {number} dayPx @param {number} [viewport]
   * @returns {Geometry}
   */
  function layout(data, dayPx, viewport) {
    const right = data.right + data.room;
    const plotW = Math.max((viewport || data.view) - data.room,
                           data.left + data.right + Math.round(dayPx * data.span / 86400));
    const width = plotW + data.room;
    const columns = plotW - data.left - data.right;
    const spp = data.span / columns;
    // The cloth is laid from the true times, so what is stacked on what does
    // not change with zoom. (Widening a too-short line for the layout, as
    // it once was, made it overlap a neighbour at some zooms and not others,
    // and the stack gained and lost a row as the slider moved.) It is only
    // drawn wider: segs here are the spans as drawn.
    const least = data.span * (data.minDrawnPx / columns);
    const segs = data.segs.map(seg => ({
      start: seg.s,
      end: seg.e - seg.s < least ? Math.min(data.span, seg.s + least) : seg.e,
    }));
    // The curves are sized in pixels, so zoomed far out (a narrow screen's
    // "all") they would span days and bridge lines never open together,
    // piling the cloth above the chart. Past FIRM_DAY_PX they shrink with the
    // zoom, never spanning more time than there: a bend's width goes as the
    // square root of its radius, so the radius shrinks as the zoom squared.
    const firm = Math.min(1, (86400 / spp) / FIRM_DAY_PX);
    const laid = Cloth.drape(data.segs.map(seg => ({start: seg.s, end: seg.e})), columns, spp,
                             {gap: data.gap, radius: data.radius * firm * firm, soften: data.soften * firm});
    // The same height at every zoom, so nothing moves as the slider does: no
    // line rises above the gaps beneath the most layers ever open at once.
    // Taller if asked (data.plotH: a pane to fill) - headroom, as if for
    // layers that are not there; nothing is stretched.
    const peakMark = data.markPeak ? 24 : 0;     // room above the peak for its mark
    const plotH = Math.max(Math.max(0, mostOpen(data.segs) - 1) * data.gap + 8 + peakMark, data.plotH || 0);
    // Zoomed in, the cloth stands as high as the layers open; zoomed out, its
    // bends (sized in pixels, so wider in time) bridge layers never open
    // together and pile it higher - up to a quarter, and it ran into the day
    // names. Squeezed to fit instead: the chart's height never changes with the
    // zoom (it did, and jerked), and no more lines are left out to fit a pane.
    let tallest = 0;
    for (const layer of laid) for (const y of layer.ys) if (y > tallest) tallest = y;
    const room = plotH - 8 - peakMark;
    if (tallest > room) {
      const squeeze = room / tallest;
      for (const layer of laid) for (let k = 0; k < layer.ys.length; k++) layer.ys[k] *= squeeze;
    }
    const floorY = TOP + plotH, baseY = floorY + data.gap;
    const baseGap = data.gap + 8 + 16;
    return {
      dayPx: dayPx, width: width, height: TOP + plotH + baseGap + BOTTOM, left: data.left, right: right,
      columns: columns, spp: spp, segs: segs, laid: laid, floorY: floorY, baseY: baseY, plotH: plotH,
      x: t => data.left + t / spp,
    };
  }

  /**
   * The most layers open at any one moment.
   * @param {{s: number, e: number}[]} segs @returns {number}
   */
  function mostOpen(segs) {
    /** @type {[number, number][]} */
    const edges = [];
    for (const seg of segs) edges.push([seg.s, 1], [seg.e, -1]);
    edges.sort((p, q) => p[0] - q[0] || p[1] - q[1]);   // an end before a start at the same moment
    let open = 0, most = 0;
    for (const [, step] of edges) { open += step; if (open > most) most = open; }
    return most;
  }

  /**
   * Whether a time reaches the chart's right edge - a line still open. Within a
   * second: times and the span are rounded separately, and a line open at the
   * end missed its label by a tenth of a second in some builds.
   * @param {StrataData} data @param {number} t @returns {boolean}
   */
  function reachesEnd(data, t) {
    return t >= data.span - 1;
  }

  /**
   * About how wide a label is, in px at 10 px: capitals and digits wider -
   * an acronym's letters are - than the rest.
   * @param {string} text @returns {number}
   */
  function textWidth(text) {
    let w = 0;
    for (const ch of text) w += /[A-Z0-9]/.test(ch) ? 6.8 : ch === " " ? 2.8 : 5.4;
    return w;
  }

  /**
   * A name cut to fit `room` px, ending "…"; "" if that leaves too little.
   * @param {string} name @param {number} room @returns {string}
   */
  function shorten(name, room) {
    if (!name || textWidth(name) <= room) return name;
    // "Project SMI" short of room is "SMI", not "Project S..." - which said
    // nothing, and read the same for every line on a phone.
    if (name.startsWith("Project ") && textWidth(name.slice(8)) <= room) return name.slice(8);
    let cut = name;
    while (cut.length > 3 && textWidth(cut + "\u2026") > room) cut = cut.slice(0, -1).trimEnd();
    return cut.length > 3 ? cut + "\u2026" : "";
  }

  /**
   * The room the labels at the right edge need: the widest name of a line
   * still open there, at most data.room - acronyms need little, long names
   * the lot, and a chart with nothing open at its end none.
   * @param {StrataData} data @returns {number}
   */
  function labelRoom(data) {
    if (data.labels !== "end") return data.room;
    let widest = 0;
    for (const seg of data.segs) if (reachesEnd(data, seg.e) && seg.name) widest = Math.max(widest, textWidth(seg.name));
    return widest ? Math.min(data.room, Math.ceil(widest) + 12) : 0;
  }

  /**
   * How many layers open at once a chart `height` px tall has room for.
   * @param {StrataData} data @param {number} height @returns {number}
   */
  function layersIn(data, height) {
    return Math.max(1, Math.floor((plotIn(data, height) - 8) / data.gap) + 1);
  }

  /**
   * The plot's height in a chart `height` px tall: the layout's height, less
   * all but the layers.
   * @param {StrataData} data @param {number} height @returns {number}
   */
  function plotIn(data, height) {
    return height - (TOP + data.gap + 8 + 16 + BOTTOM);
  }

  /**
   * Which layers to keep so no more than `most` are ever open at once: the
   * shortest-lived go first, but only those open at a moment with too many -
   * a short one at a quiet time stays. Decided by the times alone, so it
   * holds at every zoom. Returns the kept layers' indices, in order.
   * @param {{s: number, e: number}[]} segs @param {number} most @returns {number[]}
   */
  function thin(segs, most) {
    const times = [...new Set(segs.flatMap(seg => [seg.s, seg.e]))].sort((p, q) => p - q);
    /** @type {Map<number, number>} */
    const at = new Map(times.map((t, i) => [t, i]));
    const open = new Int32Array(times.length);    // open between times[k] and times[k+1]
    const spans = segs.map(seg => [/** @type {number} */ (at.get(seg.s)), /** @type {number} */ (at.get(seg.e))]);
    for (const [a, b] of spans) for (let k = a; k < b; k++) open[k]++;
    const order = segs.map((_, i) => i).sort((i, j) => (segs[i].e - segs[i].s) - (segs[j].e - segs[j].s) || j - i);
    const out = new Uint8Array(segs.length);
    for (const i of order) {
      const [a, b] = spans[i];
      let crowded = false;
      for (let k = a; k < b && !crowded; k++) crowded = open[k] > most;
      if (!crowded) continue;
      out[i] = 1;
      for (let k = a; k < b; k++) open[k]--;
    }
    return segs.map((_, i) => i).filter(i => !out[i]);
  }

  /**
   * The top cloth's height per column, for the overview strip.
   * @param {StrataData} data @param {Geometry} g @returns {Float64Array}
   */
  function envelope(data, g) {
    const env = new Float64Array(g.columns + 1);
    g.laid.forEach(layer => {
      for (let k = 0; k < layer.ys.length; k++) {
        const v = layer.ys[k] + data.gap;
        if (v > env[layer.k0 + k]) env[layer.k0 + k] = v;
      }
    });
    return env;
  }

  /**
   * Drop the corners inside a level stretch - between two neighbours at the
   * same height as drawn - in place. The line is the same: straight through
   * them all.
   * @param {number[]} xs @param {number[]} ys @param {string[]} pts - "x,y" as drawn
   */
  function level(xs, ys, pts) {
    /** @param {number} i */
    const height = i => pts[i].slice(pts[i].indexOf(",") + 1);
    let kept = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i > 0 && i + 1 < pts.length && height(i) === height(kept - 1) && height(i) === height(i + 1)) continue;
      xs[kept] = xs[i]; ys[kept] = ys[i]; pts[kept] = pts[i];
      kept++;
    }
    xs.length = ys.length = pts.length = kept;
  }

  /**
   * The line's look pixel by pixel: strong if any of that pixel is, else
   * medium if any is, else faint. Pieces are [from, to, state], in px;
   * state 2 = strong, 1 = medium, 0 = faint.
   * @param {number} x0 @param {number} x1 @param {Pair[]} focused @param {Pair[]} working
   * @returns {[number, number, number][]}
   */
  function pixelStates(x0, x1, focused, working) {
    const first = Math.floor(x0), last = Math.max(first, Math.ceil(x1) - 1);
    const marks = new Uint8Array(last - first + 1);
    /** @type {[number, Pair[]][]} */ ([[1, working], [2, focused]]).forEach(([rank, spans]) => {
      for (const [a, b] of spans) {
        const lo = Math.floor(a), hi = Math.max(lo, Math.ceil(b) - 1);
        for (let col = lo; col <= hi; col++) {
          if (col >= first && col <= last && marks[col - first] < rank) marks[col - first] = rank;
        }
      }
    });
    /** @type {[number, number, number][]} */
    const pieces = [];
    let start = 0;
    for (let i = 1; i <= marks.length; i++) {
      if (i === marks.length || marks[i] !== marks[start]) {
        pieces.push([Math.max(x0, first + start), Math.min(x1, first + i), marks[start]]);
        start = i;
      }
    }
    return pieces;
  }

  /**
   * The foot line at the width it is drawn: each series' stretches as they
   * are, but gaps shorter than `gap` seconds bridged, so zoomed out it reads
   * as a bar rather than dust - unless the other series has time in the gap:
   * the first is drawn on top, and bridging over the second would hide it.
   * No grid: stretches keep their true ends, so as the zoom changes a gap
   * closes once and stays closed (binning into cells a few pixels wide made
   * slivers flicker as the cells slid over them).
   * @param {Pair[]} first @param {Pair[]} second @param {number} gap
   * @returns {{first: Pair[], second: Pair[]}}
   */
  function settle(first, second, gap) {
    /** @param {Pair[]} pairs @param {Pair[]} rival @returns {Pair[]} */
    const bridged = (pairs, rival) => {
      /** @type {Pair[]} */
      const out = [];
      let r = 0;
      for (const [a, b] of pairs) {
        const last = out[out.length - 1];
        if (last && a - last[1] < gap) {
          while (r < rival.length && rival[r][1] <= last[1]) r++;
          if (!(r < rival.length && rival[r][0] < a)) {
            last[1] = Math.max(last[1], b);
            continue;
          }
        }
        out.push([a, b]);
      }
      return out;
    };
    return {first: bridged(first, second), second: bridged(second, first)};
  }

  /**
   * Draw pixel columns from..to (a window around the screen) into svg -
   * `moving`, mid-zoom, without the lines' hover strips, for speed: nothing
   * is pointed at while it moves, and the next still redraw adds them.
   * @param {{setAttribute(name: string, value: string | number): void, innerHTML: string}} svg
   * @param {StrataData} data @param {Geometry} g @param {number} from @param {number} to
   * @param {boolean} [moving]
   */
  function draw(svg, data, g, from, to, moving) {
    const x = g.x;
    /** @type {string[]} */ const parts = [];
    /** @type {string[]} */ const lines = [];
    /** @type {string[]} */ const hits = [];
    /** @type {string[]} */ const pinches = [];
    /** @type {string[]} */ const badges = [];
    /** @type {[number, number, number, number, number, string, number][]} */
    const wanted = [];
    const x0w = g.left + from, x1w = g.left + to;
    svg.setAttribute("width", g.width);
    svg.setAttribute("height", g.height);
    svg.setAttribute("viewBox", "0 0 " + g.width + " " + g.height);

    // Day boundaries and names, and the working day under the foot line.
    const axisY = g.baseY + 14;
    data.days.forEach(([start, label, weekday], i) => {
      const end = i + 1 < data.days.length ? data.days[i + 1][0] : start + 86400;
      const a = x(Math.max(start, 0)), b = x(Math.min(end, data.span));
      if (b <= a || b < x0w || a > x1w) return;
      parts.push('<line x1="' + a.toFixed(1) + '" x2="' + a.toFixed(1) + '" y1="' + (TOP - 24) + '" y2="'
        + (g.floorY + data.gap + 24).toFixed(1) + '" class="day"/>');
      // Shorter as days narrow, so names never run into each other.
      const words = label.split(" "), shown = b - a > 90 ? label : b - a > 50 ? words.slice(0, 2).join(" ") : words[1];
      parts.push('<text x="' + ((a + b) / 2).toFixed(1) + '" y="' + (TOP - 12) + '" class="daylab">' + esc(shown) + "</text>");
      /** @param {number} h */
      const at = h => start + h * 3600;
      // The working day's marks only where a day is wide enough to tell them apart.
      if (!data.axis || b - a < AXIS_DAY_PX) return;
      if (at(data.axis.work[0]) < 0 || at(data.axis.work[1]) > data.span) return;
      parts.push('<line x1="' + x(at(data.axis.work[0])).toFixed(1) + '" x2="' + x(at(data.axis.work[1])).toFixed(1)
        + '" y1="' + axisY.toFixed(1) + '" y2="' + axisY.toFixed(1) + '" class="workday"/>');
      for (const h of data.axis.dots) {
        parts.push('<circle cx="' + x(at(h)).toFixed(1) + '" cy="' + axisY.toFixed(1) + '" r="1.8" class="tick"/>');
      }
      if (weekday < 5 && data.axis.standup) {
        const s = data.axis.standup;
        parts.push('<circle cx="' + x(at(s[0] + s[1] / 60)).toFixed(1) + '" cy="' + axisY.toFixed(1) + '" r="2.4" class="standup"/>');
      }
    });

    g.laid.forEach((layer, index) => {
      const seg = data.segs[index], span = g.segs[index];
      const a = x(span.start), b = x(span.end), n = layer.ys.length;
      // Named only if still open at the right edge - at its end, or its
      // start; the rest are left to the tip.
      if (data.labels && reachesEnd(data, span.end)) {
        const atStart = data.labels === "start", at = atStart ? 0 : n - 1;
        // A name at a line's end fits the room left to the right (a narrow
        // screen has little): shortened, or left to the tip if too short.
        const tx = g.left + layer.k0 + at + (atStart ? -6 : 6);
        const name = atStart ? seg.name : shorten(seg.name, g.width - tx - 4);
        if (name) {
          const wide = textWidth(name);
          wanted.push([-n, atStart ? tx - wide : tx, g.floorY - layer.ys[at], wide, tx, name, index]);
        }
      }
      if (b < x0w || a > x1w) return;
      const clipFrom = Math.max(0, Math.floor(x0w - g.left - layer.k0));
      const clipTo = Math.min(n - 1, Math.ceil(x1w - g.left - layer.k0));
      if (clipTo < clipFrom) return;
      /** @param {Pair} pair @returns {Pair} */
      const toPx = ([p, q]) => [x(p), x(q)];
      const focused = seg.f.map(toPx), working = seg.w.map(toPx);
      // The line's corners, every STEP px: where x is, and the point as drawn.
      /** @type {number[]} */ const xs = [];
      /** @type {number[]} */ const ys = [];
      /** @type {string[]} */ const pts = [];
      /** @param {number} px @param {number} y */
      const corner = (px, y) => { xs.push(px); ys.push(y); pts.push(px.toFixed(1) + "," + y.toFixed(1)); };
      for (let k = clipFrom; k <= clipTo; k += STEP) corner(g.left + layer.k0 + k, g.floorY - layer.ys[k]);
      if ((clipTo - clipFrom) % STEP) corner(g.left + layer.k0 + clipTo, g.floorY - layer.ys[clipTo]);
      // Too short to see at this zoom: drawn on, level, to its drawn width.
      if (clipTo === n - 1 && b - (g.left + layer.k0 + clipTo) > 0.5) corner(b, g.floorY - layer.ys[n - 1]);
      // Where it lies level, its two ends are enough: most of a line, zoomed in.
      level(xs, ys, pts);
      const d = "M" + pts.join(" L");
      /** @param {number} px @returns {string} a point on the line at that x */
      const on = px => {
        const col = Math.min(n - 1, Math.max(0, px - g.left - layer.k0)), k = Math.floor(col);
        const y = k + 1 < n ? layer.ys[k] + (layer.ys[k + 1] - layer.ys[k]) * (col - k) : layer.ys[k];
        return px.toFixed(1) + "," + (g.floorY - y).toFixed(1);
      };
      // The line in its palest tone, then each stronger stretch laid along it
      // as a piece of the same curve, so its ends cut square across the line
      // wherever it slopes. (A colour gradient along x cut them upright.) A
      // piece follows the line's own corners between its ends, and only as
      // far as the line is drawn; one covering all of it leaves nothing pale
      // to draw beneath.
      const from = xs[0], to = xs[xs.length - 1];
      // A stretch runs on to the line's true end, a little past its last column.
      const end = clipTo === n - 1 ? Math.max(to, b) : to;
      // To a hundredth: a stretch under a pixel long takes its slant - the cut
      // across the line - from its two ends alone.
      /** @param {number} px @returns {string} where the line as drawn is at px (level past its end) */
      const along = px => {
        if (px >= to) return px.toFixed(2) + "," + ys[ys.length - 1].toFixed(2);
        let lo = 0, hi = xs.length - 1;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= px) lo = mid; else hi = mid; }
        const y = xs[hi] > xs[lo] ? ys[lo] + (ys[hi] - ys[lo]) * (px - xs[lo]) / (xs[hi] - xs[lo]) : ys[lo];
        return px.toFixed(2) + "," + y.toFixed(2);
      };
      /** @type {[number, number, number][]} */ const strong = [];
      for (const [p, q, state] of pixelStates(a, b, focused, working)) {
        const pp = Math.max(p, from), qq = Math.min(q, end);
        if (state && qq > pp) strong.push([pp, qq, state]);
      }
      // (From its true start, which is a little into its first column, to its end.)
      const covered = strong.length === 1 && strong[0][0] <= Math.max(from, a) + 0.01 && strong[0][1] >= end - 0.01;
      if (covered) strong[0] = [from, end, strong[0][2]];
      else lines.push('<path d="' + d + '" stroke="' + seg.c[2] + '" class="line" data-index="' + index + '"/>');
      for (const [p, q, state] of strong) {
        const piece = [p === from ? pts[0] : along(p)];
        let i = 0;
        while (i < xs.length && xs[i] <= p) i++;
        for (; i < xs.length && xs[i] < q; i++) piece.push(pts[i]);
        piece.push(q === to ? pts[pts.length - 1] : along(q));
        lines.push('<path d="M' + piece.join(" L") + '" stroke="' + seg.c[2 - state] + '" class="line" data-index="'
          + index + '"/>');
      }
      // Moments on it (a commit): a tiny triangle above the line, its point on
      // the line's edge, as if pinching it - steady, and off the
      // stroke, so a line busy with them still shows its shades; grey (the page
      // sets it), so they don't add to the colour. Those within a few px
      // of each other as one, a little longer.
      // Moments of a second kind (a merge, a release): a small badge with a tick.
      /** @param {number[]} times @param {(px: number, count: number) => void} mark */
      const gather = (times, mark) => {
        /** @type {number[]} */ let near = [];
        const flush = () => {
          if (near.length) mark(near.reduce((sum, v) => sum + v, 0) / near.length, near.length);
          near = [];
        };
        for (const t of times) {
          const px = x(t);
          if (px < x0w - MOMENT_PX || px > x1w + MOMENT_PX || px < a - 1 || px > b + 1) continue;
          if (near.length && px - near[0] > MOMENT_PX) flush();
          near.push(px);
        }
        flush();
      };
      /** @param {number} px @returns {string} the moment's time, seconds from the left edge */
      const when = px => ((px - g.left) * g.spp).toFixed(0);
      gather(seg.m || [], (px, count) => {
        const [sx, sy] = on(px).split(",").map(Number);
        const [ax, ay] = on(px - 1.5).split(",").map(Number), [bx, by] = on(px + 1.5).split(",").map(Number);
        const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
        const grow = Math.min(PINCH.more, 0.65 * Math.log2(count));
        const nx = uy, ny = -ux;      // the normal, out from the line, above it
        /** @param {number} edge @param {number} scale @returns {string} the triangle, its point `edge` out */
        const tri = (edge, scale) => {
          const wide = scale * PINCH.wide / 2, long = scale * (PINCH.long + grow);
          /** @param {number} along @param {number} out */
          const c = (along, out) => (sx + ux * along + nx * out).toFixed(1) + ","
            + (sy + uy * along + ny * out).toFixed(1);
          return "M" + c(0, edge) + " L" + c(-wide, edge + long) + " L" + c(wide, edge + long) + "Z";
        };
        // Lit, the line is thicker: the triangle moves out with its edge, and
        // grows by half. The page shows one or the other. Pointing at it (a
        // little more than the triangle) gives the commit.
        const [hx, hy] = [sx + nx * (PINCH.edge + 2), sy + ny * (PINCH.edge + 2)];
        pinches.push('<g class="pinch" data-index="' + index + '" data-t="' + when(px) + '" data-n="' + count
          + '"><path d="' + tri(PINCH.edge, 1) + '" class="pinch-mark"/><path d="' + tri(PINCH.litEdge, 1.5)
          + '" class="pinch-mark lit-only"/><circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="4"/></g>');
      });
      gather(seg.b || [], (px, count) => {
        const [sx, sy] = on(px).split(",").map(Number);
        /** @param {number} dx @param {number} dy */
        const c = (dx, dy) => (sx + dx).toFixed(1) + "," + (sy + dy).toFixed(1);
        badges.push('<g class="badge" data-index="' + index + '" data-t="' + when(px) + '" data-n="' + count
          + '"><circle cx="' + sx.toFixed(1) + '" cy="'
          + sy.toFixed(1) + '" r="5.5" fill="' + seg.c[0] + '"/><path d="M' + c(-2.4, 0.1) + " L" + c(-0.7, 1.9)
          + " L" + c(2.6, -1.8) + '" class="badge-tick"/></g>');
      });
      if (!moving) hits.push('<path d="' + d + '" class="grab" data-index="' + index + '" data-name="' + esc(seg.name) + '"/>');
    });

    // Labels: longest-lived first; one that would overlap a placed one is left
    // off - that line still names itself on hover.
    /** @type {string[]} */
    const tags = [];
    /** @type {[number, number, number][]} */
    const placed = [];
    wanted.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
    for (const [, lx, ty, wide, tx, text, index] of wanted) {
      if (placed.some(([px, py, pw]) => lx < px + pw + 4 && px < lx + wide + 4 && Math.abs(ty - py) < 11)) continue;
      placed.push([lx, ty, wide]);
      if (lx + wide < x0w || lx > x1w) continue;
      tags.push('<text x="' + tx.toFixed(1) + '" y="' + (ty + 3.5).toFixed(1) + '" class="lab" data-index="'
        + index + '" text-anchor="'
        + (data.labels === "start" ? "end" : "start") + '">' + esc(text) + "</text>");
    }

    // The foot line's two series, drawn at their true ends, anti-aliased, so
    // a sliver fades as it thins rather than snapping from pixel to pixel; the
    // first on top.
    const runs = settle(data.foot || [], data.foot2 || [], 3 * g.spp);
    /** @type {["second" | "first", string, string][]} */
    const feet = [["second", "foot-2", "foot2"], ["first", "foot-1", "foot"]];
    for (const [which, cls, key] of feet) {
      for (const [p, q] of runs[which]) {
        const a = x(p), b = x(q);
        if (b < x0w || a > x1w) continue;
        lines.push('<line x1="' + a.toFixed(2) + '" x2="' + b.toFixed(2) + '" y1="' + g.baseY.toFixed(1) + '" y2="'
          + g.baseY.toFixed(1) + '" class="base ' + cls + '" data-foot="' + key + '" data-s="' + p + '" data-e="'
          + q + '"/>');
      }
    }

    // The peak, marked ("13 open at once"), above the stack where it first happened.
    if (data.markPeak) {
      /** @type {[number, number][]} */
      const edges = [];
      for (const seg of data.segs) edges.push([seg.s, 1], [seg.e, -1]);
      edges.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      let open = 0, most = 0, at = 0;
      for (const [t, step] of edges) { open += step; if (open > most) { most = open; at = t; } }
      const k = Math.round(at / g.spp), px = g.left + k;
      if (most > 1 && px >= x0w && px <= x1w) {
        let top = 0;
        for (const layer of g.laid) {
          const y = layer.ys[k - layer.k0];
          if (y !== undefined && y > top) top = y;
        }
        const yTop = g.floorY - top - 8;
        tags.push('<line class="peak-tick" x1="' + px + '" x2="' + px + '" y1="' + (yTop - 10).toFixed(1) + '" y2="'
          + yTop.toFixed(1) + '"/><text class="peak" x="' + px + '" y="' + (yTop - 14).toFixed(1) + '">'
          + most + " open at once</text>");
      }
    }

    svg.innerHTML = '<rect class="hit" x="' + g.left + '" y="0" width="' + g.columns + '" height="' + g.height
      + '" fill="transparent"/>' + parts.join("") + lines.join("")
      + tags.join("") + hits.join("") + pinches.join("") + badges.join("");   // moments over the lines' hover strips: they have tips of their own
  }

  /**
   * A line's three tones from its colour: strong, the colour darkened;
   * medium, a clear tint; faint, a pale one - told apart by lightness, all
   * solid. `surface` is the background the tints lean towards.
   * @param {string} colour  #rrggbb @param {string} [surface] #rrggbb
   * @returns {[string, string, string]}
   */
  function tones(colour, surface) {
    /** @param {string} hex */
    const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const base = rgb(colour), back = rgb(surface || "#fcfcfb");
    /** @param {number} dark @param {number} pale */
    const mix = (dark, pale) => "#" + base.map((c, i) => {
      const v = c * (1 - dark) * (1 - pale) + back[i] * pale;
      return Math.round(v).toString(16).padStart(2, "0");
    }).join("");
    return [mix(0.3, 0), mix(0, 0.62), mix(0, 0.88)];
  }

  const api = {layout: layout, draw: draw, envelope: envelope, mostOpen: mostOpen, esc: esc, thin: thin,
    layersIn: layersIn, reachesEnd: reachesEnd, plotIn: plotIn, labelRoom: labelRoom,
    FIRM_DAY_PX: FIRM_DAY_PX, pixelStates: pixelStates, settle: settle, tones: tones};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StrataView = api;
})(/** @type {any} */ (typeof self !== "undefined" ? self : this));
