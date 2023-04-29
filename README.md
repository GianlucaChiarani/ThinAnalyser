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
