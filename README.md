# Omniscope Custom Views

**[Browse the gallery](https://visokio.github.io/omniscope-custom-views/)**: every view, most of them running live
on sample data, with their settings and a demo project.

Community blocks (Python and R blocks for workflows) are in [omniscope-custom-blocks](https://github.com/visokio/omniscope-custom-blocks)
([gallery](https://visokio.github.io/omniscope-custom-blocks/)).

To compare community and core blocks and views in one list, with filters, use the [Blocks and Views Explorer](https://public.omniscope.me/Community/Blocks+and+Views+Explorer.iox/r/Report/).

[![Checks](https://github.com/visokio/omniscope-custom-views/actions/workflows/checks.yml/badge.svg)](https://github.com/visokio/omniscope-custom-views/actions/workflows/checks.yml)

Community views for [Omniscope](https://visokio.com/) reports: charts and interactive views built with
Omniscope's [custom view API](https://omniscope.me/_global_/customview/v1/docs/). They behave like the built-in
views: they follow the report's filters, and selecting in them selects in the other views.

## How Omniscope uses this repository

- Omniscope reads `views.json` and offers the views listed there in the report's view picker.
- Adding a view to a report **installs a copy** in the project. Editing or deleting a view here never changes a
  project that already uses it; when a new version is published, Omniscope offers it for new installs.
- Once installed, a view can be customised in the project's view designer.

Discussion and questions: the [Omniscope forums](https://help.visokio.com/support/discussions/topics/42000001524).

## Built by Visokio's agents

Views tagged **visokio-agents** are community examples built by Visokio's agents, to extend Omniscope's core
views with popular, specialist and more unusual use cases, and to show what anyone, people or agents, can build on
Omniscope. They are tested by automated tests and were run on a real Omniscope server. They were not reviewed by
Omniscope's core team, so they are not on a par with the core views, which have years of manual, functional and
unit tests behind them. Their sample data is invented.

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) has everything needed to add or refresh a view: the file set and manifest
rules, the test harness, the build, the gallery and the demo server. Fork the repository, add your view, run
`npm run build` and `npm test`, and open a pull request.

## Licence

MIT, see [LICENSE](LICENSE). Libraries that a view loads (named in its README) keep their own licences and terms.
