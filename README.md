# Thin Analyser
Thin Analyser is an image analysis app created for soil micromorphology that allows the identification and quantification of objects having consistent color and shape within an image pair.

[Web](https://www.gianlucachiarani.it/projects/ThinAnalyser) - [Desktop](https://www.gianlucachiarani.it/projects/ThinAnalyser/download.html)

## Requirements
### Software
Chrome, Edge, Firefox, Safari (most up-to-date desktop versions) with Javascript enabled.

### Hardware
Hardware requirements vary depending on the size of the images to be analyzed. Indicatively, a Quad Core processor of 3 GHz or higher and at least 8 GB of RAM is recommended to analyze two 100 MB images.

## Analysis process
The analysis process of Thin analyzer can be divided into three steps: color comparison, segmentation, segments filtering. This process is repeated for each object to be analyzed. In the first step, the color of each pixel in the images is compared with the colors set by the user. The comparison is made by calculating Delta E, a value from 1 to 100 that measures the similarity distance between one color and another, where 1 indicates a total match to the chosen color and 100 indicates the opposite color. Pixels with the Delta E less than or equal to the maximum value set by the user (Max Delta E) are considered valid. The point is validated when at the same position the pixels of both images are valid. In the second step, arrays containing sets of adjacent valid points, called segments, are created. For each segment, the area, perimeter, compactness ratio, convexity ratio, aspect ratio and orientation are calculated. In the last step, segments whose geometric values do not fall between the min and max parameters set by the user are discarded. The remaining segments are drawn on the images.

## Geometric measurements
Centroids are the mean coordinates of all segment pixels, with fractional coordinates retained. Crop margins are added when exporting coordinates.

Aspect ratio and orientation use the principal axes of the segment's area moments, not the longest pair of boundary points. Each pixel is treated as a unit square, adding its variance of 1/12 to both diagonal moments. Aspect ratio is the square root of the smaller-to-larger eigenvalue ratio; a filled 10 by 3 rectangle therefore has aspect ratio 0.3. Major-axis angles are measured counterclockwise from the X axis with image Y inverted, in the range [-90, 90). Isotropic segments have aspect ratio 1 and conventionally use angle 0 because their orientation is undefined.

Previously saved aspect-ratio and orientation thresholds should be reviewed before reusing them with the corrected measurements. Compactness retains the exposed-edge raster perimeter; convexity retains the Euclidean convex-hull perimeter divided by that raster perimeter. These perimeter estimators have different discretization biases and should not be interpreted as rotation-invariant continuous measurements.
