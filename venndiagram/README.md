# ![](icon.svg) Venn Diagram

Custom view that shows 3 sets and its combinations.

Each set has to be configured with a range filter for a numerical field. The names of the sets can also be defined. By clicking the different sections, the combination of filters are applied to the report and the rest of the views. 

The dataset should have 3 clear groups defined by numerical fields and some other information to be used in other views.

## Use case

This visualisation can be used as a filter to control what is shown in other views.

## Settings
    
 - Filter options for each set:
     - Filter field: Field used to create a range filter for the set.
     - Filter min: Minimum value for the field filter, if not set, the set won't have a filter.
     - Filter max: Maximum value for the field filter, if not set, the set won't have a filter.
     - Set name: Custom name for the set, if not set, the field name will be used.

![screenshot](thumbnail.png)

### Libraries:
 - [d3.js](https://d3js.org/)