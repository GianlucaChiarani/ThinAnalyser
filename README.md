# Thin Analyser
ThinAnalyser is an application designed for image analysis of soil thin sections. It allows users to identify and quantify objects with consistent color and shape within an image pair.

## Features
- Color Comparison: Compares the colors of objects in the images.
- Segmentation: Segments the objects based on the color comparison.
- Segments Filtering: Filters the segments to highlight specific objects of interest.
- Web and Desktop Versions: Available for use as a web application and a downloadable desktop application.

## Requirements
### Software
Supported browsers: Chrome, Edge, Firefox, Safari (latest desktop versions) with JavaScript enabled.

### Hardware
- Hardware requirements vary depending on the size of the images to be analyzed.
- Recommended: Quad Core processor of 3 GHz or higher, at least 8 GB of RAM for analyzing two 100 MB images.

## Installation
### Web Version
Visit the [Web Version](https://www.gianlucachiarani.it/projects/ThinAnalyser) to use the app directly in your browser.
### Desktop Version
Download the desktop version from the [Download Page](https://www.gianlucachiarani.it/projects/ThinAnalyser/download.html).

## Analysis process
The analysis process of ThinAnalyser is divided into three steps: color comparison, segmentation and segment filtering. This process is repeated for each object to be analyzed.
1. Color Comparison: The color of each pixel in the images is compared with the user-defined colors. This is done by calculating Delta E, a value ranging from 1 to 100 that measures the color difference, where 1 indicates an exact match and 100 indicates the opposite color. Pixels with Delta E less than or equal to the user-set maximum value (Max Delta E) are considered valid. A point is validated when the pixels at the same position in both images are valid.
2. Segmentation: Arrays containing sets of adjacent valid points, called segments, are created. For each segment, the area, perimeter, compactness ratio, convexity ratio, aspect ratio, and orientation are calculated.
3. Segment Filtering: Segments whose geometric values do not fall within the user-defined minimum and maximum parameters are discarded. The remaining segments are then drawn on the images.
