/**
 * Thin Analyser (https://github.com/GianlucaChiarani/ThinAnalyser)
 * @version 1.4.0
 * @author Gianluca Chiarani
 * @license GNU General Public License (GPL)
 */

"use strict";
class ThinAnalyser {
  constructor() {
    this.pplPreviewCanvas = document.getElementById("ppl_preview_canvas");
    this.xplPreviewCanvas = document.getElementById("xpl_preview_canvas");
    this.pplCroppedCanvas = document.getElementById("ppl_cropped_canvas");
    this.xplCroppedCanvas = document.getElementById("xpl_cropped_canvas");
    this.pplResultsCanvas = document.getElementById("ppl_results_canvas");
    this.xplResultsCanvas = document.getElementById("xpl_results_canvas");
    this.pickerCanvas = document.getElementById("picker-canvas");

    this.pplPreviewCtx = this.pplPreviewCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.xplPreviewCtx = this.xplPreviewCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.pplCroppedCtx = this.pplCroppedCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.xplCroppedCtx = this.xplCroppedCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.pplResultsCtx = this.pplResultsCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.xplResultsCtx = this.xplResultsCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.pickerCanvasCtx = this.pickerCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    this.ppl = null;
    this.xpl = null;
    this.pplUploaded = false;

    this.percAdd = null;

    this.totalPixels = null;
    this.segmentPerimeterPixels = null;
    this.segmentAreaPixels = null;

    this.segments = [];
    this.validPixels = [];
    this.filtered = [];
    this.stats = [];
    this.statsProperties = [
      "area",
      "compactness",
      "convexity",
      "aspectRatio",
      "majorAxisAngle",
    ];
    this.labColors = {};

    this.pplColorTargetLab = null;
    this.xplColorTargetLab = null;

    this.imgData = { ppl: null, xpl: null };
    this.imgDataMask = null;
    this.imgDataMaskB = null;
    this.imgDataMaskAll = null;
    this.status = null;

    this.margin = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      offsetX: 0,
      offsetY: 0,
    };

    this.object = {};
    this.objects = [];
    this.maxObjects = 1;
    this.selectedObject = 1;

    this.cropper = false;
    this.pickerColorN = 1;

    this.firstRender = 0;

    this.onlySelected = false;
    this.onlyFiltering = false;
    this.customWidth = false;
    this.originalSize = {
      width: 0,
      height: 0,
    };

    this.comparisonPoints = [];
    this.comparisonValidPoints = [];
    this.trainingPoints = [];
    this.filteredTrainingPoints = [];

    document
      .getElementById("ppl_loader")
      .addEventListener("change", this.pplHandleImage.bind(this));
    document
      .getElementById("xpl_loader")
      .addEventListener("change", this.xplHandleImage.bind(this));
    document
      .getElementById("obj_loader")
      .addEventListener("change", this.loadObj.bind(this));
    document
      .getElementById("segments_loader")
      .addEventListener("change", this.importSegments.bind(this));
    document
      .getElementById("points_loader")
      .addEventListener("change", this.importPoints.bind(this));
    document.getElementById("start_btn").onclick = this.start.bind(this);
  }

  pplHandleImage(e) {
    this.ppl = new Image();

    this.ppl.onload = () => {
      this.pplPreviewCanvas.width = this.ppl.width;
      this.pplPreviewCanvas.height = this.ppl.height;
      this.pplCroppedCanvas.width = this.ppl.width;
      this.pplCroppedCanvas.height = this.ppl.height;
      this.pplResultsCanvas.width = this.ppl.width;
      this.pplResultsCanvas.height = this.ppl.height;

      this.pplPreviewCtx.drawImage(this.ppl, 0, 0);
      this.pplCroppedCtx.drawImage(this.ppl, 0, 0);
      this.pplResultsCtx.drawImage(this.ppl, 0, 0);

      this.margin = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        offsetX: 0,
        offsetY: 0,
      };
      this.pplUploaded = true;

      document.getElementById("loading").style.display = "none";
      document.getElementById("ppl_preview").style.display = "block";
      document.getElementById("ppl_upload_icon").style.display = "none";
    };

    this.ppl.onerror = () => {
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
      this.ppl.src = URL.createObjectURL(e.target.files[0]);
    }
  }

  xplHandleImage(e) {
    this.xpl = new Image();

    this.xpl.onload = () => {
      if (this.pplUploaded) {
        if (
          this.xpl.width == this.ppl.width &&
          this.xpl.height == this.ppl.height
        ) {
          this.xplPreviewCanvas.width = this.xpl.width;
          this.xplPreviewCanvas.height = this.xpl.height;
          this.xplCroppedCanvas.width = this.xpl.width;
          this.xplCroppedCanvas.height = this.xpl.height;
          this.xplResultsCanvas.width = this.xpl.width;
          this.xplResultsCanvas.height = this.xpl.height;

          this.xplPreviewCtx.drawImage(this.xpl, 0, 0);
          this.xplCroppedCtx.drawImage(this.xpl, 0, 0);
          this.xplResultsCtx.drawImage(this.xpl, 0, 0);

          this.margin = {
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
    this.xpl.onerror = () => {
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
      this.xpl.src = URL.createObjectURL(e.target.files[0]);
    }
  }

  crop() {
    Swal.fire({
      title: "enter top, right, bottom, left margin (in px)",
      input: "text",
      inputValue:
        this.margin.top +
        "," +
        this.margin.right +
        "," +
        this.margin.bottom +
        "," +
        this.margin.left,
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
        this.margin.top = margins[0];
        this.margin.right = margins[1];
        this.margin.bottom = margins[2];
        this.margin.left = margins[3];

        Swal.fire({
          title: "enter horizontal & vertical image 2 offset (in px)",
          input: "text",
          inputValue: this.margin.offsetX + "," + this.margin.offsetY,
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
            this.margin.offsetX = offsets[0];
            this.margin.offsetY = offsets[1];

            for (let k in this.margin) {
              this.margin[k] = parseInt(this.margin[k]);
            }

            let width =
              this.pplPreviewCanvas.width -
              this.margin.right -
              this.margin.left;
            let height =
              this.pplPreviewCanvas.height -
              this.margin.bottom -
              this.margin.top;

            this.pplResultsCtx.clearRect(
              0,
              0,
              this.pplResultsCanvas.width,
              this.pplResultsCanvas.height
            );
            this.xplResultsCtx.clearRect(
              0,
              0,
              this.xplResultsCanvas.width,
              this.xplResultsCanvas.height
            );

            this.pplCroppedCtx.clearRect(
              0,
              0,
              this.pplResultsCanvas.width,
              this.pplResultsCanvas.height
            );
            this.xplCroppedCtx.clearRect(
              0,
              0,
              this.xplResultsCanvas.width,
              this.xplResultsCanvas.height
            );

            this.pplResultsCanvas.width = width;
            this.pplResultsCanvas.height = height;

            this.xplResultsCanvas.width = width;
            this.xplResultsCanvas.height = height;

            this.pplCroppedCanvas.width = width;
            this.pplCroppedCanvas.height = height;

            this.xplCroppedCanvas.width = width;
            this.xplCroppedCanvas.height = height;

            this.pplCroppedCtx.drawImage(
              this.ppl,
              this.margin.left,
              this.margin.top,
              width,
              height,
              0,
              0,
              width,
              height
            );
            this.xplCroppedCtx.drawImage(
              this.xpl,
              this.margin.left + this.margin.offsetX,
              this.margin.top + this.margin.offsetY,
              width,
              height,
              0,
              0,
              width,
              height
            );

            this.pplResultsCtx.drawImage(
              this.ppl,
              this.margin.left,
              this.margin.top,
              width,
              height,
              0,
              0,
              width,
              height
            );
            this.xplResultsCtx.drawImage(
              this.xpl,
              this.margin.left + this.margin.offsetX,
              this.margin.top + this.margin.offsetY,
              width,
              height,
              0,
              0,
              width,
              height
            );
          }
        });
      }
    });
  }

  start() {
    document.getElementById("start_btn").disabled = true;
    document.getElementById("bottom-panel").style.display = "block";
    this.setObjectFromInputs(this.selectedObject);

    this.imgData.ppl = this.pplCroppedCtx.getImageData(
      0,
      0,
      this.pplCroppedCanvas.width,
      this.pplCroppedCanvas.height
    );
    this.imgData.xpl = this.xplCroppedCtx.getImageData(
      0,
      0,
      this.xplCroppedCanvas.width,
      this.xplCroppedCanvas.height
    );
    this.totalPixels =
      this.pplCroppedCanvas.width * this.pplCroppedCanvas.height;

    this.imgDataMaskAll = [];

    const startObject = this.onlySelected ? this.selectedObject : 1;

    if (this.onlyFiltering) {
      this.object = this.getObject(startObject);

      this.validPixels[startObject] = 0;
      this.filtered[startObject] = [];
      this.comparisonValidPoints[startObject] = [];
      this.filteredTrainingPoints[startObject] = [];

      setTimeout(this.preFiltering.bind(this), 1, startObject);
      return;
    }

    setTimeout(this.initialization.bind(this), 1, startObject);
  }

  initialization(currentObject) {
    this.object = this.getObject(currentObject);

    this.validPixels[currentObject] = 0;
    this.segments[currentObject] = [];
    this.filtered[currentObject] = [];
    this.comparisonValidPoints[currentObject] = [];
    this.filteredTrainingPoints[currentObject] = [];

    this.imgDataMask = [];
    this.imgDataMaskB = [];

    this.updateStatus(currentObject, "Comparing colors...", 0);

    this.addLog(
      "Initializing '" +
        this.object.obj_name +
        "' (" +
        currentObject +
        " of " +
        this.maxObjects +
        "): min area: " +
        this.object.min_area +
        ", max area: " +
        this.object.max_area +
        ", min compactness: " +
        this.object.min_compactness +
        ", max compactness: " +
        this.object.max_compactness +
        ", min convexity: " +
        this.object.min_convexity +
        ", max convexity: " +
        this.object.max_convexity +
        ", min aspect ratio=" +
        this.object.min_aspect_ratio +
        ", max aspect ratio=" +
        this.object.max_aspect_ratio +
        ", min major axis angle: " +
        this.object.min_major_axis_angle +
        ", max major axis angle: " +
        this.object.max_major_axis_angle
    );
    this.addLog("Colors comparison started.");

    this.pplColorTargetLab = [];
    this.xplColorTargetLab = [];
    for (let i = 0; i < this.object.max_colors; i += 1) {
      this.pplColorTargetLab[i] = this.rgb2lab(
        this.hexToRgb(this.object["ppl_color_target_" + (i + 1)])
      );
      this.xplColorTargetLab[i] = this.rgb2lab(
        this.hexToRgb(this.object["xpl_color_target_" + (i + 1)])
      );
    }

    let perc = 0;
    let step = 25000000;
    this.percAdd = Math.floor(100 / (this.imgData.ppl.data.length / step));

    for (let start = 0; start < this.imgData.ppl.data.length; start += step) {
      let end;
      if (start + step < this.imgData.ppl.data.length) end = start + step;
      else end = this.imgData.ppl.data.length;

      perc += this.percAdd;

      if (perc > 100) perc = 100;

      setTimeout(
        this.comparison.bind(this),
        1,
        currentObject,
        start,
        end,
        perc
      );
    }
  }

  comparison(currentObject, start, end, perc) {
    let close, color1, color2;

    for (let i = start; i < end; i += 4) {
      if (typeof this.imgDataMaskAll[i / 4] == "undefined") {
        color1 = {
          r: this.imgData.ppl.data[i],
          g: this.imgData.ppl.data[i + 1],
          b: this.imgData.ppl.data[i + 2],
        };

        color2 = {
          r: this.imgData.xpl.data[i],
          g: this.imgData.xpl.data[i + 1],
          b: this.imgData.xpl.data[i + 2],
        };

        color1 = this.rgb2lab(color1);
        color2 = this.rgb2lab(color2);

        close = false;
        for (let i2 = 0; i2 < this.object.max_colors; i2 += 1) {
          let delta1 = this.deltaE(this.pplColorTargetLab[i2], color1);
          let delta2 = this.deltaE(this.xplColorTargetLab[i2], color2);

          const pplTollerance = this.object["ppl_tollerance_" + (i2 + 1)];
          const xplTollerance = this.object["xpl_tollerance_" + (i2 + 1)];

          if (pplTollerance >= delta1 && xplTollerance >= delta2) close = true;
        }
      } else {
        close = false;
      }

      if (close) {
        this.imgDataMask[i / 4] = true;
      } else {
        this.imgDataMask[i / 4] = false;
      }
    }

    if (end == this.imgData.ppl.data.length) {
      setTimeout(this.preSegmentation.bind(this), 1, currentObject);
    } else {
      this.updateStatus(currentObject, "Comparing colors...", perc);
    }
  }

  preSegmentation(currentObject) {
    this.updateStatus(currentObject, "Segmentation...", 0);
    this.addLog("Segmentation started.");

    this.imgDataMaskB = this.imgDataMask.slice();

    let perc = 0;
    let step = 1000;
    this.percAdd = Math.floor(100 / (this.pplCroppedCanvas.width / step));

    for (let start = 0; start <= this.pplCroppedCanvas.width; start += step) {
      let end;
      if (start + step < this.pplCroppedCanvas.width) end = start + step;
      else end = this.pplCroppedCanvas.width;

      perc += this.percAdd;
      setTimeout(
        this.segmentation.bind(this),
        1,
        currentObject,
        start,
        end,
        perc
      );
    }
  }

  segmentation(currentObject, x_start, x_end, perc) {
    for (let x = x_start; x < x_end; x += 1) {
      for (let y = 0; y < this.pplCroppedCanvas.height; y += 1) {
        let pixelPos = y * this.pplCroppedCanvas.width + x;
        if (this.imgDataMask[pixelPos]) {
          this.segmentAreaPixels = [];
          this.segmentPerimeterPixels = [];

          let pixelStack = [[x, y]];

          while (pixelStack.length) {
            let newPos, xx, yy, pixelPos, reachLeft, reachRight;
            newPos = pixelStack.pop();
            xx = newPos[0];
            yy = newPos[1];

            pixelPos = yy * this.pplCroppedCanvas.width + xx;
            while (yy-- >= 0 && this.imgDataMask[pixelPos]) {
              pixelPos -= this.pplCroppedCanvas.width;
            }
            pixelPos += this.pplCroppedCanvas.width;

            ++yy;
            reachLeft = false;
            reachRight = false;
            while (
              yy++ < this.pplCroppedCanvas.height - 1 &&
              this.imgDataMask[pixelPos]
            ) {
              this.addPixel(pixelPos, xx, yy);

              if (xx > 0) {
                if (this.imgDataMask[pixelPos - 1]) {
                  if (!reachLeft) {
                    pixelStack.push([xx - 1, yy]);
                    reachLeft = true;
                  }
                } else if (reachLeft) {
                  reachLeft = false;
                }
              }

              if (xx < this.pplCroppedCanvas.width - 1) {
                if (this.imgDataMask[pixelPos + 1]) {
                  if (!reachRight) {
                    pixelStack.push([xx + 1, yy]);
                    reachRight = true;
                  }
                } else if (reachRight) {
                  reachRight = false;
                }
              }
              pixelPos += this.pplCroppedCanvas.width;
            }
          }

          this.segments[currentObject].push({
            areaPixels: this.segmentAreaPixels,
            perimeterPixels: this.segmentPerimeterPixels,
          });
        }
      }

      if (x == this.pplCroppedCanvas.width - 1) {
        this.updateStatus(currentObject, "Segmentation...", perc);
        setTimeout(this.preFiltering.bind(this), 1, currentObject);
      } else {
        this.updateStatus(currentObject, "Segmentation...", perc);
      }
    }
  }

  preFiltering(currentObject) {
    this.updateStatus(currentObject, "Filtering...", 0);
    this.addLog("Filtering started.");

    let perc = 0;
    let step = 500;
    this.percAdd = Math.floor(
      100 / (this.segments[currentObject].length / step)
    );

    for (
      let start = 0;
      start <= this.segments[currentObject].length;
      start += step
    ) {
      let end;
      if (start + step < this.segments[currentObject].length)
        end = start + step;
      else end = this.segments[currentObject].length;

      perc += this.percAdd;
      setTimeout(this.filtering.bind(this), 1, currentObject, start, end, perc);
    }
  }

  filtering(currentObject, start, end, perc) {
    for (let segmentIndex = start; segmentIndex < end; segmentIndex += 1) {
      let segment = this.segments[currentObject][segmentIndex];
      let area = segment.areaPixels.length;

      if (area >= this.object.min_area && area <= this.object.max_area) {
        let compactness =
          (4 * Math.PI * area) / Math.pow(segment.perimeterPixels.length, 2);

        if (
          compactness >= this.object.min_compactness &&
          compactness <= this.object.max_compactness
        ) {
          let convexHull = this.getConvexHull(segment.perimeterPixels);
          let convexity;

          if (convexHull == false) {
            convexity = 999;
          } else {
            let segmentConvexPerimeter = 0;

            for (let i = 0; i < convexHull.length - 1; i++) {
              segmentConvexPerimeter += this.getDistance(
                convexHull[i],
                convexHull[i + 1]
              );
            }

            segmentConvexPerimeter += this.getDistance(
              convexHull[0],
              convexHull[convexHull.length - 1]
            );

            convexity = segmentConvexPerimeter / segment.perimeterPixels.length;
          }

          if (
            convexity >= this.object.min_convexity &&
            convexity <= this.object.max_convexity
          ) {
            let majorAxis = {};
            majorAxis.length = 0;
            convexHull.sort(this.sortfirst);
            for (let i = 0; i < convexHull.length; i += 1) {
              let posXY1 = convexHull[i];
              for (let i2 = i; i2 < convexHull.length; i2 += 1) {
                let posXY2 = convexHull[i2];
                if (i !== i2) {
                  let length = this.getDistance(posXY1, posXY2);
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

            let minorAxis = {};
            minorAxis.length = 0;
            let sum_x = 0;
            let sum_y = 0;
            for (let i = 0; i < segment.perimeterPixels.length; i += 1) {
              let posXY1 = segment.perimeterPixels[i];
              sum_x += segment.perimeterPixels[i][0];
              sum_y += segment.perimeterPixels[i][1];
              for (let i2 = i; i2 < segment.perimeterPixels.length; i2 += 1) {
                let posXY2 = segment.perimeterPixels[i2];
                if (i !== i2) {
                  let length = this.getDistance(posXY1, posXY2);
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
            let aspectRatio = minorAxis.length / majorAxis.length;

            let centroid = {};
            centroid.x = Math.round(sum_x / segment.perimeterPixels.length);
            centroid.y = Math.round(sum_y / segment.perimeterPixels.length);

            if (
              majorAxis.angle >= this.object.min_major_axis_angle &&
              majorAxis.angle <= this.object.max_major_axis_angle &&
              aspectRatio >= this.object.min_aspect_ratio &&
              aspectRatio <= this.object.max_aspect_ratio
            ) {
              this.filtered[currentObject].push({
                id:
                  this.object.obj_name +
                  "_" +
                  this.filtered[currentObject].length,
                name: this.object.obj_name,
                areaPixels: segment.areaPixels,
                perimeterPixels: segment.perimeterPixels,
                centroid: {
                  x: centroid.x + this.margin.left,
                  y: centroid.y + this.margin.top,
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

              this.validPixels[currentObject] += area;
            }
          }
        }
      }
    }

    if (end == this.segments[currentObject].length) {
      this.updateStatus(currentObject, "Rendering...", 0);
      setTimeout(this.rendering.bind(this), 1, currentObject);
    } else {
      this.updateStatus(currentObject, "Filtering...", perc);
    }
  }
  /* arrivato qui */
  rendering(currentObject) {
    let comparisonObjectPoints, renderSegmentColorRgb;
    this.addLog("Rendering started.");

    /* RENDER */
    if (this.comparisonPoints.length > 0) {
      renderSegmentColorRgb = this.hexToRgb(this.object.render_segment_color);
      comparisonObjectPoints = this.comparisonPoints.filter(
        (point) => point.name == this.object.obj_name
      );
    } else {
      comparisonObjectPoints = [];
    }

    const renderColorRgb = this.hexToRgb(this.object.render_color);

    for (let p = 0; p < this.filtered[currentObject].length; p += 1) {
      let segment = this.filtered[currentObject][p];

      if (this.object.render_mode == "fill") {
        for (let i = 0; i < segment.areaPixels.length; i += 1) {
          let point = segment.areaPixels[i];

          const pos =
            point[1] * (this.pplCroppedCanvas.width * 4) + point[0] * 4;
          this.imgDataMaskAll[pos / 4] = true;

          this.imgData.ppl.data[pos] = renderColorRgb.r;
          this.imgData.ppl.data[pos + 1] = renderColorRgb.g;
          this.imgData.ppl.data[pos + 2] = renderColorRgb.b;
          this.imgData.xpl.data[pos] = renderColorRgb.r;
          this.imgData.xpl.data[pos + 1] = renderColorRgb.g;
          this.imgData.xpl.data[pos + 2] = renderColorRgb.b;

          if (
            comparisonObjectPoints.some(
              (e) =>
                e.x == point[0] + this.margin.left &&
                e.y == point[1] + this.margin.top
            )
          ) {
            for (let ii = 0; ii < segment.areaPixels.length; ii += 1) {
              let point = segment.areaPixels[ii];

              const pos =
                point[1] * (this.pplCroppedCanvas.width * 4) + point[0] * 4;

              this.imgData.ppl.data[pos] = renderSegmentColorRgb.r;
              this.imgData.ppl.data[pos + 1] = renderSegmentColorRgb.g;
              this.imgData.ppl.data[pos + 2] = renderSegmentColorRgb.b;
              this.imgData.xpl.data[pos] = renderSegmentColorRgb.r;
              this.imgData.xpl.data[pos + 1] = renderSegmentColorRgb.g;
              this.imgData.xpl.data[pos + 2] = renderSegmentColorRgb.b;
            }
            i = segment.areaPixels.length;

            this.comparisonValidPoints[currentObject].push([
              point[0],
              point[1],
            ]);
          }

          if (
            this.trainingPoints.some(
              (e) =>
                e.x == point[0] + this.margin.left &&
                e.y == point[1] + this.margin.top
            )
          ) {
            this.filteredTrainingPoints[currentObject].push(segment);
          }
        }
      }

      if (this.object.render_mode == "only_border") {
        for (let i = 0; i < segment.perimeterPixels.length; i += 1) {
          let point = segment.perimeterPixels[i];

          let pos = point[1] * (this.pplCroppedCanvas.width * 4) + point[0] * 4;

          this.imgData.ppl.data[pos] = renderColorRgb.r;
          this.imgData.ppl.data[pos + 1] = renderColorRgb.g;
          this.imgData.ppl.data[pos + 2] = renderColorRgb.b;
          this.imgData.xpl.data[pos] = renderColorRgb.r;
          this.imgData.xpl.data[pos + 1] = renderColorRgb.g;
          this.imgData.xpl.data[pos + 2] = renderColorRgb.b;
        }
      }
    }

    if (this.filteredTrainingPoints[currentObject].length) {
      this.filtered[currentObject] = this.filteredTrainingPoints[currentObject];
    }

    this.addLog(
      "object '" +
        this.object.obj_name +
        "' (" +
        currentObject +
        " of " +
        this.maxObjects +
        ") completed: valid pixels: " +
        ((this.validPixels[currentObject] * 100) / this.totalPixels).toFixed(
          2
        ) +
        "% (" +
        this.validPixels[currentObject] +
        " of " +
        this.totalPixels +
        " px), valid segments: " +
        this.filtered[currentObject].length
    );

    /* stats */
    if (this.filtered[currentObject].length > 0) {
      this.stats[currentObject] = {};

      this.statsProperties.forEach((statName) => {
        let values = this.filtered[currentObject].map((a) =>
          math.round(a.stats[statName], 2)
        );

        this.stats[currentObject][statName] = {
          min: math.round(math.min(values), 2),
          max: math.round(math.max(values), 2),
          mean: math.round(math.mean(values), 2),
          median: math.round(math.median(values), 2),
          mode: math.round(math.mode(values), 2),
        };
      });

      let logText =
        "object '" +
        this.object.obj_name +
        "' stats (" +
        currentObject +
        " of " +
        this.maxObjects +
        "):";

      for (let statName in this.stats[currentObject]) {
        logText += "<br>>> " + statName + ": ";
        for (let property in this.stats[currentObject][statName]) {
          logText +=
            " " +
            property +
            ": " +
            this.stats[currentObject][statName][property];
        }
      }

      this.addLog(logText);
    }

    if (comparisonObjectPoints.length > 0) {
      this.addLog(
        "object '" +
          this.object.obj_name +
          "' points comparison completed: valid points: " +
          this.comparisonValidPoints[currentObject].length +
          "/" +
          comparisonObjectPoints.length +
          "(" +
          (
            (this.comparisonValidPoints[currentObject].length * 100) /
            comparisonObjectPoints.length
          ).toFixed(2) +
          " %), valid points on valid segments: " +
          this.comparisonValidPoints[currentObject].length +
          "/" +
          this.filtered[currentObject].length +
          "(" +
          (
            (this.comparisonValidPoints[currentObject].length * 100) /
            this.filtered[currentObject].length
          ).toFixed(2) +
          " %)"
      );
    }

    if (this.filteredTrainingPoints[currentObject].length > 0) {
      for (let statName in this.stats[currentObject]) {
        const statNameS = statName
          .replace("aspectRatio", "aspect_ratio")
          .replace("majorAxisAngle", "major_axis_angle");
        document.querySelector("#min_" + statNameS).value =
          this.stats[currentObject][statName].min;
        document.querySelector("#max_" + statNameS).value =
          this.stats[currentObject][statName].max;
      }

      this.addLog("object '" + this.object.obj_name + "' trained");
    }

    setTimeout(this.print.bind(this), 1);
    this.firstRender = 1;

    if (currentObject < this.maxObjects) {
      if (this.onlySelected) {
        document.querySelector("#start_btn").disabled = false;
        this.updateStatus(1, "Completed.", 100);
      } else {
        setTimeout(this.initialization.bind(this), 1, currentObject + 1);
      }
    } else {
      this.trainingPoints = [];

      document.querySelector("#start_btn").disabled = false;
      this.updateStatus(1, "Completed.", 100);
    }
  }

  print() {
    this.pplResultsCtx.putImageData(this.imgData.ppl, 0, 0);
    this.xplResultsCtx.putImageData(this.imgData.xpl, 0, 0);

    /* if (this.comparisonPoints.length)
		drawPoints(this.comparisonPoints, this.object.render_segment_color); */
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // https://github.com/antimatter15/rgb-lab
  rgb2lab(color) {
    const key = String(color.r) + String(color.g) + String(color.b);

    if (typeof this.labColors[key] == "undefined") {
      let r = color.r / 255,
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

      const ret = [116 * y - 16, 500 * (x - y), 200 * (y - z)];

      this.labColors[key] = ret;

      return ret;
    } else {
      return this.labColors[key];
    }
  }

  // https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

  deltaE(labA, labB) {
    const deltaL = labA[0] - labB[0];
    const deltaA = labA[1] - labB[1];
    const deltaB = labA[2] - labB[2];
    const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    const deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    const sc = 1.0 + 0.045 * c1;
    const sh = 1.0 + 0.015 * c1;
    const deltaLKlsl = deltaL / 1.0;
    const deltaCkcsc = deltaC / sc;
    const deltaHkhsh = deltaH / sh;
    const i =
      deltaLKlsl * deltaLKlsl +
      deltaCkcsc * deltaCkcsc +
      deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
  }

  rgb2hsv(r, g, b) {
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

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  rgbToHsl(r, g, b) {
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

  isClose(color1, color2, tollerance) {
    const distance =
      Math.abs(color1.r - color2.r) +
      Math.abs(color1.g - color2.g) +
      Math.abs(color1.b - color2.b);
    if (distance <= tollerance) return true;
    return false;
  }

  addLog(text) {
    const date = new Date();
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const now = hours + ":" + minutes + ":" + seconds;
    text =
      '<div class="mb-3"><div class="small">' +
      now +
      "</div><div>" +
      text +
      "<div></div>";

    const logContainer = document.getElementById("log");
    logContainer.insertAdjacentHTML("beforeend", text);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  updateStatus(currentObject, status, perc) {
    if (perc > 100) perc = 100;

    let progressBar = document.getElementById("progress-bar");
    progressBar.style.width = perc + "%";

    let statusElement = document.getElementById("status");
    statusElement.innerHTML = status;

    let currentObjectElement = document.getElementById("obj_current");
    currentObjectElement.innerHTML = currentObject;
  }

  addPixel(pixelPos, x, y) {
    this.imgDataMask[pixelPos] = false;

    this.segmentAreaPixels.push([x, y]);

    const pixelPosTop = pixelPos - this.pplCroppedCanvas.width;
    const pixelPosLeft = pixelPos - 1;
    const pixelPosRight = pixelPos + 1;
    const pixelPosBottom = pixelPos + this.pplCroppedCanvas.width;

    if (pixelPosTop >= 0) {
      if (this.imgDataMaskB[pixelPosTop] == false) {
        this.segmentPerimeterPixels.push([x, y]);
      }
    } else {
      this.segmentPerimeterPixels.push([x, y]);
    }

    if (pixelPosLeft >= y * this.pplCroppedCanvas.width) {
      if (this.imgDataMaskB[pixelPosLeft] == false) {
        this.segmentPerimeterPixels.push([x, y]);
      }
    } else {
      this.segmentPerimeterPixels.push([x, y]);
    }

    if (
      pixelPosBottom <=
      this.pplCroppedCanvas.width * this.pplCroppedCanvas.height
    ) {
      if (this.imgDataMaskB[pixelPosBottom] == false) {
        this.segmentPerimeterPixels.push([x, y]);
      }
    } else {
      this.segmentPerimeterPixels.push([x, y]);
    }

    if (pixelPosRight < (y + 1) * this.pplCroppedCanvas.width) {
      if (this.imgDataMaskB[pixelPosRight] == false) {
        this.segmentPerimeterPixels.push([x, y]);
      }
    } else {
      this.segmentPerimeterPixels.push([x, y]);
    }
  }

  orientation(p, q, r) {
    const value = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (value == 0) return 0;
    return value > 0 ? 1 : 2;
  }

  sortfirst(a, b) {
    if (a[0] === b[0]) {
      return 0;
    } else {
      return a[0] < b[0] ? -1 : 1;
    }
  }

  getDistance(a, b) {
    return Math.sqrt(
      (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
  }

  cross(a, b, o) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  getConvexHull(points) {
    points.sort((a, b) => {
      return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
    });

    const lower = [];
    for (let i = 0; i < points.length; i++) {
      while (
        lower.length >= 2 &&
        this.cross(
          lower[lower.length - 2],
          lower[lower.length - 1],
          points[i]
        ) <= 0
      ) {
        lower.pop();
      }
      lower.push(points[i]);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      while (
        upper.length >= 2 &&
        this.cross(
          upper[upper.length - 2],
          upper[upper.length - 1],
          points[i]
        ) <= 0
      ) {
        upper.pop();
      }
      upper.push(points[i]);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  openPicker(mode, el) {
    if (this.ppl && this.xpl) {
      this.pickerColorN = el.closest(".color").getAttribute("data-number");

      if (mode == 1) {
        this.pickerCanvas.width = this.pplPreviewCanvas.width;
        this.pickerCanvas.height = this.pplPreviewCanvas.height;
        this.pickerCanvasCtx.drawImage(this.ppl, 0, 0);
      }
      if (mode == 2) {
        this.pickerCanvas.width = this.xplPreviewCanvas.width;
        this.pickerCanvas.height = this.xplPreviewCanvas.height;
        this.pickerCanvasCtx.drawImage(this.xpl, 0, 0);
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

  setColorFromMouse(event) {
    const x = event.clientX + Math.round(window.pageXOffset);
    const y = event.clientY + Math.round(window.pageYOffset);

    this.imgData.ppl = this.pplPreviewCtx.getImageData(
      0,
      0,
      this.pplPreviewCanvas.width,
      this.pplPreviewCanvas.height
    );
    this.imgData.xpl = this.xplPreviewCtx.getImageData(
      0,
      0,
      this.pplPreviewCanvas.width,
      this.pplPreviewCanvas.height
    );

    document.querySelector("#ppl_color_target_" + this.pickerColorN).value =
      this.getColorFromPosition(this.imgData.ppl, x, y);
    document.querySelector("#xpl_color_target_" + this.pickerColorN).value =
      this.getColorFromPosition(this.imgData.xpl, x, y);

    document.querySelector("#main-view").style.display = "block";
    document.querySelector("#picker-view").style.display = "none";
  }

  getColorFromPosition(imgData, x, y) {
    const pixelPos = (y * this.pplPreviewCanvas.width + x) * 4;

    const color = {
      r: imgData.data[pixelPos],
      g: imgData.data[pixelPos + 1],
      b: imgData.data[pixelPos + 2],
    };

    return this.rgbToHex(color.r, color.g, color.b);
  }

  changeCanvas(m) {
    if (m == "ppl") {
      document.querySelector("#canvas2_div").style.display = "none";
      document.querySelector("#canvas1_div").style.display = "block";
    }
    if (m == "xpl") {
      document.querySelector("#canvas1_div").style.display = "none";
      document.querySelector("#canvas2_div").style.display = "block";
    }
  }

  geojsonDownload() {
    const download = document.getElementById("geojson_download");
    let features = [];

    this.filtered.forEach((segments) => {
      segments.forEach((obj) => {
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

  pplDownload() {
    const download = document.getElementById("ppl_download");
    const image = document
      .getElementById("ppl_results_canvas")
      .toDataURL("image/png");
    download.setAttribute("href", image);
  }

  xplDownload() {
    const download = document.getElementById("xpl_download");
    const image = document
      .getElementById("xpl_results_canvas")
      .toDataURL("image/png");
    download.setAttribute("href", image);
  }

  csvDownload() {
    const download = document.getElementById("csv_download");

    let csvContent = [
      '"id","object","x","y","' + this.statsProperties.join('","') + '"',
    ];

    this.filtered.forEach((segments) => {
      segments.forEach((obj) => {
        const dataString =
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

  addColorBtn() {
    let maxColors = parseInt(
      document.querySelector('[name="max_colors"]').value
    );
    maxColors += 1;
    document.querySelector('[name="max_colors"]').value = maxColors;
    this.addColor(maxColors);
  }

  addColor(
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
    newColorEl.querySelector("#ppl_color_target_1").id =
      "ppl_color_target_" + n;

    newColorEl.querySelector("#ppl_tollerance_1").value = props.ppl_tollerance;
    newColorEl.querySelector("#ppl_tollerance_1").id = "ppl_tollerance_" + n;

    newColorEl.querySelector("#xpl_color_target_1").value =
      props.xpl_color_target;
    newColorEl.querySelector("#xpl_color_target_1").id =
      "xpl_color_target_" + n;

    newColorEl.querySelector("#xpl_tollerance_1").value = props.xpl_tollerance;
    newColorEl.querySelector("#xpl_tollerance_1").id = "xpl_tollerance_" + n;

    colorsContainer.appendChild(newColorEl);
  }

  removeColorBtn() {
    this.max_colors = parseInt(
      document.querySelector('[name="max_colors"]').value
    );
    if (this.max_colors > 1) {
      this.max_colors -= 1;
      document.querySelector('[name="max_colors"]').value = this.max_colors;
      this.removeColor();
    }
  }

  removeColor() {
    let colorsContainer = document.querySelector(".colors");
    let lastColorEl = colorsContainer.querySelector(".color:last-child");
    if (lastColorEl) {
      colorsContainer.removeChild(lastColorEl);
    }
  }

  getObject(id) {
    return this.objects[id - 1];
  }

  setObjectFromInputs() {
    const data = {};

    let inputElements = document.querySelectorAll(
      "#left-panel input, #left-panel select"
    );
    inputElements.forEach((element) => {
      if (element.type !== "file") {
        let val = !isNaN(element.value)
          ? parseFloat(element.value)
          : element.value;
        data[element.id] = val;
      }
    });

    this.setObject(this.selectedObject, data);
  }

  setObject(id, data) {
    this.objects[id - 1] = data;
  }

  setInputsFromObject(id) {
    let obj = this.getObject(id);

    let colorInputs = document.querySelectorAll(".color");
    for (let i = 1; i < colorInputs.length; i++) {
      colorInputs[i].remove();
    }

    for (let i = 1; i <= obj.max_colors; i++) {
      if (i > 1) {
        this.addColor(i);
      }
    }

    for (const inputName in obj) {
      let inputElement = document.getElementById(inputName);
      if (inputElement) {
        inputElement.value = obj[inputName];
      }
    }
  }

  deleteObject(id) {
    this.objects.splice(id - 1, 1);
  }

  loadObj(event) {
    let file = event.target.files[0];
    if (!file) {
      return;
    }
    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = (e) => {
      this.objects = JSON.parse(e.target.result);

      this.selectedObject = 1;
      this.maxObjects = this.objects.length;

      this.setInputsFromObject(this.selectedObject);

      if (this.maxObjects > 1) {
        document.getElementById("next_obj").style.opacity = "1";
        document.getElementById("remove_obj").style.opacity = "1";
      }

      document.getElementById("prev_obj").style.opacity = "0.5";

      document.getElementById("obj_max").innerHTML = this.maxObjects;
      document.getElementById("obj_max_2").innerHTML = this.maxObjects;
      document.getElementById("obj_selected").innerHTML = this.selectedObject;
    };
  }

  saveObj() {
    this.setObjectFromInputs(this.selectedObject);
    const download = document.getElementById("obj_download");
    const data =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(this.objects));
    download.setAttribute("download", "objects_" + Date.now() + ".json");
    download.setAttribute("href", data);
  }

  importSegments(event) {
    const file = event.target.files[0];
    const columnName = "descr";
    let defaultTollerance = { ppl: 15, xpl: 15 };

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

        let reader = new FileReader();

        reader.readAsText(file);
        reader.onload = (e) => {
          let points = [];

          let json = JSON.parse(e.target.result);

          json.features.forEach((feature) => {
            let x = Math.abs(Math.round(feature.geometry.coordinates[0]));
            let y = Math.abs(Math.round(feature.geometry.coordinates[1]));

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
              this.trainingPoints = points;

              let newObjects = {};

              this.imgData.ppl = this.pplPreviewCtx.getImageData(
                0,
                0,
                this.pplPreviewCanvas.width,
                this.pplPreviewCanvas.height
              );
              this.imgData.xpl = this.xplPreviewCtx.getImageData(
                0,
                0,
                this.pplPreviewCanvas.width,
                this.pplPreviewCanvas.height
              );

              points.forEach((object) => {
                object.x += this.margin.left;
                object.y += this.margin.top;

                const objectColor = {
                  ppl: this.getColorFromPosition(
                    this.imgData.ppl,
                    object.x,
                    object.y
                  ),
                  xpl: this.getColorFromPosition(
                    this.imgData.xpl,
                    object.x,
                    object.y
                  ),
                };

                if (typeof newObjects[this.object.name] == "undefined") {
                  newObjects[this.object.name] = {
                    obj_name: this.object.name,
                    ppl_color_target_1: objectColor.ppl,
                    ppl_tollerance_1: defaultTollerance.ppl,
                    xpl_color_target_1: objectColor.xpl,
                    xpl_tollerance_1: defaultTollerance.xpl,
                    max_colors: 1,
                    render_color:
                      "#" + Math.floor(Math.random() * 16777215).toString(16),
                  };
                } else {
                  let close = false;
                  let objectColorLab = {
                    ppl: this.rgb2lab(this.hexToRgb(objectColor.ppl)),
                    xpl: this.rgb2lab(this.hexToRgb(objectColor.xpl)),
                  };

                  for (
                    let i = 0;
                    i < newObjects[this.object.name].max_colors;
                    i += 1
                  ) {
                    let otherColor = {
                      ppl: this.rgb2lab(
                        this.hexToRgb(
                          newObjects[this.object.name][
                            "ppl_color_target_" + (i + 1)
                          ]
                        )
                      ),
                      xpl: this.rgb2lab(
                        this.hexToRgb(
                          newObjects[this.object.name][
                            "xpl_color_target_" + (i + 1)
                          ]
                        )
                      ),
                    };
                    let deltaPpl = this.deltaE(
                      otherColor.ppl,
                      objectColorLab.ppl
                    );
                    let deltaXpl = this.deltaE(
                      otherColor.xpl,
                      objectColorLab.xpl
                    );

                    if (
                      defaultTollerance.ppl >= deltaPpl &&
                      defaultTollerance.xpl >= deltaXpl
                    )
                      close = true;
                  }

                  if (!close) {
                    let colorIndex =
                      newObjects[this.object.name].this.max_colors + 1;
                    newObjects[this.object.name].max_colors = colorIndex;
                    newObjects[this.object.name][
                      "ppl_color_target_" + colorIndex
                    ] = this.objectColor.this.ppl;
                    newObjects[this.object.name][
                      "xpl_color_target_" + colorIndex
                    ] = this.objectColor.this.xpl;
                    newObjects[this.object.name][
                      "ppl_tollerance_" + colorIndex
                    ] = defaultTollerance.this.ppl;
                    newObjects[this.object.name][
                      "xpl_tollerance_" + colorIndex
                    ] = defaultTollerance.this.xpl;
                  }
                }
              });

              this.objects = [];
              for (let i in newObjects) {
                this.objects.push(newObjects[i]);
              }

              this.selectedObject = 1;
              this.maxObjects = this.objects.length;

              this.setInputsFromObject(this.selectedObject);

              document.getElementById("obj_max").innerHTML = this.maxObjects;
              document.getElementById("obj_max_2").innerHTML = this.maxObjects;
              document.getElementById("obj_selected").innerHTML =
                this.selectedObject;

              if (this.maxObjects > 1) {
                document.getElementById("next_obj").style.opacity = "1";
                document.getElementById("remove_obj").style.opacity = "1";
              }

              Swal.fire({
                text: this.maxObjects + " objects imported",
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

  importPoints(event) {
    let file = event.target.files[0];
    let columnName = "descr";

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
        let reader = new FileReader();

        reader.readAsText(file);
        reader.onload = (e) => {
          let points = [];

          let json = JSON.parse(e.target.result);

          json.features.forEach((feature) => {
            let x = Math.abs(Math.round(feature.geometry.coordinates[0]));
            let y = Math.abs(Math.round(feature.geometry.coordinates[1]));

            if (this.customWidth) {
              x = Math.round(x * (this.customWidth / this.originalSize.width));
              y = Math.round(y * (this.customWidth / this.originalSize.width));
            }

            points.push({
              name: feature.properties[columnName],
              x,
              y,
            });
          });

          this.comparisonPoints = points;

          this.drawPoints(this.comparisonPoints);

          Swal.fire({
            text: this.comparisonPoints.length + " points imported",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
          });

          if (this.comparisonPoints.length)
            document.getElementById(
              "render_segment_color_container"
            ).renderSegmentColorContainer.style.display = "block";
        };
      }
    });
  }

  /* BUTTONS */
  prevObjBtn() {
    if (this.selectedObject > 1) {
      this.setObjectFromInputs(this.selectedObject);
      this.selectedObject -= 1;
      this.setInputsFromObject(this.selectedObject);

      document.getElementById("obj_selected").innerHTML = this.selectedObject;
    }

    if (this.selectedObject == this.maxObjects) {
      document.getElementById("next_obj").style.opacity = "0.5";
    } else {
      document.getElementById("next_obj").style.opacity = "1";
    }

    if (this.selectedObject > 1) {
      document.getElementById("prev_obj").style.opacity = "1";
    } else {
      document.getElementById("prev_obj").style.opacity = "0.5";
    }
  }

  nextObjBtn() {
    if (this.selectedObject < this.maxObjects) {
      this.setObjectFromInputs(this.selectedObject);
      this.selectedObject += 1;
      this.setInputsFromObject(this.selectedObject);

      document.getElementById("obj_selected").innerHTML = this.selectedObject;
    }

    if (this.selectedObject == this.maxObjects) {
      document.getElementById("next_obj").style.opacity = "0.5";
    } else {
      document.getElementById("next_obj").style.opacity = "1";
    }

    if (this.selectedObject > 1) {
      document.getElementById("prev_obj").style.opacity = "1";
    } else {
      document.getElementById("prev_obj").style.opacity = "0.5";
    }
  }

  addObjBtn() {
    this.maxObjects += 1;

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
      obj_name: "Nameless " + this.maxObjects,
      render_color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    };

    this.setObject(this.maxObjects, data);

    document.getElementById("next_obj").style.opacity = "1";
    document.getElementById("remove_obj").style.opacity = "1";
    document.getElementById("obj_max").innerHTML = this.maxObjects;
    document.getElementById("obj_max_2").innerHTML = this.maxObjects;
  }

  deleteObjBtn() {
    if (this.maxObjects > 1) {
      this.deleteObject(this.selectedObject);

      if (this.selectedObject == this.maxObjects) {
        this.selectedObject -= 1;
      }

      this.maxObjects -= 1;

      this.setInputsFromObject(this.selectedObject);

      if (this.maxObjects == 1) {
        document.getElementById("prev_obj").style.opacity = "0.5";
        document.getElementById("remove_obj").style.opacity = "0.5";
      }

      if (this.selectedObject == this.maxObjects) {
        document.getElementById("next_obj").style.opacity = "0.5";
      }

      document.getElementById("obj_selected").innerHTML = this.selectedObject;
      document.getElementById("obj_max").innerHTML = this.maxObjects;
      document.getElementById("obj_max_2").innerHTML = this.maxObjects;
    }
  }

  drawPoints(points, color = "red") {
    points.forEach((point) => {
      this.pplResultsCtx.beginPath();
      this.pplResultsCtx.arc(
        point.x - this.margin.left,
        point.y - this.margin.top,
        5,
        0,
        2 * Math.PI,
        true
      );
      this.pplResultsCtx.fillStyle = color;
      this.pplResultsCtx.fill();
      this.pplResultsCtx.stroke();

      this.xplResultsCtx.beginPath();
      this.xplResultsCtx.arc(
        point.x - this.margin.left,
        point.y - this.margin.top,
        5,
        0,
        2 * Math.PI,
        true
      );
      this.xplResultsCtx.fillStyle = color;
      this.xplResultsCtx.fill();
      this.xplResultsCtx.stroke();
    });
  }
}
