// @ts-check
/*
 * strata-ui.js - the interactive Strata chart: a scrolling chart with a zoom
 * slider, an overview strip and a tooltip, around strata-view.js's drawing.
 * Used by standalone pages and by the Omniscope custom view alike.
 *
 *   StrataUI.mount(element, data, {maxDayPx, openDayPx})
 *
 * `data` is strata-view.js's StrataData, plus `lo` (epoch seconds of its left
 * edge, for the tooltip's times) and, on each seg, an optional `group` (a
 * colour group, e.g. a project). `data.names` says what the tooltip calls the
 * states and the foot line's series; without it, plain defaults.
 */
(function (root) {
  "use strict";
  /** @type {typeof import("./strata-view.js")} */
  // @ts-ignore - require exists only in Node
  const View = root.StrataView || (typeof require !== "undefined" ? require("./strata-view.js") : null);

  /**
   * @param {HTMLElement} host
   * @param {any} data  StrataData, with lo and optional seg.group
   * @param {{maxDayPx?: number, openDayPx?: number, openDays?: number,
   *          onPick?: (seg: any, index: number) => void,
   *          touch?: boolean, fitHeight?: boolean, intro?: boolean | "glide" | "replay",
   *          resume?: {zoom: number, pin: "start" | "end" | "middle", t: number}}} [options] -
   *          touch: pinch to zoom too (default: on a
   *          touch-only device); fitHeight: fill the window's height - headroom if there is room to
   *          spare, and if there is too little, the shortest lines left out where more are open at once
   *          than fit (a view in a pane, say, rather than a page that scrolls); intro: open by gliding
   *          in from zoomed furthest out ("glide", or true), or by replaying the whole range left to right
   *          at the widest zoom ("replay"); resume: open, without either, where another mount's state()
   *          says the reader was
   */
  function mount(host, data, options) {
    const opts = options || {};
    const MAX = opts.maxDayPx || 1760;
    // The opening zoom: openDays to a screen if given (so every screen shows the
    // same stretch of time), else openDayPx.
    const openPx = () => {
      if (!opts.openDays) return opts.openDayPx || 250;
      fitToScreen();                              // this screen's margins, before measuring it
      return columnsNow() / opts.openDays;
    };
    const OUT_DAY_PX = 20;    // zoomed furthest out, at most this dense
    // Touch alone - a phone or tablet, no mouse or trackpad: pinch to zoom,
    // as well as the slider.
    const touch = opts.touch !== undefined ? opts.touch : typeof matchMedia !== "undefined"
      && matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
    const given = data;
    host.innerHTML =
      '<div class="nav"><svg class="overview" height="30"></svg>'
      + '<label class="zoom"><span class="out">all</span> '
      + '<input type="range" min="0" max="1000" step="1" value="0"> day</label><span class="left-out"></span></div>'
      + '<div class="wrap"><div class="scroller"><svg class="chart"></svg></div></div><div class="tip"></div>';
    /** @param {string} selector @returns {any} */
    const q = selector => host.querySelector(selector);
    const scroller = q(".scroller"), wrap = q(".wrap"), chart = q(".chart"), zoom = q(".zoom input");
    const ov = q(".overview"), tip = q(".tip");
    /** @type {any} */ let g = null;
    /** @type {Float64Array} */ let env = new Float64Array(0);
    let drawn = [0, 0];
    let relight = () => {};   // re-lights the pointed-at line after a redraw
    let gliding = 0;          // the opening glide's run; bumped to stop it

    // The room for labels at the right edge, and the margins, shrink with the
    // screen: all of them from 700 px wide, the least by 480 (margins none, labels
    // an acronym's width), for the chart's sake.
    // And, with fitHeight, the lines to the window's height: where more are
    // open at once than there is room for, the shortest-lived are left out.
    function fitToScreen() {
      const f = Math.min(1, Math.max(0, (scroller.clientWidth - 480) / (700 - 480)));
      const margin = Math.round(6 + (given.left - 6) * f);
      let segs = given.segs, plotH = 0;
      if (opts.fitHeight) {
        // To the window's bottom, less the scrollbar and whatever padding
        // is below the chart - exactly, so nothing is left blank under it.
        const below = scroller.offsetHeight - scroller.clientHeight
          + parseFloat(getComputedStyle(host).paddingBottom || "0") + 2;
        const room = innerHeight - scroller.getBoundingClientRect().top - below;
        // Decided once, for the whole range, so zooming and scrolling never
        // change what is drawn.
        const most = View.layersIn(given, room);
        if (View.mostOpen(given.segs) > most) segs = View.thin(given.segs, most).map(i => given.segs[i]);
        plotH = View.plotIn(given, room);    // and room to spare is headroom, the chart filling the pane
      }
      const left = given.segs.length - segs.length;
      // Short on a phone, where the long form ran off the edge.
      q(".left-out").textContent = !left ? ""
        : scroller.clientWidth < 600 ? left + " left out"
        : left + " shorter line" + (left > 1 ? "s" : "") + " left out to fit";
      data = Object.assign({}, given, {left: margin, right: margin, segs: segs, plotH: plotH});
      // Some room for labels even on a phone: enough for an acronym, a long name shortened.
      const room = View.labelRoom(data);
      data.room = Math.round(Math.max(room * f, Math.min(room, 64)));
    }
    function columnsNow() {
      return Math.max(1, scroller.clientWidth - data.left - data.right - data.room);
    }
    function fitDayPx() {        // the whole range in the width there is now
      return columnsNow() * 86400 / data.span;
    }
    // Zoomed furthest out: the whole range, unless that is too dense to read
    // - then as many days as the screen shows at OUT_DAY_PX, however long the
    // range. So it follows both the screen and the data: only a long history,
    // or a phone with a long one, stops short of all.
    function outDayPx() {
      return Math.min(MAX, Math.max(fitDayPx(), OUT_DAY_PX));
    }
    /** @param {number} v - slider 0..1000, evenly in ratio from furthest out to MAX */
    function dayPxFor(v) {
      const out = outDayPx();
      return out >= MAX ? out : out * Math.pow(MAX / out, v / 1000);
    }
    /** @param {number} dayPx */
    function sliderFor(dayPx) {
      const out = outDayPx();
      return out >= MAX ? 0 : Math.round(1000 * Math.log(dayPx / out) / Math.log(MAX / out));
    }
    // A screen's width either side of the screen, so scrolling a little
    // needs no redraw. Mid-zoom (`moving`: the glide, the slider, a pinch),
    // only the screen, a frame at a time, and once the zoom has been still
    // for a moment, all of it again, with the hover strips.
    let settle = 0;
    /** @param {boolean} [moving] */
    function drawWindow(moving) {
      const margin = moving ? 40 : scroller.clientWidth;
      const from = Math.max(0, scroller.scrollLeft - data.left - margin);
      const to = scroller.scrollLeft - data.left + scroller.clientWidth + margin;
      View.draw(chart, data, g, from, to, moving);
      drawn = [from, to];
      relight();
      clearTimeout(settle);
      if (moving) settle = setTimeout(() => drawWindow(), 150);
    }
    // What to keep in view as the zoom changes: whichever end the reader
    // last scrolled to, else the moment they left in the middle of the screen.
    // Set only by the reader's own scrolling, not by zooming, so zooming out
    // to where both ends show and back in again returns to the same place.
    /** @type {{pin: "start" | "end" | "middle", t: number}} */
    let anchor = {pin: "end", t: 0};
    let placed = -1;   // where setZoom put the scroll, to tell its scroll event from the reader's
    function remember() {
      gliding++;                 // the reader has taken over: the opening glide stops
      if (!g) return;
      const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
      const atStart = scroller.scrollLeft <= 4;
      anchor = {pin: atEnd && !atStart ? "end" : atStart && !atEnd ? "start" : "middle",
                t: (scroller.scrollLeft + scroller.clientWidth / 2 - g.left) * g.spp};
    }
    // Lay out for a zoom, keeping the anchor in view - or, pinching, the
    // moment between the fingers where it is on the screen.
    /** @param {number} dayPx @param {{t: number, x: number}} [held] @param {boolean} [moving] */
    function setZoom(dayPx, held, moving) {
      g = View.layout(data, dayPx, scroller.clientWidth);
      chart.setAttribute("width", g.width); chart.setAttribute("height", g.height);
      scroller.scrollLeft = held ? g.left + held.t / g.spp - held.x
        : anchor.pin === "end" ? g.width : anchor.pin === "start" ? 0
        : g.left + anchor.t / g.spp - scroller.clientWidth / 2;
      placed = scroller.scrollLeft;
      env = View.envelope(data, g);
      drawWindow(moving);
      drawOverview();
    }
    let pending = false;
    zoom.addEventListener("input", () => {
      gliding++;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; setZoom(dayPxFor(+zoom.value), undefined, true); });
    });
    // Pinching: the moment between the fingers stays under them.
    /** @type {{d0: number, px0: number, t: number} | null} */
    let pinch = null, pinching = false;
    /** @type {[number, {t: number, x: number}]} */
    let pinchTo = [0, {t: 0, x: 0}];
    /** @param {TouchList} ts */
    const spread = ts => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
    /** @param {TouchList} ts */
    const between = ts => (ts[0].clientX + ts[1].clientX) / 2 - scroller.getBoundingClientRect().left;
    // A touch keeps going to the element first touched, even once a redraw
    // has taken it out of the page - where it no longer reaches the scroller -
    // so a pinch listens on the touched elements themselves till it ends.
    /** @param {TouchEvent} e */
    function pinchMove(e) {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      // Once a frame, at the fingers' latest spread.
      pinchTo = [Math.min(MAX, Math.max(outDayPx(), pinch.px0 * spread(e.touches) / pinch.d0)),
                 {t: pinch.t, x: between(e.touches)}];
      if (pinching) return;
      pinching = true;
      requestAnimationFrame(() => {
        pinching = false;
        setZoom(pinchTo[0], pinchTo[1], true);
        zoom.value = String(sliderFor(pinchTo[0]));
      });
    }
    /** @type {EventTarget[]} */
    let held = [];
    /** @param {TouchEvent} e */
    function pinchEnd(e) {
      if (!pinch || e.touches.length >= 2) return;
      pinch = null;
      held.forEach(el => {
        el.removeEventListener("touchmove", /** @type {EventListener} */ (pinchMove));
        el.removeEventListener("touchend", /** @type {EventListener} */ (pinchEnd));
        el.removeEventListener("touchcancel", /** @type {EventListener} */ (pinchEnd));
      });
      held = [];
      requestAnimationFrame(remember);
    }
    if (touch) {
      scroller.style.touchAction = "pan-x";    // one finger scrolls; two are ours
      scroller.addEventListener("touchstart", (/** @type {TouchEvent} */ e) => {
        if (e.touches.length !== 2 || pinch) return;
        gliding++;
        pinch = {d0: spread(e.touches), px0: g.dayPx, t: (scroller.scrollLeft + between(e.touches) - g.left) * g.spp};
        held = [...new Set([e.touches[0].target, e.touches[1].target])];
        held.forEach(el => {
          el.addEventListener("touchmove", /** @type {EventListener} */ (pinchMove), {passive: false});
          el.addEventListener("touchend", /** @type {EventListener} */ (pinchEnd));
          el.addEventListener("touchcancel", /** @type {EventListener} */ (pinchEnd));
        });
      }, {passive: true});
    }
    // Grab the chart and drag it along, as a map: the mouse only (a touch
    // screen scrolls by itself). A click that didn't move still picks a line;
    // one that did is swallowed, so a drag never selects.
    // Let go mid-drag and it coasts, slowing, as a flicked page does.
    /** @type {{x: number, left: number, moved: boolean, trail: [number, number][]} | null} */
    let drag = null;
    let coasting = 0;
    scroller.style.cursor = "grab";
    scroller.addEventListener("pointerdown", (/** @type {PointerEvent} */ e) => {
      coasting++;
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = {x: e.clientX, left: scroller.scrollLeft, moved: false, trail: [[e.timeStamp, e.clientX]]};
      e.preventDefault();
    });
    scroller.addEventListener("wheel", () => { coasting++; }, {passive: true});
    addEventListener("pointermove", (/** @type {PointerEvent} */ e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.trail.push([e.timeStamp, e.clientX]);
      if (drag.trail.length > 12) drag.trail.shift();
      if (!drag.moved && Math.abs(dx) < 4) return;
      drag.moved = true;
      scroller.style.cursor = "grabbing";
      scroller.scrollLeft = drag.left - dx;
    });
    /** @param {number} speed px a millisecond, the way the chart was moving */
    function coast(speed) {
      const run = ++coasting;
      let last = -1;
      const step = (/** @type {number} */ now) => {
        if (run !== coasting) return;
        if (last >= 0) {
          const dt = Math.min(50, now - last);
          scroller.scrollLeft -= speed * dt;
          speed *= Math.pow(0.95, dt / 16);
        }
        last = now;
        if (Math.abs(speed) > 0.02) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    addEventListener("pointerup", (/** @type {PointerEvent} */ e) => {
      if (drag && drag.moved) {
        // Only the last tenth of a second counts: drag, pause, let go, and it
        // stays where it was put.
        const recent = drag.trail.filter(([t]) => e.timeStamp - t <= 100);
        if (recent.length > 1 && Math.abs(e.clientX - recent[0][1]) > 3) {
          coast((e.clientX - recent[0][1]) / (e.timeStamp - recent[0][0]));
        }
        // The click that follows this release, if it lands here; gone after,
        // so a release off the chart can't swallow a later click.
        const swallow = (/** @type {Event} */ e) => { e.stopPropagation(); e.preventDefault(); };
        scroller.addEventListener("click", swallow, {capture: true, once: true});
        setTimeout(() => scroller.removeEventListener("click", swallow, {capture: true}), 0);
      }
      drag = null;
      scroller.style.cursor = "grab";
    });
    scroller.addEventListener("scroll", () => {
      if (Math.abs(scroller.scrollLeft - placed) > 1) { placed = -1; remember(); }
      const at = scroller.scrollLeft - data.left;
      if (at < drawn[0] + 20 && drawn[0] > 0 || at + scroller.clientWidth > drawn[1] - 20) drawWindow();
      place();
    });

    // The whole range in miniature, the screen's part boxed: drag the box (it
    // keeps hold of the point grabbed) or click elsewhere to centre there.
    // The strip is the data alone, first moment to last - not the chart's
    // margins and label room, which drew as empty days past the last one.
    /** @param {number} px a chart x @returns {number} where it is along the strip, 0 to 1 */
    const along = px => (px - g.left) / g.columns;
    function drawOverview() {
      const w = ov.clientWidth, h = 30, n = env.length;
      let top = 1;
      for (let k = 0; k < n; k++) if (env[k] > top) top = env[k];
      let d = "M0," + h;
      for (let i = 0; i < 600; i++) {
        const k = Math.round(i * (n - 1) / 599);
        d += " L" + (k / (n - 1) * w).toFixed(1) + "," + (h - 3 - env[k] / top * (h - 8)).toFixed(1);
      }
      let marks = "";
      data.days.slice(1).forEach((/** @type {number[]} */ day) => {
        const x = (day[0] / data.span * w).toFixed(1);
        marks += '<line x1="' + x + '" x2="' + x + '" y1="0" y2="' + h + '" class="ov-day"/>';
      });
      ov.innerHTML = '<path class="ov-area" d="' + d + " L" + w + "," + h + ' Z"/>' + marks
        + '<rect class="ov-box" y="1" height="' + (h - 2) + '" rx="3"/>';
      place();
    }
    function place() {
      const w = ov.clientWidth, box = ov.querySelector(".ov-box");
      if (!box) return;
      const from = Math.max(0, along(scroller.scrollLeft));
      const to = Math.min(1, along(scroller.scrollLeft + scroller.clientWidth));
      box.setAttribute("x", (from * w).toFixed(1));
      box.setAttribute("width", Math.max(6, (to - from) * w).toFixed(1));
      wrap.classList.toggle("more", scroller.scrollLeft > 4);
    }
    let grab = 0.5, dragging = false;
    /** @param {PointerEvent} e */
    function jump(e) {
      const r = ov.getBoundingClientRect(), view = scroller.clientWidth / g.columns;
      scroller.scrollLeft = g.left + ((e.clientX - r.left) / r.width - grab * view) * g.columns;
    }
    /** @type {[number, number][]} the last few moments of a drag: when, and where the scroll was */
    let ovTrail = [];
    ov.addEventListener("pointerdown", (/** @type {PointerEvent} */ e) => {
      coasting++;
      ovTrail = [[e.timeStamp, scroller.scrollLeft]];
      const r = ov.getBoundingClientRect(), at = (e.clientX - r.left) / r.width;
      const from = along(scroller.scrollLeft), view = scroller.clientWidth / g.columns;
      grab = at >= from && at <= from + view ? (at - from) / view : 0.5;
      dragging = true; ov.setPointerCapture(e.pointerId); jump(e);
    });
    ov.addEventListener("pointermove", (/** @type {PointerEvent} */ e) => {
      if (!dragging) return;
      jump(e);
      ovTrail.push([e.timeStamp, scroller.scrollLeft]);
      if (ovTrail.length > 12) ovTrail.shift();
    });
    // Let go of the box mid-drag and it coasts on, as the chart does.
    ov.addEventListener("pointerup", (/** @type {PointerEvent} */ e) => {
      dragging = false;
      const recent = ovTrail.filter(([t]) => e.timeStamp - t <= 100);
      if (recent.length > 1) {
        const [t0, s0] = recent[0], [t1, s1] = recent[recent.length - 1];
        if (t1 > t0 && Math.abs(s1 - s0) > 3) coast(-(s1 - s0) / (e.timeStamp - t0));
      }
    });

    // Pointing at a line lights it, the rest fading back, and the tip gives
    // its name, the stretch under the pointer and when it was open. Pointing
    // at the foot line gives that stretch of it. Only what is there: empty
    // space shows nothing.
    const names = Object.assign({strong: "strong", medium: "medium", faint: "faint", foot: "foot", foot2: "foot"},
                                data.names || {});
    // "Thu 24 22:42", in the order of the day headers, the reader's words.
    /** @param {number} t seconds from the left edge @param {boolean} [day] */
    function clock(t, day) {
      const d = new Date((data.lo + t) * 1000);
      const time = d.toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"});
      return day ? d.toLocaleDateString(undefined, {weekday: "short"}).replace(/[.,]/g, "") + " " + d.getDate()
        + " " + time : time;
    }
    /** @param {number} s @param {number} e */
    function period(s, e) {
      const sameDay = new Date((data.lo + s) * 1000).toDateString() === new Date((data.lo + e) * 1000).toDateString();
      const mins = Math.round((e - s) / 60);
      const long = mins < 60 ? mins + "m"
        : mins < 1440 ? Math.floor(mins / 60) + "h" + (mins % 60 ? " " + mins % 60 + "m" : "")
        : Math.round(mins / 60) + "h";
      return clock(s, true) + " &ndash; " + clock(e, !sameDay) + " (" + long + ")";
    }
    /**
     * What a line shows at a pixel - the strongest state in it, as drawn -
     * and that state's stretch: from where it starts to where it ends.
     * @param {any} seg @param {number} t0 @param {number} t1 the pixel's time
     * @returns {[string, number, number]}
     */
    function stretchAt(seg, t0, t1) {
      /** @param {number[][]} pairs */
      const hit = pairs => pairs.find(p => p[0] < t1 && t0 < p[1]);
      const f = hit(seg.f);
      if (f) return [names.strong, f[0], f[1]];
      const w = hit(seg.w);
      if (w) return [names.medium, Math.max(w[0], seg.s), Math.min(w[1], seg.e)];
      // Faint: between whatever strong or medium stretch ends before and starts after.
      let from = seg.s, to = seg.e;
      for (const p of seg.f.concat(seg.w)) {
        if (p[1] <= t0 && p[1] > from) from = p[1];
        if (p[0] >= t1 && p[0] < to) to = p[0];
      }
      return [names.faint, from, to];
    }
    let lit = -1;
    /** @param {number} index */
    function light(index) {
      if (index === lit) return;
      lit = index;
      chart.classList.toggle("hovering", index >= 0);
      chart.querySelectorAll(".lit").forEach((/** @type {Element} */ el) => el.classList.remove("lit"));
      if (index < 0) return;
      chart.querySelectorAll('[data-index="' + index + '"]')
        .forEach((/** @type {Element} */ el) => el.classList.add("lit"));
    }
    relight = () => { const was = lit; lit = -1; light(was); };
    chart.addEventListener("mousemove", (/** @type {MouseEvent} */ e) => {
      const target = /** @type {SVGElement} */ (e.target), ds = target.dataset || {};
      const r = chart.getBoundingClientRect(), t = (e.clientX - r.left - g.left) * g.spp;
      let html = "";
      // A moment on a line (a commit, a merge): what and when - and its line lit.
      const mark = /** @type {SVGElement | null} */ (target.closest ? target.closest(".pinch, .badge") : null);
      if (mark && mark.dataset.index !== undefined) {
        const index = +mark.dataset.index, n = +(mark.dataset.n || 1), kinds = data.moments || {};
        const kind = (mark.classList.contains("badge") ? kinds.b : kinds.m) || "moment";
        light(index);
        html = "<b>" + View.esc(data.segs[index].name) + "</b><br>"
          + (n > 1 ? n + " &times; " + View.esc(kind) + ", about " : View.esc(kind) + ": ") + clock(+(mark.dataset.t || 0), true);
      } else if (ds.index !== undefined && target.classList.contains("grab")) {
        const index = +ds.index, seg = data.segs[index], drawn = g.segs[index];
        light(index);
        const [state, s, en] = stretchAt(seg, t - g.spp / 2, t + g.spp / 2);
        html = "<b>" + View.esc(seg.name) + "</b><br>" + View.esc(state) + ": " + period(s, en)
          + "<br>open: " + (View.reachesEnd(data, drawn.end) ? "since " + clock(seg.s, true) : period(seg.s, seg.e));
      } else {
        light(-1);
        if (ds.foot) html = "<b>" + View.esc(names[/** @type {"foot" | "foot2"} */ (ds.foot)]) + "</b><br>"
          + period(+(ds.s || 0), +(ds.e || 0));
      }
      if (!html) { tip.style.display = "none"; return; }
      tip.innerHTML = html;
      // Beside the pointer, kept on the screen.
      tip.style.display = "block";
      tip.style.left = Math.max(4, Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 4)) + "px";
      tip.style.top = (e.clientY + 14 + tip.offsetHeight > innerHeight ? e.clientY - 14 - tip.offsetHeight
        : e.clientY + 14) + "px";
    });
    chart.addEventListener("mouseleave", () => { tip.style.display = "none"; light(-1); });
    chart.addEventListener("click", (/** @type {MouseEvent} */ e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (opts.onPick) {
        const index = target.dataset && target.dataset.index !== undefined ? +target.dataset.index : -1;
        opts.onPick(index >= 0 ? data.segs[index] : null, index);
      }
    });

    // Set the slider to a zoom: where it sits depends on the window's width,
    // as its "all" end is the whole range fitting the window.
    /** @param {number} dayPx @returns {number} the zoom, within the slider's range */
    function slideTo(dayPx) {
      fitToScreen();
      const within = Math.min(MAX, Math.max(outDayPx(), dayPx));
      zoom.value = String(sliderFor(within));
      zoom.disabled = outDayPx() >= MAX;
      // "all" if the whole range fits; else how much the furthest out shows.
      const days = columnsNow() / outDayPx();
      q(".out").textContent = fitDayPx() >= outDayPx() ? "all" : (days < 1.5 ? "a day" : Math.round(days) + " days");
      return within;
    }
    /** @param {number} [dayPx] */
    function start(dayPx) {
      gliding++;
      const opening = slideTo(dayPx || openPx());
      g = null;
      setZoom(opening);
    }

    // An opening only plays once it can be seen: the page showing (a tab
    // opened in the background draws no frames, and it would be over before
    // anyone saw it), and the chart itself on screen - on a long page it may
    // sit a scroll or two down, and played on load it would be over before the
    // reader got there. Inside a frame, the observer watches the top page's viewport.
    /** @param {() => void} go */
    function whenSeen(go) {
      const showing = () => typeof document === "undefined" || document.visibilityState !== "hidden";
      const onScreen = (/** @type {() => void} */ next) => {
        if (typeof IntersectionObserver === "undefined") { next(); return; }
        const seen = new IntersectionObserver(entries => {
          if (!entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.3)) return;
          seen.disconnect();
          next();
        }, {threshold: [0, 0.3, 0.6]});
        seen.observe(host);
      };
      onScreen(() => {
        if (showing()) { go(); return; }
        document.addEventListener("visibilitychange", function shown() {
          if (!showing()) return;
          document.removeEventListener("visibilitychange", shown);
          go();
        });
      });
    }
    // The opening glide: from zoomed furthest out in to `dayPx`, easing in and
    // out - a gentle start, a steady middle, a gentle stop (smootherstep, on the
    // zoom's log scale). Kept to the anchor (the right end, at first); any
    // scroll or zoom by the reader stops it.
    /** @param {number} [dayPx] @param {number} [ms] */
    function glide(dayPx, ms) {
      const to = dayPx || openPx(), from = outDayPx(), took = ms || 1800;
      const still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (still || to <= from * 1.05) { start(to); return; }
      start(from);
      const run = ++gliding, a = Math.log(from), b = Math.log(Math.min(MAX, to));
      // Timed from the first frame actually drawn, and only once the page is
      // showing: a tab opened in the background draws no frames, and the
      // glide would otherwise be over before anyone saw it.
      let t0 = -1;
      /** @param {number} now */
      const step = now => {
        if (run !== gliding) return;
        if (t0 < 0) t0 = now;
        const p = Math.min(1, (now - t0) / took);
        const eased = p * p * p * (p * (6 * p - 15) + 10);
        const px = Math.exp(a + (b - a) * eased);
        setZoom(px, undefined, p < 1);
        zoom.value = String(sliderFor(px));
        if (p < 1) requestAnimationFrame(step);
      };
      whenSeen(() => requestAnimationFrame(step));
    }
    // The opening replay: the whole range at once, time played across it left
    // to right in a second and a half - the strata building up as they happened.
    // The zoom stays put; a wipe uncovers the chart, and the labels wait and fade
    // in at the end (the page's CSS: .replaying .lab). Stops if the reader
    // scrolls or zooms; skipped for reduced motion.
    /** @param {number} [ms] */
    function replay(ms) {
      start(outDayPx());
      const still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (still) return;
      const run = ++gliding, took = ms || 1500;
      const hide = () => { chart.style.clipPath = ""; chart.classList.remove("replaying"); };
      chart.style.clipPath = "inset(0 100% 0 0)";
      chart.classList.add("replaying");
      let t0 = -1;
      /** @param {number} now */
      const step = now => {
        if (run !== gliding) { hide(); return; }
        if (t0 < 0) t0 = now;
        const p = Math.min(1, (now - t0) / took);
        const eased = p * p * (3 - 2 * p);        // gentle at both ends, steady through the middle
        const shown = g.left + eased * g.columns;
        chart.style.clipPath = p >= 1 ? "" : "inset(0 " + Math.max(0, g.width - shown) + "px 0 0)";
        if (p < 1) requestAnimationFrame(step); else hide();
      };
      whenSeen(() => requestAnimationFrame(step));
    }
    // Where the reader was, for a fresh mount on new data to pick up from (a
    // filter changed, say): the zoom from furthest out (0) to closest (1),
    // and which end of the range the screen keeps to, or the moment it was on.
    function state() {
      const out = outDayPx();
      const z = !g || out >= MAX ? 0 : Math.log(g.dayPx / out) / Math.log(MAX / out);
      const middle = g ? (scroller.scrollLeft + scroller.clientWidth / 2 - g.left) * g.spp : 0;
      return {zoom: Math.min(1, Math.max(0, z)), pin: anchor.pin,
              t: data.lo + (anchor.pin === "middle" ? anchor.t : middle)};
    }
    // ...and picking up: the same share of the zoom, though the range has
    // changed, kept to the same end; or to the same moment, the nearest the
    // range now has.
    /** @param {{zoom: number, pin: "start" | "end" | "middle", t: number}} was */
    function resume(was) {
      fitToScreen();
      anchor = {pin: was.pin, t: Math.min(data.span, Math.max(0, was.t - data.lo))};
      start(dayPxFor(1000 * was.zoom));
    }
    if (opts.resume) resume(opts.resume);
    else if (opts.intro === "replay") replay(); else if (opts.intro) glide(); else start();
    return {
      setZoom: setZoom, start: start, glide: glide, replay: replay, dayPx: () => g.dayPx, state: state,
      // The same zoom at the new width, the slider moved to match.
      resize: () => setZoom(slideTo(g.dayPx)),
    };
  }

  const api = {mount: mount};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StrataUI = api;
})(/** @type {any} */ (typeof self !== "undefined" ? self : this));
