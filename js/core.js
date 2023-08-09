/**
 * ThinAnalyser (https://github.com/GianlucaChiarani/ThinAnalyser)
 * @version 1.3.0
 * @author Gianluca Chiarani
 * @license GNU General Public License (GPL)
 */

"use strict";

var pplPreviewCanvas = document.getElementById("ppl_preview_canvas");
var xplPreviewCanvas = document.getElementById("xpl_preview_canvas");

var pplCroppedCanvas = document.getElementById("ppl_cropped_canvas");
var xplCroppedCanvas = document.getElementById("xpl_cropped_canvas");

var pplResultsCanvas = document.getElementById("ppl_results_canvas");
var xplResultsCanvas = document.getElementById("xpl_results_canvas");

var pickerCanvas = document.getElementById("picker-canvas");

var pplPreviewCtx = pplPreviewCanvas.getContext("2d", {
  willReadFrequently: true,
});
var xplPreviewCtx = xplPreviewCanvas.getContext("2d", {
  willReadFrequently: true,
});

var pplCroppedCtx = pplCroppedCanvas.getContext("2d", {
  willReadFrequently: true,
});
var xplCroppedCtx = xplCroppedCanvas.getContext("2d", {
  willReadFrequently: true,
});

var pplResultsCtx = pplResultsCanvas.getContext("2d", {
  willReadFrequently: true,
});
var xplResultsCtx = xplResultsCanvas.getContext("2d", {
  willReadFrequently: true,
});

var pickerCanvasCtx = pickerCanvas.getContext("2d", {
  willReadFrequently: true,
});

var ppl, xpl;
var pplUploaded = false;

var percAdd;

var totalPixels, segmentPerimeterPixels, segmentAreaPixels;

var segments = [];
var validPixels = [];
var filtered = [];
var stats = [];
var statsProperties = [
  "area",
  "compactness",
  "convexity",
  "aspectRatio",
  "majorAxisAngle",
];
var labColors = {};

var pplColorTargetLab, xplColorTargetLab;

var imgDataPpl, imgDataXpl, imgDataMask, imgDataMaskB, imgDataMaskAll;
var status;

var margin = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  offsetX: 0,
  offsetY: 0,
};

var object = {};
var objects = [];
var maxObjects = 1;
var selectedObject = 1;

var cropper = false;
var pickerColorN = 1;

var firstRender = 0;

/* CUSTOM PARAMS */
var onlySelected = false;
var onlyFiltering = false;
var customWidth = false;
var originalSize = {
  width: 0,
  height: 0,
};

var comparisonPoints = [],
  comparisonValidPoints = [],
  trainingPoints = [],
  filteredTrainingPoints = [];

document
  .getElementById("ppl_loader")
  .addEventListener("change", pplHandleImage);
document
  .getElementById("xpl_loader")
  .addEventListener("change", xplHandleImage);
document.getElementById("obj_loader").addEventListener("change", loadObj);
document
  .getElementById("segments_loader")
  .addEventListener("change", importSegments);
document
  .getElementById("points_loader")
  .addEventListener("change", importPoints);

document.getElementById("start_btn").onclick = (event) => {
  start();
};

function pplHandleImage(e) {
  ppl = new Image();

  ppl.onload = function () {
    pplPreviewCanvas.width = ppl.width;
    pplPreviewCanvas.height = ppl.height;
    pplCroppedCanvas.width = ppl.width;
    pplCroppedCanvas.height = ppl.height;
    pplResultsCanvas.width = ppl.width;
    pplResultsCanvas.height = ppl.height;

    pplPreviewCtx.drawImage(ppl, 0, 0);
    pplCroppedCtx.drawImage(ppl, 0, 0);
    pplResultsCtx.drawImage(ppl, 0, 0);

    margin = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      offsetX: 0,
      offsetY: 0,
    };
    pplUploaded = true;

    document.getElementById("loading").style.display = "none";
    document.getElementById("ppl_preview").style.display = "block";
    document.getElementById("ppl_upload_icon").style.display = "none";
  };

  ppl.onerror = function () {
    document.getElementById("loading").style.display = "none";

    Swal.fire({
      text: "File not valid",
      icon: "warning",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  if (typeof e.target.files[0] != "undefined") {
    document.getElementById("loading").style.display = "block";
    ppl.src = URL.createObjectURL(e.target.files[0]);
  }
}

function xplHandleImage(e) {
  xpl = new Image();

  xpl.onload = function () {
    if (pplUploaded) {
      if (xpl.width == ppl.width && xpl.height == ppl.height) {
        xplPreviewCanvas.width = xpl.width;
        xplPreviewCanvas.height = xpl.height;
        xplCroppedCanvas.width = xpl.width;
        xplCroppedCanvas.height = xpl.height;
        xplResultsCanvas.width = xpl.width;
        xplResultsCanvas.height = xpl.height;

        xplPreviewCtx.drawImage(xpl, 0, 0);
        xplCroppedCtx.drawImage(xpl, 0, 0);
        xplResultsCtx.drawImage(xpl, 0, 0);

        margin = {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          offsetX: 0,
          offsetY: 0,
        };

        document.getElementById("xpl_preview").style.display = "block";
        document.getElementById("xpl_upload_icon").style.display = "none";
      } else {
        Swal.fire({
          text: "Images haven't same size.",
          icon: "warning",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } else {
      Swal.fire({
        text: "You must upload image 1 before.",
        icon: "warning",
        timer: 3000,
        showConfirmButton: false,
      });
    }

    document.getElementById("loading").style.display = "none";
  };

  xpl.onerror = function () {
    document.getElementById("loading").style.display = "none";
    Swal.fire({
      text: "File not valid",
      icon: "warning",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  if (typeof e.target.files[0] != "undefined") {
    document.getElementById("loading").style.display = "block";
    xpl.src = URL.createObjectURL(e.target.files[0]);
  }
}

function crop() {
  Swal.fire({
    title: "enter top, right, bottom, left margin (in px)",
    input: "text",
    inputValue:
      margin.top + "," + margin.right + "," + margin.bottom + "," + margin.left,
    showCancelButton: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-primary me-3",
      cancelButton: "btn btn-secondary",
    },
  }).then((result) => {
    let margins = result.value;
    if (margins) {
      margins = margins.split(",");
      margin.top = margins[0];
      margin.right = margins[1];
      margin.bottom = margins[2];
      margin.left = margins[3];

      Swal.fire({
        title: "enter horizontal & vertical image 2 offset (in px)",
        input: "text",
        inputValue: margin.offsetX + "," + margin.offsetY,
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn btn-primary me-3",
          cancelButton: "btn btn-secondary",
        },
      }).then((result) => {
        let offsets = result.value;
        if (offsets) {
          offsets = offsets.split(",");
          margin.offsetX = offsets[0];
          margin.offsetY = offsets[1];

          for (let k in margin) {
            margin[k] = parseInt(margin[k]);
          }

          var width = pplPreviewCanvas.width - margin.right - margin.left;
          var height = pplPreviewCanvas.height - margin.bottom - margin.top;

          pplResultsCtx.clearRect(
            0,
            0,
            pplResultsCanvas.width,
            pplResultsCanvas.height
          );
          xplResultsCtx.clearRect(
            0,
            0,
            xplResultsCanvas.width,
            xplResultsCanvas.height
          );

          pplCroppedCtx.clearRect(
            0,
            0,
            pplResultsCanvas.width,
            pplResultsCanvas.height
          );
          xplCroppedCtx.clearRect(
            0,
            0,
            xplResultsCanvas.width,
            xplResultsCanvas.height
          );

          pplResultsCanvas.width = width;
          pplResultsCanvas.height = height;

          xplResultsCanvas.width = width;
          xplResultsCanvas.height = height;

          pplCroppedCanvas.width = width;
          pplCroppedCanvas.height = height;

          xplCroppedCanvas.width = width;
          xplCroppedCanvas.height = height;

          pplCroppedCtx.drawImage(
            ppl,
            margin.left,
            margin.top,
            width,
            height,
            0,
            0,
            width,
            height
          );
          xplCroppedCtx.drawImage(
            xpl,
            margin.left + margin.offsetX,
            margin.top + margin.offsetY,
            width,
            height,
            0,
            0,
            width,
            height
          );

          pplResultsCtx.drawImage(
            ppl,
            margin.left,
            margin.top,
            width,
            height,
            0,
            0,
            width,
            height
          );
          xplResultsCtx.drawImage(
            xpl,
            margin.left + margin.offsetX,
            margin.top + margin.offsetY,
            width,
            height,
            0,
            0,
            width,
            height
          );

          //add_log("Cropped Region: "+new_width+" x "+new_height+" px");
        }
      });
    }
  });
}

function start() {
  document.getElementById("start_btn").disabled = true;
  document.getElementById("bottom-panel").style.display = "block";
  setObjectFromInputs(selectedObject);

  imgDataPpl = pplCroppedCtx.getImageData(
    0,
    0,
    pplCroppedCanvas.width,
    pplCroppedCanvas.height
  );
  imgDataXpl = xplCroppedCtx.getImageData(
    0,
    0,
    xplCroppedCanvas.width,
    xplCroppedCanvas.height
  );
  totalPixels = pplCroppedCanvas.width * pplCroppedCanvas.height;

  imgDataMaskAll = [];

  let startObject = onlySelected ? selectedObject : 1;

  if (onlyFiltering) {
    object = getObject(startObject);

    validPixels[startObject] = 0;
    filtered[startObject] = [];
    comparisonValidPoints[startObject] = [];
    filteredTrainingPoints[startObject] = [];

    setTimeout(preFiltering, 1, startObject);
    return;
  }

  setTimeout(initialization, 1, startObject);
}

function initialization(currentObject) {
  object = getObject(currentObject);

  validPixels[currentObject] = 0;
  segments[currentObject] = [];
  filtered[currentObject] = [];
  comparisonValidPoints[currentObject] = [];
  filteredTrainingPoints[currentObject] = [];

  imgDataMask = [];
  imgDataMaskB = [];

  updateStatus(currentObject, "Comparing colors...", 0);

  addLog(
    "Initializing '" +
      object.obj_name +
      "' (" +
      currentObject +
      " of " +
      maxObjects +
      "): min area: " +
      object.min_area +
      ", max area: " +
      object.max_area +
      ", min compactness: " +
      object.min_compactness +
      ", max compactness: " +
      object.max_compactness +
      ", min convexity: " +
      object.min_convexity +
      ", max convexity: " +
      object.max_convexity +
      ", min aspect ratio=" +
      object.min_aspect_ratio +
      ", max aspect ratio=" +
      object.max_aspect_ratio +
      ", min major axis angle: " +
      object.min_major_axis_angle +
      ", max major axis angle: " +
      object.max_major_axis_angle
  );
  addLog("Colors comparison started.");

  pplColorTargetLab = [];
  xplColorTargetLab = [];
  for (var i = 0; i < object.max_colors; i += 1) {
    pplColorTargetLab[i] = rgb2lab(
      hexToRgb(object["ppl_color_target_" + (i + 1)])
    );
    xplColorTargetLab[i] = rgb2lab(
      hexToRgb(object["xpl_color_target_" + (i + 1)])
    );
  }

  var perc = 0;
  var step = 25000000;
  percAdd = Math.floor(100 / (imgDataPpl.data.length / step));

  for (var start = 0; start < imgDataPpl.data.length; start += step) {
    if (start + step < imgDataPpl.data.length) var end = start + step;
    else var end = imgDataPpl.data.length;

    perc += percAdd;

    if (perc > 100) perc = 100;

    setTimeout(comparison, 1, currentObject, start, end, perc);
  }
}

function comparison(currentObject, start, end, perc) {
  var close, color1, color2;

  for (var i = start; i < end; i += 4) {
    if (typeof imgDataMaskAll[i / 4] == "undefined") {
      color1 = {
        r: imgDataPpl.data[i],
        g: imgDataPpl.data[i + 1],
        b: imgDataPpl.data[i + 2],
      };

      color2 = {
        r: imgDataXpl.data[i],
        g: imgDataXpl.data[i + 1],
        b: imgDataXpl.data[i + 2],
      };

      color1 = rgb2lab(color1);
      color2 = rgb2lab(color2);

      close = false;
      for (var i2 = 0; i2 < object.max_colors; i2 += 1) {
        let delta1 = deltaE(pplColorTargetLab[i2], color1);
        let delta2 = deltaE(xplColorTargetLab[i2], color2);

        let pplTollerance = object["ppl_tollerance_" + (i2 + 1)];
        let xplTollerance = object["xpl_tollerance_" + (i2 + 1)];

        if (pplTollerance >= delta1 && xplTollerance >= delta2) close = true;
      }
    } else {
      close = false;
    }

    if (close) {
      imgDataMask[i / 4] = true;
    } else {
      imgDataMask[i / 4] = false;
    }
  }

  if (end == imgDataPpl.data.length) {
    setTimeout(preSegmentation, 1, currentObject);
  } else {
    updateStatus(currentObject, "Comparing colors...", perc);
  }
}

function preSegmentation(currentObject) {
  updateStatus(currentObject, "Segmentation...", 0);
  addLog("Segmentation started.");

  imgDataMaskB = imgDataMask.slice();

  var perc = 0;
  var step = 1000;
  percAdd = Math.floor(100 / (pplCroppedCanvas.width / step));

  for (var start = 0; start <= pplCroppedCanvas.width; start += step) {
    if (start + step < pplCroppedCanvas.width) var end = start + step;
    else var end = pplCroppedCanvas.width;

    perc += percAdd;
    setTimeout(segmentation, 1, currentObject, start, end, perc);
  }
}

function segmentation(currentObject, x_start, x_end, perc) {
  for (var x = x_start; x < x_end; x += 1) {
    for (var y = 0; y < pplCroppedCanvas.height; y += 1) {
      pixelPos = y * pplCroppedCanvas.width + x;
      if (imgDataMask[pixelPos]) {
        segmentAreaPixels = [];
        segmentPerimeterPixels = [];

        var pixelStack = [[x, y]];

        while (pixelStack.length) {
          var newPos, xx, yy, pixelPos, reachLeft, reachRight;
          newPos = pixelStack.pop();
          xx = newPos[0];
          yy = newPos[1];

          pixelPos = yy * pplCroppedCanvas.width + xx;
          while (yy-- >= 0 && imgDataMask[pixelPos]) {
            pixelPos -= pplCroppedCanvas.width;
          }
          pixelPos += pplCroppedCanvas.width;

          ++yy;
          reachLeft = false;
          reachRight = false;
          while (yy++ < pplCroppedCanvas.height - 1 && imgDataMask[pixelPos]) {
            addPixel(pixelPos, xx, yy);

            if (xx > 0) {
              if (imgDataMask[pixelPos - 1]) {
                if (!reachLeft) {
                  pixelStack.push([xx - 1, yy]);
                  reachLeft = true;
                }
              } else if (reachLeft) {
                reachLeft = false;
              }
            }

            if (xx < pplCroppedCanvas.width - 1) {
              if (imgDataMask[pixelPos + 1]) {
                if (!reachRight) {
                  pixelStack.push([xx + 1, yy]);
                  reachRight = true;
                }
              } else if (reachRight) {
                reachRight = false;
              }
            }
            pixelPos += pplCroppedCanvas.width;
          }
        }

        segments[currentObject].push({
          areaPixels: segmentAreaPixels,
          perimeterPixels: segmentPerimeterPixels,
        });
      }
    }

    if (x == pplCroppedCanvas.width - 1) {
      updateStatus(currentObject, "Segmentation...", perc);
      setTimeout(preFiltering, 1, currentObject);
    } else {
      updateStatus(currentObject, "Segmentation...", perc);
    }
  }
}

function preFiltering(currentObject) {
  updateStatus(currentObject, "Filtering...", 0);
  addLog("Filtering started.");

  var perc = 0;
  var step = 500;
  percAdd = Math.floor(100 / (segments[currentObject].length / step));

  for (var start = 0; start <= segments[currentObject].length; start += step) {
    if (start + step < segments[currentObject].length) var end = start + step;
    else var end = segments[currentObject].length;

    perc += percAdd;
    setTimeout(filtering, 1, currentObject, start, end, perc);
  }
}

function filtering(currentObject, start, end, perc) {
  for (var segmentIndex = start; segmentIndex < end; segmentIndex += 1) {
    var segment = segments[currentObject][segmentIndex];
    var area = segment.areaPixels.length;

    if (area >= object.min_area && area <= object.max_area) {
      var compactness =
        (4 * Math.PI * area) / Math.pow(segment.perimeterPixels.length, 2);

      if (
        compactness >= object.min_compactness &&
        compactness <= object.max_compactness
      ) {
        var convexHull = getConvexHull(segment.perimeterPixels);

        if (convexHull == false) {
          var convexity = 999;
        } else {
          var segmentConvexPerimeter = 0;

          for (var i = 0; i < convexHull.length - 1; i++) {
            segmentConvexPerimeter += getDistance(
              convexHull[i],
              convexHull[i + 1]
            );
          }

          segmentConvexPerimeter += getDistance(
            convexHull[0],
            convexHull[convexHull.length - 1]
          );

          var convexity =
            segmentConvexPerimeter / segment.perimeterPixels.length;
        }

        if (
          convexity >= object.min_convexity &&
          convexity <= object.max_convexity
        ) {
          var majorAxis = {};
          majorAxis.length = 0;
          convexHull.sort(sortfirst);
          for (var i = 0; i < convexHull.length; i += 1) {
            var posXY1 = convexHull[i];
            for (var i2 = i; i2 < convexHull.length; i2 += 1) {
              var posXY2 = convexHull[i2];
              if (i !== i2) {
                var length = getDistance(posXY1, posXY2);
                if (length > majorAxis.length) {
                  majorAxis.length = length;
                  majorAxis.x1 = posXY1[0];
                  majorAxis.x2 = posXY2[0];
                  majorAxis.y1 = posXY1[1];
                  majorAxis.y2 = posXY2[1];
                }
              }
            }
          }

          majorAxis.angle = Math.atan2(
            -(majorAxis.y2 - majorAxis.y1),
            majorAxis.x2 - majorAxis.x1
          );

          majorAxis.angle = Math.round((majorAxis.angle * 180) / Math.PI);

          var minorAxis = {};
          minorAxis.length = 0;
          var sum_x = 0;
          var sum_y = 0;
          for (var i = 0; i < segment.perimeterPixels.length; i += 1) {
            var posXY1 = segment.perimeterPixels[i];
            sum_x += segment.perimeterPixels[i][0];
            sum_y += segment.perimeterPixels[i][1];
            for (var i2 = i; i2 < segment.perimeterPixels.length; i2 += 1) {
              var posXY2 = segment.perimeterPixels[i2];
              if (i !== i2) {
                var length = getDistance(posXY1, posXY2);
                if (length > minorAxis.length) {
                  minorAxis.angle = Math.atan2(
                    -(posXY2[1] - posXY1[1]),
                    posXY2[0] - posXY1[0]
                  );
                  minorAxis.angle = Math.round(
                    (minorAxis.angle * 180) / Math.PI
                  );
                  if (
                    minorAxis.angle == majorAxis.angle + 90 ||
                    minorAxis.angle == majorAxis.angle - 90
                  ) {
                    minorAxis.length = length;
                    minorAxis.x1 = posXY1[0];
                    minorAxis.x2 = posXY2[0];
                    minorAxis.y1 = posXY1[1];
                    minorAxis.y2 = posXY2[1];
                  }
                }
              }
            }
          }
          var aspectRatio = minorAxis.length / majorAxis.length;

          var centroid = {};
          centroid.x = Math.round(sum_x / segment.perimeterPixels.length);
          centroid.y = Math.round(sum_y / segment.perimeterPixels.length);

          if (
            majorAxis.angle >= object.min_major_axis_angle &&
            majorAxis.angle <= object.max_major_axis_angle &&
            aspectRatio >= object.min_aspect_ratio &&
            aspectRatio <= object.max_aspect_ratio
          ) {
            filtered[currentObject].push({
              id: object.obj_name + "_" + filtered[currentObject].length,
              name: object.obj_name,
              areaPixels: segment.areaPixels,
              perimeterPixels: segment.perimeterPixels,
              centroid: {
                x: centroid.x + margin.left,
                y: centroid.y + margin.top,
              },
              stats: {
                area,
                compactness,
                convexity,
                aspectRatio,
                minorAxisAngle: minorAxis.angle,
                majorAxisAngle: majorAxis.angle,
              },
            });

            validPixels[currentObject] += area;
          }
        }
      }
    }
  }

  if (end == segments[currentObject].length) {
    updateStatus(currentObject, "Rendering...", 0);
    setTimeout(rendering, 1, currentObject);
  } else {
    updateStatus(currentObject, "Filtering...", perc);
  }
}

function rendering(currentObject) {
  addLog("Rendering started.");

  /* RENDER */
  if (comparisonPoints.length > 0) {
    var renderSegmentColorRgb = hexToRgb(object.render_segment_color);
    var comparisonObjectPoints = comparisonPoints.filter(
      (point) => point.name == object.obj_name
    );
  } else {
    var comparisonObjectPoints = [];
  }

  var renderColorRgb = hexToRgb(object.render_color);

  for (var p = 0; p < filtered[currentObject].length; p += 1) {
    var segment = filtered[currentObject][p];

    if (object.render_mode == "fill") {
      for (var i = 0; i < segment.areaPixels.length; i += 1) {
        var point = segment.areaPixels[i];

        var pos = point[1] * (pplCroppedCanvas.width * 4) + point[0] * 4;
        imgDataMaskAll[pos / 4] = true;

        imgDataPpl.data[pos] = renderColorRgb.r;
        imgDataPpl.data[pos + 1] = renderColorRgb.g;
        imgDataPpl.data[pos + 2] = renderColorRgb.b;
        imgDataXpl.data[pos] = renderColorRgb.r;
        imgDataXpl.data[pos + 1] = renderColorRgb.g;
        imgDataXpl.data[pos + 2] = renderColorRgb.b;

        if (
          comparisonObjectPoints.some(
            (e) => e.x == point[0] + margin.left && e.y == point[1] + margin.top
          )
        ) {
          for (var ii = 0; ii < segment.areaPixels.length; ii += 1) {
            var point = segment.areaPixels[ii];

            var pos = point[1] * (pplCroppedCanvas.width * 4) + point[0] * 4;

            imgDataPpl.data[pos] = renderSegmentColorRgb.r;
            imgDataPpl.data[pos + 1] = renderSegmentColorRgb.g;
            imgDataPpl.data[pos + 2] = renderSegmentColorRgb.b;
            imgDataXpl.data[pos] = renderSegmentColorRgb.r;
            imgDataXpl.data[pos + 1] = renderSegmentColorRgb.g;
            imgDataXpl.data[pos + 2] = renderSegmentColorRgb.b;
          }
          i = segment.areaPixels.length;

          comparisonValidPoints[currentObject].push([point[0], point[1]]);
        }

        if (
          trainingPoints.some(
            (e) => e.x == point[0] + margin.left && e.y == point[1] + margin.top
          )
        ) {
          filteredTrainingPoints[currentObject].push(segment);
        }
      }
    }

    if (object.render_mode == "only_border") {
      for (var i = 0; i < segment.perimeterPixels.length; i += 1) {
        var point = segment.perimeterPixels[i];

        var pos = point[1] * (pplCroppedCanvas.width * 4) + point[0] * 4;

        imgDataPpl.data[pos] = renderColorRgb.r;
        imgDataPpl.data[pos + 1] = renderColorRgb.g;
        imgDataPpl.data[pos + 2] = renderColorRgb.b;
        imgDataXpl.data[pos] = renderColorRgb.r;
        imgDataXpl.data[pos + 1] = renderColorRgb.g;
        imgDataXpl.data[pos + 2] = renderColorRgb.b;
      }
    }
  }

  if (filteredTrainingPoints[currentObject].length) {
    filtered[currentObject] = filteredTrainingPoints[currentObject];
  }

  addLog(
    "Object '" +
      object.obj_name +
      "' (" +
      currentObject +
      " of " +
      maxObjects +
      ") completed: valid pixels: " +
      ((validPixels[currentObject] * 100) / totalPixels).toFixed(2) +
      "% (" +
      validPixels[currentObject] +
      " of " +
      totalPixels +
      " px), valid segments: " +
      filtered[currentObject].length
  );

  /* STATS */
  if (filtered[currentObject].length > 0) {
    stats[currentObject] = {};

    statsProperties.forEach((statName) => {
      var values = filtered[currentObject].map((a) =>
        math.round(a.stats[statName], 2)
      );

      stats[currentObject][statName] = {
        min: math.round(math.min(values), 2),
        max: math.round(math.max(values), 2),
        mean: math.round(math.mean(values), 2),
        median: math.round(math.median(values), 2),
        mode: math.round(math.mode(values), 2),
      };
    });

    var logText =
      "Object '" +
      object.obj_name +
      "' stats (" +
      currentObject +
      " of " +
      maxObjects +
      "):";

    for (let statName in stats[currentObject]) {
      logText += "<br>>> " + statName + ": ";
      for (let property in stats[currentObject][statName]) {
        logText +=
          " " + property + ": " + stats[currentObject][statName][property];
      }
    }

    addLog(logText);
  }

  if (comparisonObjectPoints.length > 0) {
    addLog(
      "Object '" +
        object.obj_name +
        "' points comparison completed: valid points: " +
        comparisonValidPoints[currentObject].length +
        "/" +
        comparisonObjectPoints.length +
        "(" +
        (
          (comparisonValidPoints[currentObject].length * 100) /
          comparisonObjectPoints.length
        ).toFixed(2) +
        " %), valid points on valid segments: " +
        comparisonValidPoints[currentObject].length +
        "/" +
        filtered[currentObject].length +
        "(" +
        (
          (comparisonValidPoints[currentObject].length * 100) /
          filtered[currentObject].length
        ).toFixed(2) +
        " %)"
    );
  }

  if (filteredTrainingPoints[currentObject].length > 0) {
    for (let statName in stats[currentObject]) {
      var statNameS = statName
        .replace("aspectRatio", "aspect_ratio")
        .replace("majorAxisAngle", "major_axis_angle");
      document.querySelector("#min_" + statNameS).value =
        stats[currentObject][statName].min;
      document.querySelector("#max_" + statNameS).value =
        stats[currentObject][statName].max;
    }

    addLog("Object '" + object.obj_name + "' trained");
  }

  setTimeout(print, 1);
  firstRender = 1;

  if (currentObject < maxObjects) {
    if (onlySelected) {
      document.querySelector("#start_btn").disabled = false;
      updateStatus(1, "Completed.", 100);
    } else {
      setTimeout(function () {
        initialization(currentObject + 1);
      }, 1);
    }
  } else {
    trainingPoints = [];

    document.querySelector("#start_btn").disabled = false;
    updateStatus(1, "Completed.", 100);
  }
}

function print() {
  pplResultsCtx.putImageData(imgDataPpl, 0, 0);
  xplResultsCtx.putImageData(imgDataXpl, 0, 0);

  /* if (comparisonPoints.length)
		drawPoints(comparisonPoints, object.render_segment_color); */
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// https://github.com/antimatter15/rgb-lab
function rgb2lab(color) {
  let key = String(color.r) + String(color.g) + String(color.b);

  if (typeof labColors[key] == "undefined") {
    var r = color.r / 255,
      g = color.g / 255,
      b = color.b / 255,
      x,
      y,
      z;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    var ret = [116 * y - 16, 500 * (x - y), 200 * (y - z)];

    labColors[key] = ret;

    return ret;
  } else {
    return labColors[key];
  }
}

// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB) {
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / 1.0;
  var deltaCkcsc = deltaC / sc;
  var deltaHkhsh = deltaH / sh;
  var i =
    deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2hsv(r, g, b) {
  let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
  rabs = r / 255;
  gabs = g / 255;
  babs = b / 255;
  (v = Math.max(rabs, gabs, babs)), (diff = v - Math.min(rabs, gabs, babs));
  diffc = (c) => (v - c) / 6 / diff + 1 / 2;
  percentRoundFn = (num) => Math.round(num * 100) / 100;
  if (diff == 0) {
    h = s = 0;
  } else {
    s = diff / v;
    rr = diffc(rabs);
    gg = diffc(gabs);
    bb = diffc(babs);

    if (rabs === v) {
      h = bb - gg;
    } else if (gabs === v) {
      h = 1 / 3 + rr - bb;
    } else if (babs === v) {
      h = 2 / 3 + gg - rr;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return {
    h: Math.round(h * 360),
    s: percentRoundFn(s * 100),
    v: percentRoundFn(v * 100),
  };
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const l = Math.max(r, g, b);
  const s = l - Math.min(r, g, b);
  const h = s
    ? l === r
      ? (g - b) / s
      : l === g
      ? 2 + (b - r) / s
      : 4 + (r - g) / s
    : 0;
  return [
    60 * h < 0 ? 60 * h + 360 : 60 * h,
    100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
    (100 * (2 * l - s)) / 2,
  ];
}

function isClose(color1, color2, tollerance) {
  var distance =
    Math.abs(color1.r - color2.r) +
    Math.abs(color1.g - color2.g) +
    Math.abs(color1.b - color2.b);
  if (distance <= tollerance) return true;
  return false;
}

function addLog(text) {
  var date = new Date();
  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  var hours = date.getHours();
  var now = hours + ":" + minutes + ":" + seconds;
  text =
    '<div class="mb-3"><div class="small">' +
    now +
    "</div><div>" +
    text +
    "<div></div>";

  var logContainer = document.getElementById("log");
  logContainer.insertAdjacentHTML("beforeend", text);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function updateStatus(currentObject, status, perc) {
  if (perc > 100) perc = 100;

  var progressBar = document.getElementById("progress-bar");
  progressBar.style.width = perc + "%";

  var statusElement = document.getElementById("status");
  statusElement.innerHTML = status;

  var currentObjectElement = document.getElementById("obj_current");
  currentObjectElement.innerHTML = currentObject;
}

function addPixel(pixelPos, x, y) {
  imgDataMask[pixelPos] = false;

  segmentAreaPixels.push([x, y]);

  var pixelPosTop = pixelPos - pplCroppedCanvas.width;
  var pixelPosLeft = pixelPos - 1;
  var pixelPosRight = pixelPos + 1;
  var pixelPosBottom = pixelPos + pplCroppedCanvas.width;

  if (pixelPosTop >= 0) {
    if (imgDataMaskB[pixelPosTop] == false) {
      segmentPerimeterPixels.push([x, y]);
    }
  } else {
    segmentPerimeterPixels.push([x, y]);
  }

  if (pixelPosLeft >= y * pplCroppedCanvas.width) {
    if (imgDataMaskB[pixelPosLeft] == false) {
      segmentPerimeterPixels.push([x, y]);
    }
  } else {
    segmentPerimeterPixels.push([x, y]);
  }

  if (pixelPosBottom <= pplCroppedCanvas.width * pplCroppedCanvas.height) {
    if (imgDataMaskB[pixelPosBottom] == false) {
      segmentPerimeterPixels.push([x, y]);
    }
  } else {
    segmentPerimeterPixels.push([x, y]);
  }

  if (pixelPosRight < (y + 1) * pplCroppedCanvas.width) {
    if (imgDataMaskB[pixelPosRight] == false) {
      segmentPerimeterPixels.push([x, y]);
    }
  } else {
    segmentPerimeterPixels.push([x, y]);
  }
}

function orientation(p, q, r) {
  var value = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (value == 0) return 0;
  return value > 0 ? 1 : 2;
}

function sortfirst(a, b) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    return a[0] < b[0] ? -1 : 1;
  }
}

function getDistance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
  );
}

function cross(a, b, o) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function getConvexHull(points) {
  points.sort(function (a, b) {
    return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
  });

  var lower = [];
  for (var i = 0; i < points.length; i++) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0
    ) {
      lower.pop();
    }
    lower.push(points[i]);
  }

  var upper = [];
  for (var i = points.length - 1; i >= 0; i--) {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0
    ) {
      upper.pop();
    }
    upper.push(points[i]);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function openPicker(mode, el) {
  if (ppl && xpl) {
    pickerColorN = el.closest(".color").getAttribute("data-number");

    if (mode == 1) {
      pickerCanvas.width = pplPreviewCanvas.width;
      pickerCanvas.height = pplPreviewCanvas.height;
      pickerCanvasCtx.drawImage(ppl, 0, 0);
    }
    if (mode == 2) {
      pickerCanvas.width = xplPreviewCanvas.width;
      pickerCanvas.height = xplPreviewCanvas.height;
      pickerCanvasCtx.drawImage(xpl, 0, 0);
    }

    document.querySelector("#main-view").style.display = "none";
    document.querySelector("#picker-view").style.display = "block";
  } else {
    Swal.fire({
      text: "You must upload both images before.",
      icon: "warning",
      timer: 3000,
      showConfirmButton: false,
    });
  }
}

function setColorFromMouse(event) {
  let x = event.clientX + Math.round(window.pageXOffset);
  let y = event.clientY + Math.round(window.pageYOffset);

  imgDataPpl = pplPreviewCtx.getImageData(
    0,
    0,
    pplPreviewCanvas.width,
    pplPreviewCanvas.height
  );
  imgDataXpl = xplPreviewCtx.getImageData(
    0,
    0,
    pplPreviewCanvas.width,
    pplPreviewCanvas.height
  );

  document.querySelector("#ppl_color_target_" + pickerColorN).value =
    getColorFromPosition(imgDataPpl, x, y);
  document.querySelector("#xpl_color_target_" + pickerColorN).value =
    getColorFromPosition(imgDataXpl, x, y);

  document.querySelector("#main-view").style.display = "block";
  document.querySelector("#picker-view").style.display = "none";
}

function getColorFromPosition(imgData, x, y) {
  var pixelPos = (y * pplPreviewCanvas.width + x) * 4;

  var color = {
    r: imgData.data[pixelPos],
    g: imgData.data[pixelPos + 1],
    b: imgData.data[pixelPos + 2],
  };

  return rgbToHex(color.r, color.g, color.b);
}

function changeCanvas(m) {
  if (m == "ppl") {
    document.querySelector("#canvas2_div").style.display = "none";
    document.querySelector("#canvas1_div").style.display = "block";
  }
  if (m == "xpl") {
    document.querySelector("#canvas1_div").style.display = "none";
    document.querySelector("#canvas2_div").style.display = "block";
  }
}

function geojsonDownload() {
  const download = document.getElementById("geojson_download");
  var features = [];

  filtered.forEach(function (segments) {
    segments.forEach(function (obj) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [obj.centroid.x, -obj.centroid.y],
        },
        properties: {
          id: obj.id,
          name: obj.name,
        },
      });
    });
  });

  const geojson = {
    type: "FeatureCollection",
    features,
  };

  const encodedUri =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(geojson));
  download.setAttribute("download", "points_" + Date.now() + ".json");
  download.setAttribute("href", encodedUri);
}

function pplDownload() {
  var download = document.getElementById("ppl_download");
  var image = document
    .getElementById("ppl_results_canvas")
    .toDataURL("image/png");
  download.setAttribute("href", image);
}

function xplDownload() {
  var download = document.getElementById("xpl_download");
  var image = document
    .getElementById("xpl_results_canvas")
    .toDataURL("image/png");
  download.setAttribute("href", image);
}

function csvDownload() {
  const download = document.getElementById("csv_download");

  var csvContent = [
    '"id","object","x","y","' + statsProperties.join('","') + '"',
  ];

  filtered.forEach(function (segments) {
    segments.forEach(function (obj) {
      var dataString =
        '"' +
        obj.id +
        '","' +
        obj.name +
        '","' +
        obj.centroid.x +
        '","' +
        obj.centroid.y +
        '","' +
        obj.stats.area +
        '","' +
        obj.stats.compactness +
        '","' +
        obj.stats.convexity +
        '","' +
        obj.stats.aspectRatio +
        '","' +
        obj.stats.majorAxisAngle +
        '"';

      csvContent.push(dataString);
    });
  });

  const encodedUri =
    "data:text/csv;charset=utf-8," + encodeURI(csvContent.join("\n"));
  download.setAttribute("download", "objects_" + Date.now() + ".csv");
  download.setAttribute("href", encodedUri);
}

function addColorBtn() {
  var max_colors = parseInt(
    document.querySelector('[name="max_colors"]').value
  );
  max_colors += 1;
  document.querySelector('[name="max_colors"]').value = max_colors;
  addColor(max_colors);
}

function addColor(
  n,
  props = {
    ppl_color_target: "#FFFFFF",
    ppl_tollerance: 15,
    xpl_color_target: "",
    xpl_tollerance: 15,
  }
) {
  let colorsContainer = document.querySelector(".colors");
  let firstColorEl = colorsContainer.querySelectorAll(".color")[0];
  let newColorEl = firstColorEl.cloneNode(true);

  newColorEl.setAttribute("data-number", n);
  newColorEl.querySelector(".number").innerHTML = "COLOR " + n;

  newColorEl.querySelector("#ppl_color_target_1").value =
    props.ppl_color_target;
  newColorEl.querySelector("#ppl_color_target_1").id = "ppl_color_target_" + n;

  newColorEl.querySelector("#ppl_tollerance_1").value = props.ppl_tollerance;
  newColorEl.querySelector("#ppl_tollerance_1").id = "ppl_tollerance_" + n;

  newColorEl.querySelector("#xpl_color_target_1").value =
    props.xpl_color_target;
  newColorEl.querySelector("#xpl_color_target_1").id = "xpl_color_target_" + n;

  newColorEl.querySelector("#xpl_tollerance_1").value = props.xpl_tollerance;
  newColorEl.querySelector("#xpl_tollerance_1").id = "xpl_tollerance_" + n;

  colorsContainer.appendChild(newColorEl);
}

function removeColorBtn() {
  var max_colors = parseInt(
    document.querySelector('[name="max_colors"]').value
  );
  if (max_colors > 1) {
    max_colors -= 1;
    document.querySelector('[name="max_colors"]').value = max_colors;
    removeColor();
  }
}

function removeColor() {
  var colorsContainer = document.querySelector(".colors");
  var lastColorEl = colorsContainer.querySelector(".color:last-child");
  if (lastColorEl) {
    colorsContainer.removeChild(lastColorEl);
  }
}

function getObject(id) {
  return objects[id - 1];
}

function setObjectFromInputs() {
  var data = {};

  var inputElements = document.querySelectorAll(
    "#left-panel input, #left-panel select"
  );
  inputElements.forEach(function (element) {
    if (element.type !== "file") {
      var val = !isNaN(element.value)
        ? parseFloat(element.value)
        : element.value;
      data[element.id] = val;
    }
  });

  setObject(selectedObject, data);
}

function setObject(id, data) {
  objects[id - 1] = data;
}

function setInputsFromObject(id) {
  var obj = getObject(id);

  var colorInputs = document.querySelectorAll(".color");
  for (var i = 1; i < colorInputs.length; i++) {
    colorInputs[i].remove();
  }

  for (var i = 1; i <= obj.max_colors; i++) {
    if (i > 1) {
      addColor(i);
    }
  }

  for (const inputName in obj) {
    var inputElement = document.getElementById(inputName);
    if (inputElement) {
      inputElement.value = obj[inputName];
    }
  }
}

function deleteObject(id) {
  objects.splice(id - 1, 1);
}

function loadObj(event) {
  var file = event.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();

  reader.readAsText(file);

  reader.onload = function (e) {
    objects = JSON.parse(e.target.result);

    selectedObject = 1;
    maxObjects = objects.length;

    setInputsFromObject(selectedObject);

    if (maxObjects > 1) {
      document.getElementById("next_obj").style.opacity = "1";
      document.getElementById("remove_obj").style.opacity = "1";
    }

    document.getElementById("prev_obj").style.opacity = "0.5";

    document.getElementById("obj_max").innerHTML = maxObjects;
    document.getElementById("obj_max_2").innerHTML = maxObjects;
    document.getElementById("obj_selected").innerHTML = selectedObject;
  };
}

function saveObj() {
  setObjectFromInputs(selectedObject);
  var download = document.getElementById("obj_download");
  var data =
    "data:application/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(objects));
  download.setAttribute("download", "objects_" + Date.now() + ".json");
  download.setAttribute("href", data);
}

function importSegments(event) {
  var file = event.target.files[0];
  var columnName = "descr",
    defaultTollerance = { ppl: 15, xpl: 15 };

  if (!file) {
    return;
  }

  Swal.fire({
    title: "Insert object column name",
    input: "text",
    inputValue: columnName,
    showCancelButton: true,
    confirmButtonText: "Next",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-primary me-3",
      cancelButton: "btn btn-secondary",
    },
  }).then((result) => {
    let columnName = result.value;
    Swal.fire({
      title: "Insert default image 1 & 2 tollerance",
      input: "text",
      inputValue: defaultTollerance.ppl + "," + defaultTollerance.xpl,
      showCancelButton: true,
      confirmButtonText: "Next",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "btn btn-primary me-3",
        cancelButton: "btn btn-secondary",
      },
    }).then((defaultTollerances) => {
      defaultTollerances = defaultTollerances.split(",");
      defaultTollerance = {
        ppl: defaultTollerances[0],
        xpl: defaultTollerances[1],
      };

      var reader = new FileReader();

      reader.readAsText(file);
      reader.onload = function (e) {
        var points = [];

        var json = JSON.parse(e.target.result);

        json.features.forEach(function (feature) {
          var x = Math.abs(Math.round(feature.geometry.coordinates[0]));
          var y = Math.abs(Math.round(feature.geometry.coordinates[1]));

          points.push({
            name: feature.properties[columnName],
            x: x,
            y: y,
          });
        });

        Swal.fire({
          title: "Are you sure?",
          text: "Do you really want to import object names and colors? The current objects will be overwritten.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          buttonsStyling: false,
          customClass: {
            confirmButton: "btn btn-primary me-3",
            cancelButton: "btn btn-secondary",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            trainingPoints = points;

            var newObjects = {};

            imgDataPpl = pplPreviewCtx.getImageData(
              0,
              0,
              pplPreviewCanvas.width,
              pplPreviewCanvas.height
            );
            imgDataXpl = xplPreviewCtx.getImageData(
              0,
              0,
              pplPreviewCanvas.width,
              pplPreviewCanvas.height
            );

            points.forEach(function (object) {
              object.x += margin.left;
              object.y += margin.top;

              var objectColor = {
                ppl: getColorFromPosition(imgDataPpl, object.x, object.y),
                xpl: getColorFromPosition(imgDataXpl, object.x, object.y),
              };

              if (typeof newObjects[object.name] == "undefined") {
                newObjects[object.name] = {
                  obj_name: object.name,
                  ppl_color_target_1: objectColor.ppl,
                  ppl_tollerance_1: defaultTollerance.ppl,
                  xpl_color_target_1: objectColor.xpl,
                  xpl_tollerance_1: defaultTollerance.xpl,
                  max_colors: 1,
                  render_color:
                    "#" + Math.floor(Math.random() * 16777215).toString(16),
                };
              } else {
                var close = false;
                var objectColorLab = {
                  ppl: rgb2lab(hexToRgb(objectColor.ppl)),
                  xpl: rgb2lab(hexToRgb(objectColor.xpl)),
                };

                for (
                  var i = 0;
                  i < newObjects[object.name].max_colors;
                  i += 1
                ) {
                  var otherColor = {
                    ppl: rgb2lab(
                      hexToRgb(
                        newObjects[object.name]["ppl_color_target_" + (i + 1)]
                      )
                    ),
                    xpl: rgb2lab(
                      hexToRgb(
                        newObjects[object.name]["xpl_color_target_" + (i + 1)]
                      )
                    ),
                  };
                  var deltaPpl = deltaE(otherColor.ppl, objectColorLab.ppl);
                  var deltaXpl = deltaE(otherColor.xpl, objectColorLab.xpl);

                  if (
                    defaultTollerance.ppl >= deltaPpl &&
                    defaultTollerance.xpl >= deltaXpl
                  )
                    close = true;
                }

                if (!close) {
                  var colorIndex = newObjects[object.name].max_colors + 1;
                  newObjects[object.name].max_colors = colorIndex;
                  newObjects[object.name]["ppl_color_target_" + colorIndex] =
                    objectColor.ppl;
                  newObjects[object.name]["xpl_color_target_" + colorIndex] =
                    objectColor.xpl;
                  newObjects[object.name]["ppl_tollerance_" + colorIndex] =
                    defaultTollerance.ppl;
                  newObjects[object.name]["xpl_tollerance_" + colorIndex] =
                    defaultTollerance.xpl;
                }
              }
            });

            objects = [];
            for (let i in newObjects) {
              objects.push(newObjects[i]);
            }

            selectedObject = 1;
            maxObjects = objects.length;

            setInputsFromObject(selectedObject);

            document.getElementById("obj_max").innerHTML = maxObjects;
            document.getElementById("obj_max_2").innerHTML = maxObjects;
            document.getElementById("obj_selected").innerHTML = selectedObject;

            if (maxObjects > 1) {
              document.getElementById("next_obj").style.opacity = "1";
              document.getElementById("remove_obj").style.opacity = "1";
            }

            Swal.fire({
              text: maxObjects + " objects imported",
              icon: "success",
              timer: 3000,
              showConfirmButton: false,
            });
          }
        });
      };
    });
  });
}

function importPoints(event) {
  var file = event.target.files[0];
  var columnName = "descr";

  if (!file) {
    return;
  }

  Swal.fire({
    title: "Insert object column name",
    input: "text",
    inputValue: columnName,
    showCancelButton: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-primary me-3",
      cancelButton: "btn btn-secondary",
    },
  }).then((columnName) => {
    if (columnName) {
      var reader = new FileReader();

      reader.readAsText(file);
      reader.onload = function (e) {
        var points = [];

        var json = JSON.parse(e.target.result);

        json.features.forEach(function (feature) {
          var x = Math.abs(Math.round(feature.geometry.coordinates[0]));
          var y = Math.abs(Math.round(feature.geometry.coordinates[1]));

          if (customWidth) {
            x = Math.round(x * (customWidth / originalSize.width));
            y = Math.round(y * (customWidth / originalSize.width));
          }

          points.push({
            name: feature.properties[columnName],
            x,
            y,
          });
        });

        comparisonPoints = points;

        drawPoints(comparisonPoints);

        Swal.fire({
          text: comparisonPoints.length + " points imported",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
        });

        if (comparisonPoints.length)
          document.getElementById(
            "render_segment_color_container"
          ).renderSegmentColorContainer.style.display = "block";
      };
    }
  });
}

/* BUTTONS */
function prevObjBtn() {
  if (selectedObject > 1) {
    setObjectFromInputs(selectedObject);
    selectedObject -= 1;
    setInputsFromObject(selectedObject);

    document.getElementById("obj_selected").innerHTML = selectedObject;
  }

  if (selectedObject == maxObjects) {
    document.getElementById("next_obj").style.opacity = "0.5";
  } else {
    document.getElementById("next_obj").style.opacity = "1";
  }

  if (selectedObject > 1) {
    document.getElementById("prev_obj").style.opacity = "1";
  } else {
    document.getElementById("prev_obj").style.opacity = "0.5";
  }
}

function nextObjBtn() {
  if (selectedObject < maxObjects) {
    setObjectFromInputs(selectedObject);
    selectedObject += 1;
    setInputsFromObject(selectedObject);

    document.getElementById("obj_selected").innerHTML = selectedObject;
  }

  if (selectedObject == maxObjects) {
    document.getElementById("next_obj").style.opacity = "0.5";
  } else {
    document.getElementById("next_obj").style.opacity = "1";
  }

  if (selectedObject > 1) {
    document.getElementById("prev_obj").style.opacity = "1";
  } else {
    document.getElementById("prev_obj").style.opacity = "0.5";
  }
}

function addObjBtn() {
  maxObjects += 1;

  const data = {
    ppl_color_target: [],
    xpl_color_target: [],
    ppl_tollerance: [],
    xpl_tollerance: [],
    ppl_color_target_1: "#ffffff",
    xpl_color_target_1: "#000000",
    ppl_tollerance_1: "15",
    xpl_tollerance_1: "15",
    max_colors: 1,
    min_area: 10,
    max_area: 100000,
    min_compactness: 0,
    max_compactness: 1,
    min_convexity: 0,
    max_convexity: 1,
    min_aspectRatio: 0,
    max_aspect_ratio: 1,
    min_major_axis_angle: -90,
    max_major_axis_angle: 90,
    obj_name: "Nameless " + maxObjects,
    render_color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  setObject(maxObjects, data);

  document.getElementById("next_obj").style.opacity = "1";
  document.getElementById("remove_obj").style.opacity = "1";
  document.getElementById("obj_max").innerHTML = maxObjects;
  document.getElementById("obj_max_2").innerHTML = maxObjects;
}

function deleteObjBtn() {
  if (maxObjects > 1) {
    deleteObject(selectedObject);

    if (selectedObject == maxObjects) {
      selectedObject -= 1;
    }

    maxObjects -= 1;

    setInputsFromObject(selectedObject);

    if (maxObjects == 1) {
      document.getElementById("prev_obj").style.opacity = "0.5";
      document.getElementById("remove_obj").style.opacity = "0.5";
    }

    if (selectedObject == maxObjects) {
      document.getElementById("next_obj").style.opacity = "0.5";
    }

    document.getElementById("obj_selected").innerHTML = selectedObject;
    document.getElementById("obj_max").innerHTML = maxObjects;
    document.getElementById("obj_max_2").innerHTML = maxObjects;
  }
}

function drawPoints(points, color = "red") {
  points.forEach(function (point) {
    pplResultsCtx.beginPath();
    pplResultsCtx.arc(
      point.x - margin.left,
      point.y - margin.top,
      5,
      0,
      2 * Math.PI,
      true
    );
    pplResultsCtx.fillStyle = color;
    pplResultsCtx.fill();
    pplResultsCtx.stroke();

    xplResultsCtx.beginPath();
    xplResultsCtx.arc(
      point.x - margin.left,
      point.y - margin.top,
      5,
      0,
      2 * Math.PI,
      true
    );
    xplResultsCtx.fillStyle = color;
    xplResultsCtx.fill();
    xplResultsCtx.stroke();
  });
}
