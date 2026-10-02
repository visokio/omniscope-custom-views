# ![](icon.svg) Strata

A timeline of things that open and close - sessions, tickets, projects, patients on a ward - drawn as layers
of cloth. Each thing is a line from when it opened to when it closed. At any moment the open ones are stacked,
the longest-lived on top, so the stack's height shows how much was open; each line rests on the ones beneath
and drapes down where one of them ends, so the picture shows things building up and clearing away. Along each
line, stretches can be emphasised - strong, medium or faint - and the strongest in each pixel wins, so a moment
of attention is never lost at any zoom.

Zoom runs from the whole range on one screen (or, where that is too dense - a long range, a narrow screen - as
many days as read well) to a day on a screen, and re-lays the cloth at every step. On a touch screen, pinch. A
strip above shows the whole range with the part on screen boxed; drag it, or click to jump. Pointing at a line
lights it and gives its name, the stretch under the pointer and when it was open; clicking it selects its rows,
for other views to brush.

**See it live:** [a report of two weeks of Claude Code sessions](https://public.omniscope.me/Public/Strata/Report.ior/),
and [its project and data](https://public.omniscope.me/Public/Strata/), free to open and download.

This folder is built from **[visokio/strata](https://github.com/visokio/strata)**, where the chart lives as a
standalone project: its source, tests, example data and the tools that make standalone pages. Changes go there;
its build makes this folder.

![screenshot](thumbnail.png)

## Try it in Omniscope

1. **No Omniscope yet?** [Try it free](https://omniscope.visokio.com/): sign up and you're in Omniscope, in your
   browser.
2. **Start from the demo.** Download
   [`test.ioz`](https://github.com/visokio/omniscope-custom-views/blob/master/strata/test.ioz) - a project with
   the demo data, its report and Strata already set up - and open it in your Omniscope. Then change the data,
   filters and settings from there.
3. **Or add Strata to your own report:** **Add View → Strata**. It needs one table with, at the least:
   - **Layer** - what each line is: a session, a ticket, a project id;
   - **Start** and **End** - each stretch's times, as dates (not text).

   A line runs from its first Start to its last End. Then, optionally: **Label** (the line's name), **Colour by**
   (lines sharing a value share a colour), **Emphasis** (2 strong, 1 medium, 0 faint) and **Moment time** (events
   on a line, such as commits). [Data](#data) has every field; [From business data](#from-business-data) shows how
   the demo composes its one table from four, step by step, so filters on any of them reach the view.

## Data

One row per stretch of time: which line it belongs to, when it starts and ends, and optionally how strongly to
show it. A line runs from its rows' first start to their last end, including any gaps between them.

| Field | Type | Example |
|---|---|---|
| Layer | any | `S12` - a session, ticket or project id |
| Start, End | date | `2026-09-29 09:12:53` |
| Label | text | `DEV · Release` |
| Colour | text | `DEV` |
| Emphasis | number | `2` strong, `1` medium, `0` faint |
| Foot | text | `claude` / `other` - on rows with no Layer |
| Moment time | date | a commit's time - on rows with no Start or End |
| Moment | text | `commit` / `merge` - what kind of moment |

Along the foot runs a heavy line. Without a Foot line field, it is drawn from the lines themselves: wherever
any of them is strong (Emphasis 2), so it filters as they do. To draw it from data of its own instead, add rows
with no Layer and a Foot value (appended to the same table upstream in the workflow) and choose that field: up
to two Foot values are shown, the more frequent darker. The chart's range is the lines' either way.

### From business data

The table is best composed in the report from the data as it is, with its own field names, so filters on the
sources reach the view. The live demo's data is four tables (in the [public folder](https://public.omniscope.me/Public/Strata/),
and in `examples/` of visokio/strata):

- **Sessions**: Session, Workspace, Session Name, Opened, Closed, Hours Open, ...
- **Stretches**: Session, Start, End, State (`me` / `claude` / `idle`)
- **Attention**: Start, End, Where (`claude` / `other`)
- **Commits**: Session, At, Commit

The report chains its data sources:

- **Append** Commits to Stretches, so each commit is a row of its session.
- **Join** that to Sessions on Session: each row gets its Workspace and Session Name.
- **Formula** fields on the join: a display name, and State as an emphasis number:
  ```
  [Workspace] + IF([Session Name]=null, "", " · " + [Session Name])
  IF([State]="me", 2, IF([State]="claude", 1, 0))
  ```

Map Layer = Session, Start, End, Label = the display name, Colour by = Workspace, Emphasis = the emphasis
formula, Moment time = At. A filter on Sessions (a workspace, say) then takes whole lines out, on Stretches
trims them, and the foot line - drawn from the lines - follows either. Each commit is a tiny triangle on its
line; leave Moment kind blank (it names *kinds* of moment, and a field holding the hash would make every commit
a kind of its own).

To show attention outside the sessions on the foot line too, **append** Attention to the join, matching Start
and End (its rows have no Session), and set Foot line = Where. Attention isn't joined to sessions, so only a
time filter reaches it - a filter linked across the tables, say; one on Sessions leaves it whole.

## Settings

In four sections of the options panel: Chart (Layer, Start, End, Stacking), Line (Label, Line labels, Colour by,
Emphasis, Moment time, Moment kind), Foot (Foot line, Working-day marks, Daily meeting) and Animation (Opening).

- **Layer** (mandatory): what each line is.
- **Start**, **End** (mandatory, dates): each row's stretch.
- **Label**: the name shown on the line and when pointing at it. Defaults to the Layer value.
- **Colour by**: lines sharing a value share a colour, in the order of the most time. Defaults to one per line.
- **Emphasis**: per row, 2 strong (the colour darkened), 1 medium (a clear tint), 0 or blank faint (a pale
  tint). Each pixel shows the strongest stretch in it.
- **Foot line**: the field whose values mark foot-line rows (rows with no Layer). Blank: drawn from the lines,
  wherever any is strong.
- **Moment time**: rows with a time here, and no Start or End, are moments on their line at that time (a
  commit, appended from a table of its own). Rows whose Start and End are the same are moments too. A moment
  is drawn as a pinch: a tiny grey triangle above the line, its point on the line's edge. Only moments within
  their line's stretches are drawn.
- **Moment kind**: what kind each moment is. The commonest kind stays a pinch and the next becomes a badge with
  a tick (a commit and a merge, in the git examples).
- **Stacking**: *Longest-lived on top* (short-lived lines slide in beneath and lift the long ones),
  *Longest-lived at the bottom* (the long ones lie flat, the short-lived ride on top of them) or *Oldest at the
  bottom* (new lines go on top).
- **Line labels**: *At the end*, *At the start* or *None*: where the lines still open at the right edge are
  named. Every other line is named by pointing at it.
- **Working-day marks**: each day's 8am-4pm under the foot line, dots at 8, 12 and 4.
- **Daily meeting**: a time such as `09:30`, marked on weekdays.
- **Opening**: *Glide in* from the whole range to about a week on the screen, *Replay the timeline* from left
  to right, or *None*: how the view opens the first time it loads.

Filtering works as usual, row by row: the view draws only the rows the report's filters pass. So a filter that
passes some of a line's rows shortens the line to them - filter to one day and a week-long session shows as
that day's stretches. When a filter changes, the chart spans what passes and keeps the reader's place: the
same share of the way from furthest out to closest in, and the same end of the range if the screen was at one,
else the same moment (the nearest the range still has).

Times are shown as Omniscope shows them, the same clock time wherever the report is opened.

The view fills its pane's height: with room to spare, as headroom above the lines (nothing is stretched); in a
pane too short for every line open at once, the shortest-lived lines at the crowded moments are left out -
never one at a quiet time - and the view says how many ("12 shorter lines left out to fit").

## Files

`index.html` (the view), `manifest.json` (its options), `icon.svg`, `thumbnail.png`, and the three scripts
from visokio/strata's `src/`: `strata-cloth.js` (the cloth layout), `strata-view.js` (drawing) and
`strata-ui.js` (scrolling, zoom, overview, tooltip).
