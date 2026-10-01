// @ts-check
/*
 * strata-cloth.js - the Strata layout. It runs as is in a browser and in
 * Node, is type-checked by tsc (JSDoc types, strict) and is covered by the
 * unit tests. Kept free of any page, so any page or an Omniscope custom view
 * can use it.
 *
 * Layers of cloth. Lines are laid in order - the caller sorts them, the
 * longest-lived last so it lies on top. The first lies flat; every other rests
 * at least `gap` pixels above the highest line beneath it. Where a line
 * underneath ends, the layer above drapes down: the most of any nearby
 * support, less a parabola of radius `radius`, then a gaussian of `soften`
 * pixels - so it only ever rises above what it rests on, rounds over edges and
 * bridges narrow valleys. Each layer is shaped from its start to the end of the
 * chart, then cut to its life, so it ends on the curve it was following;
 * before its start it lies level at its starting height.
 *
 *   StrataCloth.drape(segs, columns, secondsPerPx, {gap, radius, soften})
 *     segs: [{start, end}] - seconds from the chart's left edge, in layer order
 *     returns [{k0, ys}] - each layer's first pixel column and its heights
 *     (Float64Array) above the first line, one per column of its life.
 */
(function (root) {
  "use strict";

  /** @typedef {{start: number, end: number}} Span - seconds from the chart's left edge */
  /** @typedef {{k0: number, ys: Float64Array}} Layer - first pixel column, and heights from there */
  /** @typedef {{gap: number, radius: number, soften: number}} ClothParams */

  /**
   * The pixel columns a span covers. Column k stands for the slice of time
   * from k to k+1 pixels, so two spans share a column exactly when they
   * overlap in time, at every zoom: spans that only touch never do, and a
   * minute's overlap always does. (Sampling one instant a column, as it once
   * did, made a brief overlap stack at some zooms and not others.) A span
   * reaching the chart's end covers its last column, the right edge.
   * @param {Span} seg @param {number} columns @param {number} secondsPerPx
   * @returns {[number, number]}
   */
  function columnsOf(seg, columns, secondsPerPx) {
    const first = Math.min(columns, Math.max(0, Math.floor(seg.start / secondsPerPx)));
    const through = seg.end >= columns * secondsPerPx ? columns : Math.ceil(seg.end / secondsPerPx) - 1;
    return [first, Math.min(columns, Math.max(first, through))];
  }

  /**
   * A gaussian blur, edges held at their end values.
   * @param {ArrayLike<number>} values @param {number} sigma @returns {Float64Array}
   */
  function soften(values, sigma) {
    const reach = Math.trunc(3 * sigma);
    const n = values.length;
    if (!reach || n < 2) return Float64Array.from(values);
    const weights = new Float64Array(2 * reach + 1);
    let total = 0;
    for (let d = -reach; d <= reach; d++) {
      weights[d + reach] = Math.exp(-(d * d) / (2 * sigma * sigma));
    }
    for (let j = 0; j < weights.length; j++) total += weights[j];
    const last = n - 1, out = new Float64Array(n);
    // Where the values are level as far as the blur reaches, it leaves them as
    // they are - as most of a line resting on a level one is, zoomed in.
    const runEnd = new Int32Array(n);
    runEnd[last] = last;
    for (let i = last - 1; i >= 0; i--) runEnd[i] = values[i] === values[i + 1] ? runEnd[i + 1] : i;
    let runStart = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0 && values[i] !== values[i - 1]) runStart = i;
      if (runStart <= Math.max(0, i - reach) && runEnd[i] >= Math.min(last, i + reach)) {
        out[i] = values[i];
        continue;
      }
      let sum = 0;
      for (let d = -reach; d <= reach; d++) {
        const k = Math.min(Math.max(i + d, 0), last);
        sum += weights[d + reach] * values[k];
      }
      out[i] = sum / total;
    }
    return out;
  }

  /**
   * Where a span would rest at pixel column k: the gap above the highest
   * layer laid so far there that is open at some moment the span is (else 0),
   * and above the highest there that starts after the span ends.
   * @param {Layer[]} laid @param {Span[]} segs - laid[i] is segs[i]
   * @param {Span} seg @param {number} k @param {number} gap @returns {[number, number]}
   */
  function restingOn(laid, segs, seg, k, gap) {
    let during = 0, after = 0;
    for (let i = 0; i < laid.length; i++) {
      const layer = laid[i], other = segs[i];
      if (k < layer.k0 || k >= layer.k0 + layer.ys.length) continue;
      const y = layer.ys[k - layer.k0] + gap;
      if (other.start >= seg.end) after = Math.max(after, y);
      else if (seg.start < other.end) during = Math.max(during, y);
    }
    return [during, after];
  }

  /**
   * The most of `heights` less a parabola of `radius` pixels, at every column:
   * out[i] = max over j of heights[j] - (i - j)^2 / (2 radius). The upper
   * envelope of the parabolas, found in one pass (Felzenszwalb and
   * Huttenlocher's distance transform), so the time grows with the columns,
   * not the columns times how far a bend reaches.
   * @param {Float64Array} heights @param {number} radius @returns {Float64Array}
   */
  function round(heights, radius) {
    const n = heights.length, out = Float64Array.from(heights);
    if (!(radius > 0) || n < 2) return out;
    const c = 1 / (2 * radius);
    const v = new Int32Array(n), z = new Float64Array(n + 1);
    /** @param {number} q @param {number} p - where parabola q overtakes p */
    const cross = (q, p) => ((c * q * q - heights[q]) - (c * p * p - heights[p])) / (2 * c * (q - p));
    let k = 0;
    z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let s = cross(q, v[k]);
      while (s <= z[k]) s = cross(q, v[--k]);
      k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    const count = k + 1;
    /** @param {number} i @param {number} m */
    const at = (i, m) => { const d = i - v[m]; return heights[v[m]] - d * d / (2 * radius); };
    k = 0;
    for (let i = 0; i < n; i++) {
      while (z[k + 1] < i) k++;
      // The envelope's parabola here - or a neighbour on it, where two cross
      // within rounding of this column: the most of them, as a search finds.
      let best = at(i, k);
      if (k > 0) best = Math.max(best, at(i, k - 1));
      if (k + 1 < count) best = Math.max(best, at(i, k + 1));
      out[i] = best;
    }
    return out;
  }

  /**
   * Lay the layers out, bottom first. See the header for how.
   * @param {Span[]} segs @param {number} columns @param {number} secondsPerPx
   * @param {ClothParams} params @returns {Layer[]}
   */
  function drape(segs, columns, secondsPerPx, params) {
    const gap = params.gap, radius = params.radius, sigma = params.soften;
    const highest = new Float64Array(columns + 1).fill(NaN);   // NaN: nothing beneath yet
    const reachSoft = Math.trunc(3 * sigma);
    let ceiling = 0;          // no floor anywhere is higher, so far
    /** @type {Layer[]} */
    const out = [];
    for (const seg of segs) {
      const [first, last] = columnsOf(seg, columns, secondsPerPx);
      // What it would rest on: the gap above the highest line beneath, or the
      // floor - from its start on; before that, level at its starting height.
      // A pixel where a layer beneath ends and this one starts (or the other
      // way round) holds both, though only one is open at any moment: there,
      // rest only on layers open at the same time as this one. One starting
      // after this one ends is still ahead of it, as if in the next pixel -
      // ignoring it outright made the end bend up at some zooms and not others.
      const onFirst = restingOn(out, segs, seg, first, gap)[0];
      const [during, after] = restingOn(out, segs, seg, last, gap);
      /** The floor over columns lo..hi. @param {number} lo @param {number} hi */
      const floorOver = (lo, hi) => {
        const floor = new Float64Array(hi - lo + 1);
        for (let k = Math.max(lo, first); k <= hi; k++) floor[k - lo] = isNaN(highest[k]) ? 0.0 : highest[k] + gap;
        floor[first - lo] = onFirst;
        floor[last - lo] = during;
        if (last < columns && last + 1 <= hi && after > floor[last + 1 - lo]) floor[last + 1 - lo] = after;
        for (let k = lo; k < first; k++) floor[k - lo] = floor[first - lo];
        return floor;
      };
      // Rounded over the layer's life and the blur's reach either side: the
      // most of any support within reach, less the parabola. Nothing further
      // away than the drop from the highest floor to this stretch's lowest can
      // reach above it, so that bounds the search.
      const a = Math.max(0, first - reachSoft), b = Math.min(columns, last + reachSoft);
      let bottom = Infinity;
      for (const y of floorOver(a, b)) if (y < bottom) bottom = y;
      const drop = ceiling - bottom;
      const reach = drop > 0 ? Math.trunc(Math.sqrt(2 * radius * drop)) + 1 : 0;
      const lo = Math.max(0, a - reach), hi = Math.min(columns, b + reach);
      const floor = floorOver(lo, hi);
      const rounded = round(floor, radius).subarray(a - lo, b - lo + 1);
      const softened = soften(rounded, sigma);
      const ys = new Float64Array(last - first + 1);
      for (let k = first; k <= last; k++) ys[k - first] = Math.max(floor[k - lo], softened[k - a]);
      out.push({ k0: first, ys: ys });
      for (let k = first; k <= last; k++) {
        const v = ys[k - first];
        if (isNaN(highest[k]) || v > highest[k]) highest[k] = v;
        if (v + gap > ceiling) ceiling = v + gap;
      }
    }
    return out;
  }

  const api = { drape: drape, soften: soften, columnsOf: columnsOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StrataCloth = api;
})(/** @type {any} */ (typeof self !== "undefined" ? self : this));
