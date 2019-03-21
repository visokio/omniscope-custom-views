# ![](icon.svg) Venn Diagram

Custom view that shows 3 sets and its combinations.

Each set has to be configured with a range filter for a numerical field. The names of the sets can also be defined. By clicking the different sections, the combination of filters are applied to the report and the rest of the views. 

The dataset should have 3 clear groups defined by numerical fields and some other information to be used in other views.

## Use case

This visualisation can be used as a filter to control what is shown in other views.

## Settings
    
 - Filters:
   - Filter A:
     - Filter A field: Field used to create a range filter for the set A.
     - Filter A min: Minimum value for the field filter, if not set, the set won't have a filter.
     - Filter A max: Maximum value for the field filter, if not set, the set won't have a filter.
     - Set A name: Custom name for set A, if not set, the field name will be used.
     
   - Filter B:
     - Filter B field: Field used to create a range filter for the set B.
     - Filter B min: Minimum value for the field filter, if not set, the set won't have a filter.
     - Filter B max: Maximum value for the field filter, if not set, the set won't have a filter.
     - Set B name: Custom name for set B, if not set, the field name will be used.
        
   - Filter C:
     - Filter C field: Field used to create a range filter for the set C.
     - Filter C min: Minimum value for the field filter, if not set, the set won't have a filter.
     - Filter C max: Maximum value for the field filter, if not set, the set won't have a filter.
     - Set C name: Custom name for set C, if not set, the field name will be used.

![screenshot](thumbnail.png)

### Libraries:
 - [d3.js](https://d3js.org/)