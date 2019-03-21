# ![](icon.svg) Spain Force Dot Density Map

Custom view that shows geographical dots on a flat base map. Dots are not accurately positioned but instead are spread to occupy the space nearby and avoid overlap.

The dataset consists of rows with an id value to split by and numerical values for the latitude and longitude coordinates.

## Use case

The visualisation can be used to show density of data on a map. This focuses on singularity and accumulation over accuracy.
It also supports on hover tooltips which will display a title and a measure value.

## Settings

 - Chart:
   - Split: Field to split markers by.
   - Latitude: Latitude value of the marker.
   - Longitude: Longitude value of the marker.
   
 - Marker:
   - Tooltip title (Optional): Static text to show as title of the tooltip when hovering.
   - Tooltip value (Optional): Measure value to show in the tooltip when hovering.

![screenshot](thumbnail.png)

### Libraries:
 - [d3.js](https://d3js.org/)
 - [d3-annotation](https://d3-annotation.susielu.com/)