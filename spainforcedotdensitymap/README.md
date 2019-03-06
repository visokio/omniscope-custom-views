# ![](icon.svg) Spain Force Dot Density Map

Custom view that shows geographical dots on a flat base map. Dots are not accurately positioned but instead are spread to occupy the space nearby and avoid overlap.

The visualisation can be used to show density of data on a map. This focuses on singularity and accumulation over accuracy.
It also supports on hover tooltips which will display a title and a measure value.

The dataset consists of rows with an id value to split by and numerical values for the latitude and longitude coordinates.

![screenshot](thumbnail.png)

### Libraries:
 - [d3.js](https://d3js.org/)
 - [d3-annotation](https://d3-annotation.susielu.com/)