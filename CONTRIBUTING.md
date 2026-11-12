# Maintaining the custom views

How to add a view to this repository, or refresh one, without missing a step. It is written for people and for
coding agents alike. The [README](README.md) says what the repository is; this file says how it works.

## What a view folder holds

Each view is a top-level folder named after the view's id (lower case, no spaces).

| File | What it is | Needed |
|---|---|---|
| `manifest.json` | The view definition Omniscope reads: name, options, option groups, data settings | Always |
| `index.html` | The view itself, using Omniscope's custom view API (`/_global_/customview/v1/omniscope.js`) | Always |
| `icon.svg`, `thumbnail.png` | Picker icon and gallery picture (see "Icons" below) | Always |
| `README.md` | What the view shows, its data and settings, its third-party libraries; GitHub shows it | Always |
| other files | Scripts, data or styles that `index.html` loads; list them in `views.json` `files` | When used |
| `sample-data/` | Invented sample data (CSV), with the script that generated it | New views |
| `showcase/showcase.md` | The gallery page, with its screenshots beside it | New views |
| `tests/cases.json` | Harness test cases (see below); data generators for large cases sit beside it | New views |
| `demo.ioz` | A demo project: sample data, a report with the view, and a check of the data | New views |

`npm run build` checks the rules below and fails on an error. Views tagged `visokio-agents` must have the whole set.

### Manifest rules

- **Option types** come from the custom view schema (`tools/harness/schema/customview-schema.json`):
  `GROUPING`, `MEASURE`, `FIELD`, `CHOICE`, `TOGGLE`, `NUMBER`, `TEXT`, `COLOUR`, `DATE` and a few more.
- **Every option in an option group must exist** in `options.items`.
- **Option display names** shouldn't equal likely field names ("Name", "Value", "Manager ID"): the settings panel
  then has several controls with the same label, which confuses people and UI automation alike.
- **`tags`**: lower-case search words. Views built by Visokio's agents carry `visokio-agents`, which also
  shows in the app's view picker and as a gallery badge.
- **Icons.** The view picker shows `icon.svg` on white at about 100 pixels, beside the core views. Match them:
  flat shapes in the picker's two or three blues, with orange as a single accent where it helps, no text,
  transparent background, `viewBox="0 0 32 32"`.
- **Picker tab and gallery category.** Add the view to `view-categories.json` with one or two of the view
  picker's tabs (`bar`, `line/scatter`, `diagram`, `map`, `network`, `table`, `tool`). The app files a view under
  a tab when one of its tags in `views.json` is the tab's name, so `npm run build` sets those tags from this file;
  the gallery's filters use it too, and the build warns about a view without one. Don't use a tab's name as an
  ordinary tag: in `views.json` the build removes it unless the view is in that tab.
- **Keep `index.html` pure ASCII** (use HTML entities or `\u` escapes), so an upload can't garble it.

## views.json

`views.json` is the list Omniscope's view picker offers from this repository. Its entries are curated: the
display name, tags and `version` there can differ from the manifest. `npm run build` keeps it in step with the
folders:

- a view folder not yet listed gets an entry from its manifest (name, tags, and any extra files in the folder);
- an entry whose folder has gone is removed;
- each entry's picker-tab tags are set from `view-categories.json` (see above);
- everything else in existing entries is left as it is.

**Bump `version`** when you change a published view, so Omniscope offers the new version. Already installed
copies aren't updated (see below). `tools/repo.ts` lists the folders deliberately left out of the picker.

## Tests

```bash
npm install
npm test            # tool tests, then every view's harness tests in headless Chrome
npm run test:views -- waffle kpi   # just these views
```

Headless Chrome or Chromium must be installed; set `CHROMIUM_PATH` if it isn't found. The views run four at a
time (about 11 minutes for all of them); `TEST_VIEWS_JOBS=1` runs one at a time, when a timing-sensitive case
needs a quiet machine. The Checks workflow runs one at a time (about 43 minutes),
because many cases wait a fixed time, which is too short on GitHub's machine with four running at once.

**The harness** (`tools/harness/`) is a stand-in for Omniscope's custom view API. It serves the view's own
`index.html` unchanged and answers its queries from a CSV, aggregating as Omniscope does (sum, mean, record
count, date histograms), with the same context, option and event shapes. Each case in `tests/cases.json` says
which data and options to use and what to check:

```json
{
  "name": "showcase", "showcase": true,
  "data": "sample-data/energy_mix.csv",
  "options": { "items": { "category": { "inputField": "Source", "type": "UNIQUE_VALUES" } } },
  "width": 900, "height": 480,
  "expect": { "selector": ".cell", "min": 100 },
  "actions": [ { "click": ".cell" }, { "expectSelection": true }, { "screenshot": "selected" } ]
}
```

A case fails on a console error, an error event from the view, a context that doesn't match the schema, or a
failed `expect`. Screenshots go to `tests/screenshots/` (not committed). Cover: a normal render, interaction and
selection, filtering, a small pane, empty data, unconfigured options and a large dataset. Cases marked
`"showcase": true` become the gallery page's live demos; a case with `"thumbnail": true` writes `thumbnail.png`
when run with `node tools/harness/run-test.js <view> --thumbnail` (render it at 580 x 580 with `"scale": 0.5` for a sharp 290-pixel image).

To look at a view by hand: `node tools/harness/server.js 8123`, then open
`http://localhost:8123/tools/harness/host.html?view=<view>&case=<case>`.

## Testing on your own Omniscope server

New views have a `demo.ioz`: the sample data, a report using the view, and a Validate Data block that checks
the data the report reads.

In Omniscope, open a folder you can write to, press **+** > **Upload** and choose `demo.ioz`; then click
`demo.ioz` in the file list and press **Import project**. It becomes the project `demo.iox` (an existing
`demo.iox` is not replaced: delete or rename it first).

To try a changed view in a report, open the report's view designer (or the project's Edit View API) and replace
the view's files. When you change a view, export the demo project again.

**Exporting a demo project.** In the project, open the menu (⋮) and choose **Download IOZ file**. Keep
**Include Report data** ticked, untick **Include project history** (it records every edit, including ones you
wouldn't publish) and leave **Include passwords** unticked. Then run `npm run slim-ioz -- path/to/demo.ioz`: it
removes the server's branding (about 1 MB of fonts and logos the importing server doesn't use). Commit the result
as the item's `demo.ioz`; keep it under 1 MB.

## Building

```bash
npm run build       # updates views.json, checks every manifest, builds the gallery into _site/
npm run serve       # serves _site/ on http://localhost:8080/
```

The gallery has a page per view built from its manifest and `showcase/showcase.md` (or `README.md`), with the
view running live on its sample data in the harness. Images in `showcase.md` whose alt text starts with "live"
become live demos, one per showcase case, in order. There is also an index page with search and filters, and
`catalogue.json`, a machine-readable list for agents.

### Related blocks and views (`related.json`)

Each gallery page has a **Related** section, from `related.json`: the core blocks and views, community views here
and community blocks in [omniscope-custom-blocks](https://github.com/visokio/omniscope-custom-blocks) that a user
should know about next to this view.

```json
{
  "items": {
    "<view path>": {
      "summary": "How this view fits with its neighbours: what to use instead for what, and why this one exists.",
      "overlaps": [{ "coreView": "<name as in the picker>", "note": "How they differ, and when to use which." }],
      "seeAlso": [{ "view": "<path of a view here>", "note": "..." }, { "block": "<path in omniscope-custom-blocks>", "name": "<its name>", "note": "..." }]
    }
  }
}
```

- **summary** (shown first): one to three sentences on the overall picture, not a repeat of the notes. Use
  `**bold**` for names. Every item with related items should have one.
- A reference is one of `coreBlock`, `coreView` (the picker's name), `block` or `view` (a community item's path).
  A reference to the other repository also gives the item's `name`, since this repository can't read its manifest.
- **overlaps**: the other item does much the same job, so a user could pick either. The note says how they
  differ and when to use which. **seeAlso**: a partial alternative, or something that works with it (a block whose
  output a view shows). Be selective: most items have none to three.
- **Links go both ways.** When one view here lists another, the other lists it back (in `overlaps` if it's an
  overlap); `npm run build` fails otherwise, and when a path doesn't exist. A link to a block in
  omniscope-custom-blocks should be mirrored there too, in the same change if you can.
- When you add a view, check the core picker and both galleries for anything similar, and add its entries.

## What the GitHub Actions do

- **Checks** (every push, and pull requests from forks): updates `views.json`, checks the manifests, type-checks the tools and
  runs `npm test`, harness tests included. On `master`, if `views.json` was out of date (typically after a view
  folder was added in GitHub's web editor), it commits the updated file as "Regenerate views.json after
  <commit>". On other branches an out-of-date `views.json` fails the check instead. The README badge shows the
  result.
- **Pages** (every push to `master`): builds the gallery and publishes it with GitHub Pages. There is no staging
  site, so preview with `npm run build && npm run serve` first. (Settings > Pages > Source: "GitHub Actions".)
- **Demo links** (manual): checks that every view with a `demo.ioz` has its demo project on the public demo
  server, and lists the missing ones. It changes nothing.

## When the app sees a change

Omniscope fetches `views.json` and the view files through the jsDelivr CDN, which caches GitHub content. A change
on `master` can take up to a day to reach the app. To make it visible sooner, purge the cached copies of the files
you changed, for example `https://purge.jsdelivr.net/gh/visokio/omniscope-custom-views@master/views.json`.

Installing a view copies it into the project. Projects that already use a view keep their copy, even when a new
version is published, in case the new version needs different options.

## The public demo server

Each view's demo project is also on `https://public.omniscope.me/Community/Views/<view>/demo.iox/`. Gallery pages
link to it. Each folder there has a `README.md` linking back to the gallery.

```bash
npm run bundle:demo-server                      # writes _bundle/tree/ and a zip of it
OMNI_URL=https://public.omniscope.me OMNI_USER=... OMNI_PASS=... npm run publish:demo-server
# after failures, add -- --missing-only to do only what is still missing
```

`publish:demo-server` drives the Omniscope web UI in headless Chrome: it uploads each `demo.ioz` and README, opens
the `.ioz` (which unpacks it into `demo.iox`), waits for the project, and deletes the `.ioz`. The **Demo links**
workflow then confirms every link works.

Then **run each demo once**. Unpacking doesn't run the workflow, and visitors can only view, so until it has run
its blocks show as never run. Use the Workflow REST API (the account needs "Workflow Execution via APIs"): POST
`{"blocks": ["<the demo's check block>"]}` to `<project>/w/execute`, then GET `<project>/w/job/<jobId>/state`
until it says `COMPLETED`. The server stores new folder names capitalised (`JSON` becomes `Json`) and redirects
other spellings, but a POST doesn't follow the redirect: GET the project's address first and POST to the address
it redirects to.

## Adding or refreshing a view with a coding agent

An agent session can do the whole job. Give it this file, the
[custom view documentation](https://omniscope.me/_global_/customview/v1/docs/) and the view's folder, and ask for:

1. `manifest.json` and `index.html`, with invented sample data in `sample-data/` and the script that made it.
2. `tests/cases.json` covering the cases listed above, passing under `npm run test:views -- <view>`.
3. `README.md` (what it shows, data, settings, interaction, third-party libraries with versions and licences)
   and `showcase/showcase.md` in the shape of the existing ones, with one `![live ...]()` placeholder per live
   demo.
4. A demo project on a test server, exported as `demo.ioz`.
5. `npm run build` clean, and the gallery page checked with `npm run serve`.

Ask it to check, before building, which built-in Omniscope view or existing community view comes closest, and to
say in the showcase why you'd use this one instead.
(The `visokio-agents` tag is only for views built by Visokio's own agents.)

The views tagged `visokio-agents` in this repository were built that way, by Visokio's agents working to Visokio's
instructions, and tested with the harness here and in a real Omniscope report.

## Standards every view meets

Agreed with Visokio for the 2026 refresh; keep new and updated views to them.

- **README sections**: what it shows, the data it needs, options, a **"Why do this in Omniscope"** section that is
  specific to this view (what it adds to a report that the core views don't, what you'd change in it), no
  boilerplate repeated across views; libraries and licences; and the closest core view.
- **Icon**: the view picker's style, a simple flat drawing in the picker's blues (`#467de7`, `#5789e9`,
  `#7aa2ee`, `#aec6f5`, `#d6e3fa`) with orange (`#f68c11`) as the one highlight; no text.
- **Names**: the manifest's `name` equals the view's `displayName` in `views.json` (what the picker shows), and
  should not be a core view's name (the server refused to install a view called "Web").
- **Versions**: when a view's files change, raise its `version` in `views.json` so installed copies are offered
  the update; list in `files` only files that are in the folder.
- **Safe with any data**: insert data values as text, never as HTML; never act (set parameters, execute blocks)
  on load, only on a user's click.
- **Breaking changes are allowed.** An item added to a project is a copy, so changing it here never changes
  projects that use it. Fix things properly rather than preserving a fault, but keep an option's key while the
  option means the same thing, and list every behaviour change under "Breaking changes" in the change notes or
  pull request, so a reviewer can judge them.
- **Licence.** The repository is MIT-licensed (`LICENSE`); a contribution is accepted under the same licence.
- **Third-party code is loaded, not copied in.** Load libraries from a CDN at a pinned version (jsDelivr's
  `npm/` or `gh/<owner>/<repo>@<commit>/`), never commit a copy. Nothing under a copyleft licence (GPL, AGPL)
  goes into the repository. Name each library, its version and licence in the README's libraries section, with
  any terms that fall on whoever uses the item (a paid licence for business use, a service's terms).
- **Data is invented.** Sample data and demos use invented records (say so in the README), or Omniscope's built-in
  Demo data datasets, which are fictional too. No real people, customers or transactions. Outlines and reference
  data from open sources carry their attribution in the README.
- **Demos that can't run say so on the canvas.** When a demo can't run the item for real (it needs an account,
  credentials, a server file, or permissions an anonymous viewer lacks), the workflow carries a note shape
  beside the item saying what isn't run and how to test it with your own setup.
- **Test it on a real server before it's done**, and after a merge add it from the app's own picker in a new
  project (the app reads the list from `master`, so that's the first time the picker route can be checked).

## Lessons for contributors

- **Use `result.mappings[option]`** to find an option's column in the auto-query result: columns come
  groupings first, then measures, but not in manifest order.
- **Measure names include the function** ("Sales (sum)"); use the measure's `inputField` for axis titles when it
  has no display name.
- **Record count takes no field**: `{"function": "RECORD_COUNT"}` with an `inputField` is rejected.
- **Dates from the Query API are strings**: date-only values as `yyyy-MM-dd`. A date histogram grouping needs
  `histogramInterval`, and its values are ranges (`{lower, upper}`). A date picked into a GROUPING option starts
  as a yearly histogram.
- **A column of times of day** (`08:00`) imports as a date on 1 January 1970: format time-only values as `HH:MM`.
- **New views start with auto-filled options** (the first mandatory grouping gets the first field, measures get
  record count). Anything cached from the first render (colour order, camera framing) must be refreshed when the
  real options arrive.
- **Colour must follow the category**, not its rank, so filtering doesn't recolour the chart: assign colours
  from an unfiltered query.
- **Refuse pathological input**: a view that draws one element per distinct value should stop above a sensible
  limit and say which option to change. Custom views share the report's main thread, so a slow view blocks the
  whole report.
- **With `autoQuery: false`** the view must apply `dataConfig.filter` itself in every query it makes.
- **Entrance animations**: gate them on a signature of the options and filter, so hover and selection don't
  replay them, and skip them when the system asks for reduced motion.
- **three.js in headless Chrome** needs `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist` and is
  slow; check WebGL output from a screenshot, as the canvas reads back blank.
