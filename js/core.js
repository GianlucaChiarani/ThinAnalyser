/* 
	Thin-analyser image processor v. 1.3
	Copyright (c) 2020-2022 Gianluca Chiarani <gianluca.chiarani@gmail.com>
	GNU General Public License (GPL)
*/

"use strict";

var pplPreviewCanvas = document.getElementById('ppl_preview_canvas');
var xplPreviewCanvas = document.getElementById('xpl_preview_canvas');

var pplCroppedCanvas = document.getElementById('ppl_cropped_canvas');
var xplCroppedCanvas = document.getElementById('xpl_cropped_canvas');

var pplResultsCanvas = document.getElementById('ppl_results_canvas');
var xplResultsCanvas = document.getElementById('xpl_results_canvas');

var pickerCanvas = document.getElementById('picker-canvas');

var pplPreviewCtx = pplPreviewCanvas.getContext('2d', { willReadFrequently: true});
var xplPreviewCtx = xplPreviewCanvas.getContext('2d', { willReadFrequently: true });

var pplCroppedCtx = pplCroppedCanvas.getContext('2d', { willReadFrequently: true });
var xplCroppedCtx = xplCroppedCanvas.getContext('2d', { willReadFrequently: true });

var pplResultsCtx = pplResultsCanvas.getContext("2d", { willReadFrequently: true });
var xplResultsCtx = xplResultsCanvas.getContext("2d", { willReadFrequently: true });

var pickerCanvasCtx = pickerCanvas.getContext("2d", { willReadFrequently: true });

var ppl, xpl;
var pplUploaded = false;

var percAdd;

var totalPixels, segmentPerimeterPixels, segmentAreaPixels;

var segments = [];
var validPixels = []
var filtered = [];
var stats = [];
var statsProperties = ['area','compactness','convexity','aspectRatio','majorAxisAngle'];
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
	offsetY: 0
}

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
	height: 0
}

var comparisonPoints = [], comparisonValidPoints = [], trainingPoints = [], filteredTrainingPoints = [];

$('#ppl_loader').on('change', pplHandleImage);
$('#xpl_loader').on('change', xplHandleImage);
$('#obj_loader').on('change', loadObj);
$('#segments_loader').on('change', importSegments);
$('#points_loader').on('change', importPoints);

var autoload = 'test/48a/';
if (autoload) {
	ppl = new Image();
	xpl = new Image();

	ppl.onload = function () {
		originalSize = {
			width: ppl.width,
			height: ppl.height
		};

		if (customWidth) {
			ppl.width = customWidth;
			ppl.height = originalSize.height * (customWidth / originalSize.width);
		}

		pplPreviewCanvas.width = ppl.width;
		pplPreviewCanvas.height = ppl.height;
		pplCroppedCanvas.width = ppl.width;
		pplCroppedCanvas.height = ppl.height;
		pplResultsCanvas.width = ppl.width;
		pplResultsCanvas.height = ppl.height;

		pplPreviewCtx.drawImage(ppl, 0, 0, ppl.width, ppl.height);
		pplCroppedCtx.drawImage(ppl, 0, 0, ppl.width, ppl.height);
		pplResultsCtx.drawImage(ppl, 0, 0, ppl.width, ppl.height);

		pplUploaded = true;

		$('#ppl_preview').css("display", "block");
		$('#ppl_upload_icon').css("display", "none");
	}

	xpl.onload = function () {
		originalSize = {
			width: xpl.width,
			height: xpl.height
		};

		if (customWidth) {
			xpl.width = customWidth;
			xpl.height = originalSize.height * (customWidth / originalSize.width);
		}

		xplPreviewCanvas.width = xpl.width;
		xplPreviewCanvas.height = xpl.height;
		xplCroppedCanvas.width = xpl.width;
		xplCroppedCanvas.height = xpl.height;
		xplResultsCanvas.width = xpl.width;
		xplResultsCanvas.height = xpl.height;

		xplPreviewCtx.drawImage(xpl, 0, 0, xpl.width, xpl.height);
		xplCroppedCtx.drawImage(xpl, 0, 0, xpl.width, xpl.height);
		xplResultsCtx.drawImage(xpl, 0, 0, xpl.width, xpl.height);

		$('#xpl_preview').css("display", "block");
		$('#xpl_upload_icon').css("display", "none");
	}

	ppl.src = autoload + 'ppl.png';
	xpl.src = autoload + 'xpl.png';

	if (!customWidth) {
		switch (autoload) {
			case 'test/48a/':
				margin = {
					top: 1100,
					right: 450,
					bottom: 500,
					left: 280,
					offsetX: -7,
					offsetY: 2
				}
				break;
			case 'test/48b/':
				margin = {
					top: 920,
					right: 420,
					bottom: 400,
					left: 300,
					offsetX: -5,
					offsetY: 4
				}
				break;
			case 'test/51a/':
				margin = {
					top: 1550,
					right: 200,
					bottom: 890,
					left: 300,
					offsetX: -5,
					offsetY: 4
				}
				break;
			case 'test/51b/':
				margin = {
					top: 870,
					right: 340,
					bottom: 390,
					left: 400,
					offsetX: -10,
					offsetY: 5
				}
				break;
		}
	}
}

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
			right: 0
		};
		pplUploaded = true;

		$('#loading').css("display", "none");

		$('#ppl_preview').css("display", "block");
		$('#ppl_upload_icon').css("display", "none");
	}

	ppl.onerror = function () {
		$('#loading').css("display", "none");
		alert('File not valid');
	};

	if (typeof e.target.files[0] != 'undefined') {
		$('#loading').css('display', 'block');
		ppl.src = URL.createObjectURL(e.target.files[0])
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
					right: 0
				};

				$('#xpl_preview').css("display", "block");
				$('#xpl_upload_icon').css("display", "none");
			} else {
				alert("PPL & XPL images haven't same size.");
			}
		} else {
			alert("You must upload PPL image before.");
		}

		$('#loading').css("display", "none");
	}

	xpl.onerror = function () {
		$('#loading').css("display", "none");
		alert('File not valid');
	};

	if (typeof e.target.files[0] != 'undefined') {
		$('#loading').css('display', 'block');
		xpl.src = URL.createObjectURL(e.target.files[0])
	}
}

function crop() {
	if (margin.top = prompt("enter the top margin (in px)", margin.top)) {
		if (margin.right = prompt("enter the right margin (in px)", margin.right)) {
			if (margin.bottom = prompt("enter the bottom margin (in px)", margin.bottom)) {
				if (margin.left = prompt("enter the left margin (in px)", margin.left)) {
					if (margin.offsetX = prompt("enter the horizontal XPL offset (in px)", margin.offsetX)) {
						if (margin.offsetY = prompt("enter the vertical XPL offset (in px)", margin.offsetY)) {

							for (let k in margin) {
								margin[k] = parseInt(margin[k]);
							}
 
							var width = pplPreviewCanvas.width - margin.right - margin.left;
							var height = pplPreviewCanvas.height - margin.bottom - margin.top;
							
							pplResultsCtx.clearRect(0, 0, pplResultsCanvas.width, pplResultsCanvas.height);
							xplResultsCtx.clearRect(0, 0, xplResultsCanvas.width, xplResultsCanvas.height);

							pplCroppedCtx.clearRect(0, 0, pplResultsCanvas.width, pplResultsCanvas.height);
							xplCroppedCtx.clearRect(0, 0, xplResultsCanvas.width, xplResultsCanvas.height);

							pplResultsCanvas.width = width;
							pplResultsCanvas.height = height;

							xplResultsCanvas.width = width;
							xplResultsCanvas.height = height;

							pplCroppedCanvas.width = width;
							pplCroppedCanvas.height = height;

							xplCroppedCanvas.width = width;
							xplCroppedCanvas.height = height;

							pplCroppedCtx.drawImage(ppl, margin.left, margin.top, width, height, 0, 0, width, height);
							xplCroppedCtx.drawImage(xpl, margin.left + margin.offsetX, margin.top + margin.offsetY, width, height, 0, 0, width, height);

							pplResultsCtx.drawImage(ppl, margin.left, margin.top, width, height, 0, 0, width, height);
							xplResultsCtx.drawImage(xpl, margin.left + margin.offsetX, margin.top + margin.offsetY, width, height, 0, 0, width, height);
							
							//add_log("Cropped Region: "+new_width+" x "+new_height+" px");
						}
					}
				}
			}
		}
	}
}

function start() {

	$("#start_btn").prop('disabled',true);
	$("#bottom-panel").fadeIn(200);

	setObjectFromInputs(selectedObject);

	imgDataPpl = pplCroppedCtx.getImageData(0, 0, pplCroppedCanvas.width, pplCroppedCanvas.height);
	imgDataXpl = xplCroppedCtx.getImageData(0, 0, xplCroppedCanvas.width, xplCroppedCanvas.height);
	totalPixels = pplCroppedCanvas.width * pplCroppedCanvas.height;

	imgDataMaskAll = [];

	let startObject = (onlySelected?selectedObject:1);

	if (onlyFiltering) {
		object = getObject(startObject);

		validPixels[startObject] = 0;
		filtered[startObject] = [];
		comparisonValidPoints[startObject] = [];
		filteredTrainingPoints[startObject] = [];

		setTimeout(preFiltering, 1, startObject);
		return;
	}

	//onlyFiltering = true;
	
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

	addLog("Initializing '" + object.obj_name + "' (" + currentObject + " of " + maxObjects + "): min area: " + object.min_area + ', max area: ' + object.max_area + ', min compactness: ' + object.min_compactness + ', max compactness: ' + object.max_compactness + ', min convexity: ' + object.min_convexity + ', max convexity: ' + object.max_convexity + ', min aspect ratio=' + object.min_aspect_ratio + ', max aspect ratio=' + object.max_aspect_ratio + ', min major axis angle: ' + object.min_major_axis_angle + ', max major axis angle: ' + object.max_major_axis_angle);

	pplColorTargetLab = [];
	xplColorTargetLab = [];
	for (var i = 0; i < object.max_colors; i += 1) {
		pplColorTargetLab[i] = rgb2lab(hexToRgb(object["ppl_color_target_" + (i + 1)]));
		xplColorTargetLab[i] = rgb2lab(hexToRgb(object["xpl_color_target_" + (i + 1)]));
	}
	
	var perc = 0;
	var step = 25000000;
	percAdd = Math.floor(100 / (imgDataPpl.data.length / step));

	for (var start = 0; start < imgDataPpl.data.length; start += step) {
		if (start + step < imgDataPpl.data.length)
			var end = start + step;
		else
			var end = imgDataPpl.data.length;

		perc += percAdd;

		if (perc > 100)
			perc = 100;

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
				b: imgDataPpl.data[i + 2] 
			};

			color2 = { 
				r: imgDataXpl.data[i],
				g: imgDataXpl.data[i + 1],
				b: imgDataXpl.data[i + 2] 
			};

			color1 = rgb2lab(color1);
			color2 = rgb2lab(color2);

			close = false;
			for (var i2 = 0; i2 < object.max_colors; i2 += 1) {
				let delta1 = deltaE(pplColorTargetLab[i2], color1);
				let delta2 = deltaE(xplColorTargetLab[i2], color2);

				let pplTollerance = object["ppl_tollerance_" + (i2 + 1)];
				let xplTollerance = object["xpl_tollerance_" + (i2 + 1)];
				
				if (pplTollerance >= delta1 && xplTollerance >= delta2)
					close = true;
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

	imgDataMaskB = imgDataMask.slice();

	var perc = 0;
	var step = 1000;
	percAdd = Math.floor(100 / (pplCroppedCanvas.width / step));

	for (var start = 0; start <= pplCroppedCanvas.width; start += step) {
		if (start + step < pplCroppedCanvas.width)
			var end = start + step;
		else 
			var end = pplCroppedCanvas.width;

		perc += percAdd;
		setTimeout(segmentation, 1, currentObject, start, end, perc);
	}
}

function segmentation(currentObject, x_start, x_end, perc) {
	for (var x = x_start; x < x_end; x += 1) {
		for (var y = 0; y < pplCroppedCanvas.height; y += 1) {
			pixelPos = (y * pplCroppedCanvas.width + x);
			if (imgDataMask[pixelPos]) {

				segmentAreaPixels = [];
				segmentPerimeterPixels = [];

				var pixelStack = [[x, y]];

				while (pixelStack.length) {
					var newPos, xx, yy, pixelPos, reachLeft, reachRight;
					newPos = pixelStack.pop();
					xx = newPos[0];
					yy = newPos[1];

					pixelPos = (yy * pplCroppedCanvas.width + xx);
					while (yy-- >= 0 && imgDataMask[pixelPos]) {
						pixelPos -= pplCroppedCanvas.width;
					}
					pixelPos += pplCroppedCanvas.width;

					++yy;
					reachLeft = false;
					reachRight = false;
					while (yy++ < pplCroppedCanvas.height - 1 && imgDataMask[pixelPos]) {
						addPixel(pixelPos,xx,yy);

						if (xx > 0) {
							if (imgDataMask[pixelPos - 1]) {
								if (!reachLeft) {
									pixelStack.push([xx - 1, yy]);
									reachLeft = true;
								}
							}
							else if (reachLeft) {
								reachLeft = false;
							}
						}

						if (xx < pplCroppedCanvas.width - 1) {
							if (imgDataMask[pixelPos + 1]) {
								if (!reachRight) {
									pixelStack.push([xx + 1, yy]);
									reachRight = true;
								}
							}
							else if (reachRight) {
								reachRight = false;
							}
						}
						pixelPos += pplCroppedCanvas.width;
					}
				}
				
				segments[currentObject].push({
					areaPixels: segmentAreaPixels,
					perimeterPixels: segmentPerimeterPixels
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

	var perc = 0;
	var step = 500;
	percAdd = Math.floor(100 / (segments[currentObject].length / step));

	for (var start = 0; start <= segments[currentObject].length; start += step) {
		if (start + step < segments[currentObject].length)
			var end = start + step;
		else 
			var end = segments[currentObject].length;

		perc += percAdd;
		setTimeout(filtering, 1, currentObject, start, end, perc);
	}
}

function filtering(currentObject, start, end, perc) {
	for (var segmentIndex = start; segmentIndex < end; segmentIndex += 1) {
		var segment = segments[currentObject][segmentIndex];
		var area = segment.areaPixels.length;
		
		if (area >= object.min_area && area <= object.max_area) {

			var compactness = ((4 * Math.PI) * area) / Math.pow(segment.perimeterPixels.length, 2);
			
			if (compactness >= object.min_compactness && compactness <= object.max_compactness) {
				//calcolo perimetro convesso
				var convex_hull = convexHull(segment.perimeterPixels);

				if (convex_hull == false) {
					var convexity = 999;
				} else {
					var segment_convex_perimeter = 0;

					for (var i = 0; i < convex_hull.length - 1; i++) {
						segment_convex_perimeter += getDistance(convex_hull[i], convex_hull[i + 1]);
					}

					segment_convex_perimeter += getDistance(convex_hull[0], convex_hull[convex_hull.length - 1]);

					var convexity = segment_convex_perimeter / segment.perimeterPixels.length;
				}

				if (convexity >= object.min_convexity && convexity <= object.max_convexity) {

					//calcolo asse maggiore
					var majorAxis = {};
					majorAxis.length = 0;
					convex_hull.sort(sortfirst);
					for (var i = 0; i < convex_hull.length; i += 1) {
						var posXY1 = convex_hull[i];
						for (var i2 = i; i2 < convex_hull.length; i2 += 1) {
							var posXY2 = convex_hull[i2];
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

					majorAxis.angle = Math.atan2(-(majorAxis.y2 - majorAxis.y1), majorAxis.x2 - majorAxis.x1);
					majorAxis.angle = Math.round((majorAxis.angle * 180) / Math.PI); //conversione in gradi

					//calcolo asse minore e baricentro
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
									minorAxis.angle = Math.atan2(-(posXY2[1] - posXY1[1]), posXY2[0] - posXY1[0]);
									minorAxis.angle = Math.round((minorAxis.angle * 180) / Math.PI);
									if (minorAxis.angle == majorAxis.angle + 90 || minorAxis.angle == majorAxis.angle - 90) {
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
					
					if (majorAxis.angle >= object.min_major_axis_angle && majorAxis.angle <= object.max_major_axis_angle && aspectRatio >= object.min_aspect_ratio && aspectRatio <= object.max_aspect_ratio) {

						filtered[currentObject].push({
							id: object.obj_name + "_" + filtered[currentObject].length,
							name: object.obj_name,
							areaPixels: segment.areaPixels,
							perimeterPixels: segment.perimeterPixels,
							centroid: {
								x: centroid.x + margin.left,
								y: centroid.y + margin.top
							},
							stats: {
								area,
								compactness,
								convexity,
								aspectRatio,
								minorAxisAngle: minorAxis.angle,
								majorAxisAngle: majorAxis.angle
							}
						});

						validPixels[currentObject] += area;
					}
				}
			}
		}
	};

	if (end == segments[currentObject].length) {
		updateStatus(currentObject, "Rendering...", 0);
		setTimeout(rendering, 1, currentObject);
	} else {
		updateStatus(currentObject, "Filtering...", perc);
	}
}

function rendering(currentObject) {
	/* RENDER */
	for (var p = 0; p < filtered[currentObject].length; p += 1) {
		var segment = filtered[currentObject][p];

		var renderColorRgb = hexToRgb(object.render_color);

		if (comparisonPoints.length > 0)
			var renderSegmentColorRgb = hexToRgb(object.render_segment_color);

		if (object.render_mode == "fill") {
			for (var i = 0; i < segment.areaPixels.length; i += 1) {
				var point = segment.areaPixels[i];
				
				var pos = point[1] * (pplCroppedCanvas.width * 4) + (point[0] * 4);
				imgDataMaskAll[pos / 4] = true;

				imgDataPpl.data[pos] = renderColorRgb.r;
				imgDataPpl.data[pos + 1] = renderColorRgb.g;
				imgDataPpl.data[pos + 2] = renderColorRgb.b;
				imgDataXpl.data[pos] = renderColorRgb.r;
				imgDataXpl.data[pos + 1] = renderColorRgb.g;
				imgDataXpl.data[pos + 2] = renderColorRgb.b;

				if (comparisonPoints.some(e => e.name == object.obj_name && e.x == point[0] + margin.left && e.y == point[1] + margin.top)) {
					for (var ii = 0; ii < segment.areaPixels.length; ii += 1) {
						var point = segment.areaPixels[ii];

						var pos = point[1] * (pplCroppedCanvas.width * 4) + (point[0] * 4);

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

				if (trainingPoints.some(e => e.name == object.obj_name && e.x == point[0] + margin.left && e.y == point[1] + margin.top)) {
					filteredTrainingPoints[currentObject].push(segment);
				}
			}
		}

		if (object.render_mode == "only_border") {
			for (var i = 0; i < segment.perimeterPixels.length; i += 1) {
				var point = segment.perimeterPixels[i];

				var pos = point[1] * (pplCroppedCanvas.width * 4) + (point[0] * 4);

				imgDataPpl.data[pos] = renderColorRgb.r;
				imgDataPpl.data[pos + 1] = renderColorRgb.g;
				imgDataPpl.data[pos + 2] = renderColorRgb.b;
				imgDataXpl.data[pos] = renderColorRgb.r;
				imgDataXpl.data[pos + 1] = renderColorRgb.g;
				imgDataXpl.data[pos + 2] = renderColorRgb.b;
			}
		}
	}

	addLog("Object '" + object.obj_name + "' (" + currentObject + " of " + maxObjects + ") completed: valid pixels: " + ((validPixels[currentObject] * 100) / totalPixels).toFixed(2) + "% (" + validPixels[currentObject] + " of " + totalPixels + " px), valid segments: " + filtered[currentObject].length);

	if (filteredTrainingPoints[currentObject].length) {
		filtered[currentObject] = filteredTrainingPoints[currentObject];
	}

	/* STATS */
	if (filtered[currentObject].length > 0) {
		stats[currentObject] = {};

		statsProperties.forEach((statName) => {
			var values = filtered[currentObject].map(a => math.round(a.stats[statName],2));

			stats[currentObject][statName] = {
				min: math.round(math.min(values),2),
				max: math.round(math.max(values), 2),
				mean: math.round(math.mean(values),2),
				median: math.round(math.median(values), 2),
				mode: math.round(math.mode(values), 2)
			}
		});

		var logText = "Stats Object '" + object.obj_name + "' (" + currentObject + " of " + maxObjects + "):";

		for (let statName in stats[currentObject]) {
			logText += "<br>>> " + statName + ": ";
			for (let property in stats[currentObject][statName]) {
				logText += " " + property + ": " + stats[currentObject][statName][property];
			}
		}

		addLog(logText);
	}

	if (comparisonPoints.length > 0) {
		addLog("Object '" + object.obj_name + "' points comparison completed: valid points: " + comparisonValidPoints[currentObject].length + "/" + comparisonPoints.length + '(' + ((comparisonValidPoints[currentObject].length * 100) / comparisonPoints.length).toFixed(2) + " %), valid points on valid segments: " + comparisonValidPoints[currentObject].length + "/" + filtered[currentObject].length + '(' + ((comparisonValidPoints[currentObject].length * 100) / filtered[currentObject].length).toFixed(2) + " %)");
	}

	if (filteredTrainingPoints[currentObject].length) {
		for (let statName in stats[currentObject]) {
			var statNameS = statName.replace('aspectRatio', 'aspect_ratio').replace('majorAxisAngle', 'major_axis_angle');
			$('#min_' + statNameS).val(stats[currentObject][statName].min);
			$('#max_' + statNameS).val(stats[currentObject][statName].max);
		}

		addLog("Object '" + object.obj_name + "' trained");
	}

	setTimeout(print, 1);
	firstRender = 1;

	if (currentObject < maxObjects) {
		if (onlySelected) {
			$("#start_btn").prop('disabled', false);
			updateStatus(1, "Completed.", 100);
		} else
			setTimeout(initialization, 1, currentObject + 1);
	} else {
		trainingPoints = [];

		$("#start_btn").prop('disabled', false);
		updateStatus(1, "Completed.", 100);
	}
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

//Copyright (c) 2014 Kevin Kwok <antimatter15@gmail.com>
function rgb2lab(color) {
	let key = String(color.r) + String(color.g) + String(color.b);

	if (typeof labColors[key] == 'undefined') {
		var r = color.r / 255,
		g = color.g / 255,
		b = color.b / 255,
		x, y, z;

		r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
		g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
		b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

		x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
		y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
		z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

		x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
		y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
		z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;
	
		var ret = [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];

		labColors[key] = ret;

		return ret;
	} else {
		return labColors[key];
	}
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
//http://zschuessler.github.io/DeltaE/learn/
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
	var deltaLKlsl = deltaL / (1.0);
	var deltaCkcsc = deltaC / (sc);
	var deltaHkhsh = deltaH / (sh);
	var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
	return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2hsv (r, g, b) {
	let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
	rabs = r / 255;
	gabs = g / 255;
	babs = b / 255;
	v = Math.max(rabs, gabs, babs),
	diff = v - Math.min(rabs, gabs, babs);
	diffc = c => (v - c) / 6 / diff + 1 / 2;
	percentRoundFn = num => Math.round(num * 100) / 100;
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
			h = (1 / 3) + rr - bb;
		} else if (babs === v) {
			h = (2 / 3) + gg - rr;
		}
		if (h < 0) {
			h += 1;
		}else if (h > 1) {
			h -= 1;
		}
	}
	return {
		h: Math.round(h * 360),
		s: percentRoundFn(s * 100),
		v: percentRoundFn(v * 100)
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
};

function isClose(color1, color2, tollerance) {
	var distance = Math.abs(color1.r - color2.r) + Math.abs(color1.g - color2.g) + Math.abs(color1.b - color2.b);
	if (distance <= tollerance) return true;
	return false;
}

function addLog(text) {
	var date = new Date();
	var seconds = date.getSeconds();
	var minutes = date.getMinutes();
	var hours = date.getHours();
	var now = hours + ':' + minutes + ':' + seconds;
	text = '<div>> ' + now + ' ' + text + '</div>';
	$("#log").append(text);
	$("#log").scrollTop($('#log')[0].scrollHeight);
}

function updateStatus(currentObject, status, perc) {
	if (perc > 100) perc = 100;

	$("#progress-bar").css("width", perc + "%");
	$("#status").html(status);
	$("#obj_current").html(currentObject);
}

function print() {
	pplResultsCtx.putImageData(imgDataPpl, 0, 0);
	xplResultsCtx.putImageData(imgDataXpl, 0, 0);
}

function addPixel(pixelPos,x,y) {
	//var x = (pixelPos) % pplCroppedCanvas.width;
	//var y = Math.floor((pixelPos) / pplCroppedCanvas.width);

	imgDataMask[pixelPos] = false;

	segmentAreaPixels.push([x, y]);

	var pixelPosTop = pixelPos - (pplCroppedCanvas.width);
	var pixelPosLeft = pixelPos - 1;
	var pixelPosRight = pixelPos + 1;
	var pixelPosBottom = pixelPos + (pplCroppedCanvas.width);

	if (pixelPosTop >= 0) {
		if (imgDataMaskB[pixelPosTop] == false) {
			segmentPerimeterPixels.push([x, y]);
		}
	} else {
		segmentPerimeterPixels.push([x, y]);
	}

	if (pixelPosLeft >= y * (pplCroppedCanvas.width)) {
		if (imgDataMaskB[pixelPosLeft] == false) {
			segmentPerimeterPixels.push([x, y]);
		}
	} else {
		segmentPerimeterPixels.push([x, y]);
	}

	if (pixelPosBottom <= (pplCroppedCanvas.width) * pplCroppedCanvas.height) {
		if (imgDataMaskB[pixelPosBottom] == false) {
			segmentPerimeterPixels.push([x, y]);
		}
	} else {
		segmentPerimeterPixels.push([x, y]);
	}

	if (pixelPosRight < (y + 1) * (pplCroppedCanvas.width)) {
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
	return (value > 0) ? 1 : 2;
}

function sortfirst(a, b) {
	if (a[0] === b[0]) {
		return 0;
	}
	else {
		return (a[0] < b[0]) ? -1 : 1;
	}
}

function getDistance(a, b) {
	return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}

function cross(a, b, o) {
	return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

//https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript
function convexHull(points) {
	points.sort(function (a, b) {
		return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
	});

	var lower = [];
	for (var i = 0; i < points.length; i++) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
			lower.pop();
		}
		lower.push(points[i]);
	}

	var upper = [];
	for (var i = points.length - 1; i >= 0; i--) {
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
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
		pickerColorN = $(el).parents('.color').attr('data-number');

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

		$("#main-view").css("display", "none");
		$("#picker-view").css("display", "block");
	} else {
		alert("You must upload both images before.");
	}
}

function setColorFromMouse(event) {
	let x = event.clientX + Math.round(window.pageXOffset);
	let y = event.clientY + Math.round(window.pageYOffset);

	imgDataPpl = pplPreviewCtx.getImageData(0, 0, pplPreviewCanvas.width, pplPreviewCanvas.height);
	imgDataXpl = xplPreviewCtx.getImageData(0, 0, pplPreviewCanvas.width, pplPreviewCanvas.height);

	$('#ppl_color_target_' + pickerColorN).val(getColorFromPosition(imgDataPpl, x, y));
	$('#xpl_color_target_' + pickerColorN).val(getColorFromPosition(imgDataXpl, x, y));

	$("#main-view").css('display', 'block');
	$("#picker-view").css('display', 'none');
}

function getColorFromPosition(imgData,x,y) {
	var pixelPos = (y * pplPreviewCanvas.width + x) * 4;

	var color = {
		r: imgData.data[pixelPos],
		g: imgData.data[pixelPos + 1],
		b: imgData.data[pixelPos + 2]
	};

	return rgbToHex(color.r, color.g, color.b);
}

function changeCanvas(m) {
	if (m == 'ppl') {
		$('#canvas2_div').css("display", "none");
		$('#canvas1_div').css("display", "block");
	}
	if (m == 'xpl') {
		$('#canvas1_div').css("display", "none");
		$('#canvas2_div').css("display", "block");
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
					coordinates: [
						obj.centroid.x,
						obj.centroid.y
					]
				},
				properties: {
					id: obj.id,
					name: obj.name
				}
			});
		});
	});

	const geojson = {
		type: 'FeatureCollection',
		features
	};

	const encodedUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson));
	download.setAttribute("download", 'points_' + Date.now() + '.json');
	download.setAttribute("href", encodedUri);
}

function pplDownload() {
	var download = document.getElementById("ppl_download");
	var image = document.getElementById("ppl_results_canvas").toDataURL("image/png");
	download.setAttribute("href", image);
}

function xplDownload() {
	var download = document.getElementById("xpl_download");
	var image = document.getElementById("xpl_results_canvas").toDataURL("image/png");
	download.setAttribute("href", image);
}

function csvDownload() {
	const download = document.getElementById("csv_download");

	var csvContent = '"id","object","x","y"\n';
	var index = 0;

	filtered.forEach(function (segments) {
		segments.forEach(function (obj) {
			var dataString = '"' + obj.id + '","' + obj.name + '","' + obj.centroid.x + '","' + obj.centroid.y + '"';

			csvContent += index < filtered.length - 1 ? dataString + '\n' : dataString;
			index +=1;
		});
	});

	const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent); 
	download.setAttribute("download", 'objects_' + Date.now() + '.csv');
	download.setAttribute("href", encodedUri);
}

function addColorBtn() {
	var max_colors = parseInt($('[name="max_colors"]').val());
	max_colors += 1;
	$('[name="max_colors"]').val(max_colors);
	addColor(max_colors);
}

function addColor(n, props = { 'ppl_color_target': '#FFFFFF', 'ppl_tollerance': 15, 'xpl_color_target': '', 'xpl_tollerance': 15 }) {
	$('.colors .color:first').clone().appendTo('.colors');

	var newColorEl = $('.colors .color:last');
	newColorEl.attr('data-number', n);
	newColorEl.find('.number').html('COLOR ' + n);
	newColorEl.find('#ppl_color_target_1').val(props.ppl_color_target).attr('id', 'ppl_color_target_' + n);
	newColorEl.find('#ppl_tollerance_1').val(props.ppl_tollerance).attr('id', 'ppl_tollerance_' + n);
	newColorEl.find('#xpl_color_target_1').val(props.xpl_color_target).attr('id', 'xpl_color_target_' + n);
	newColorEl.find('#xpl_tollerance_1').val(props.xpl_tollerance).attr('id', 'xpl_tollerance_' + n);
}

function removeColorBtn() {
	var max_colors = parseInt($('[name="max_colors"]').val());
	if (max_colors > 1) {
		max_colors -= 1;
		$('[name="max_colors"]').val(max_colors);
		removeColor();
	}
}

function removeColor() {
	$('.colors .color:last').remove();
}

function getObject(id) {
	return objects[id-1];
}

function setObjectFromInputs() {
	var data = {};

	$('#left-panel input, #left-panel select').each(function () {
		if ($(this).attr('type') != 'file') {
			var val = (!isNaN($(this).val()) ? parseFloat($(this).val()) : $(this).val());
			data[$(this).attr('id')] = val;
		}
	});

	setObject(selectedObject, data);
}

function setObject(id, data) {
	objects[id-1] = data;
}

function setInputsFromObject(id) {
	var obj = getObject(id);

	var i = 0;
	$('.color').each(function() {
		if (i > 0) {
			$(this).remove();
		}
		i++;
	});

	for (var i = 1; i <= obj.max_colors; i += 1) {
		if (i > 1) {
			addColor(i);
		}
	}

	for (const inputName in obj) {
		$('#' + inputName).val(obj[inputName]);
	};
}

function deleteObject(id) {
	objects.splice(id-1, 1);
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
			$("#next_obj,#remove_obj").css("opacity", "1");
		}

		$("#prev_obj").css("opacity", "0.5");

		$("#obj_max,#obj_max_2").html(maxObjects);
		$("#obj_selected").html(selectedObject);
	};
}

function saveObj() {
	setObjectFromInputs(selectedObject);
	var download = document.getElementById("obj_download");
	var data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(objects));
	download.setAttribute("download", 'objects_' + Date.now() +'.json');
	download.setAttribute("href", data);
}

function importSegments(event) {
	var file = event.target.files[0];
	var columnName = 'descr', defaultTollerance = {ppl: 15, xpl: 15};

	if (!file) {
		return;
	}

	if (columnName = prompt('Insert object column name', columnName)) {
		if (defaultTollerance.ppl = prompt('Insert default PPL tollerance', defaultTollerance.ppl)) {
			if (defaultTollerance.xpl = prompt('Insert default XPL tollerance', defaultTollerance.xpl)) {
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
							x,
							y
						});
					});

					if (confirm('Do you really want to import object names and colors? The current objects will be overwritten.')) {
						trainingPoints = points;

						var newObjects = {};

						imgDataPpl = pplPreviewCtx.getImageData(0, 0, pplPreviewCanvas.width, pplPreviewCanvas.height);
						imgDataXpl = xplPreviewCtx.getImageData(0, 0, pplPreviewCanvas.width, pplPreviewCanvas.height);

						points.forEach(function (object) {
							var objectColor = {
								ppl: getColorFromPosition(imgDataPpl, object.x, object.y),
								xpl: getColorFromPosition(imgDataXpl, object.x, object.y)
							};

							if (typeof newObjects[object.name] == 'undefined') {
								newObjects[object.name] = {
									obj_name: object.name,
									ppl_color_target_1: objectColor.ppl,
									ppl_tollerance_1: defaultTollerance.ppl,
									xpl_color_target_1: objectColor.xpl,
									xpl_tollerance_1: defaultTollerance.xpl,
									max_colors: 1,
									render_color: '#' + Math.floor(Math.random() * 16777215).toString(16)
								};
							} else {
								var close = false;
								var objectColorLab = {
									ppl: rgb2lab(hexToRgb(objectColor.ppl)),
									xpl: rgb2lab(hexToRgb(objectColor.xpl))
								};
								
								for (var i = 0; i < newObjects[object.name].max_colors; i += 1) {
									var otherColor = {
										ppl: rgb2lab(hexToRgb(newObjects[object.name]["ppl_color_target_" + (i + 1)])),
										xpl: rgb2lab(hexToRgb(newObjects[object.name]["xpl_color_target_" + (i + 1)]))
									}
									var deltaPpl = deltaE(otherColor.ppl, objectColorLab.ppl);
									var deltaXpl = deltaE(otherColor.xpl, objectColorLab.xpl);

									if (defaultTollerance.ppl >= deltaPpl && defaultTollerance.xpl >= deltaXpl)
										close = true;
								}

								if (!close) {
									var colorIndex = newObjects[object.name].max_colors + 1;
									newObjects[object.name].max_colors = colorIndex;
									newObjects[object.name]['ppl_color_target_' + colorIndex] = objectColor.ppl;
									newObjects[object.name]['xpl_color_target_' + colorIndex] = objectColor.xpl;
									newObjects[object.name]['ppl_tollerance_' + colorIndex] = defaultTollerance.ppl;
									newObjects[object.name]['xpl_tollerance_' + colorIndex] = defaultTollerance.xpl;
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

						$("#obj_max,#obj_max_2").html(maxObjects);
						$("#obj_selected").html(selectedObject);

						if (maxObjects > 1) {
							$("#next_obj,#remove_obj").css("opacity", "1");
						}

						alert(maxObjects + ' objects imported');
					}
				};
			}
		}
	}
}

function importPoints(event) {
	var file = event.target.files[0];
	var columnName = '';

	if (!file) {
		return;
	}

	if (columnName = prompt('Insert object column name', 'descr')) {
		var reader = new FileReader();

		reader.readAsText(file);
		reader.onload = function (e) {
			var points = [];

			var json = JSON.parse(e.target.result);

			json.features.forEach(function (feature) {
				var x = Math.abs(Math.round(feature.geometry.coordinates[0]));
				var y = Math.abs(Math.round(feature.geometry.coordinates[1]));

				if (customWidth) {
					x = Math.round(x * ((customWidth / originalSize.width)));
					y = Math.round(y * ((customWidth / originalSize.width)));
				}

				points.push({
					name: feature.properties[columnName],
					x,
					y
				});
			});

			comparisonPoints = points;

			alert(comparisonPoints.length + ' points imported');

			if (comparisonPoints.length)
				$('#render_segment_color_container').slideDown(200);

		};
	}
}

/* BUTTONS */

function prevObjBtn() {
	if (selectedObject > 1) {
		setObjectFromInputs(selectedObject);
		selectedObject -= 1;
		setInputsFromObject(selectedObject);

		$("#obj_selected").html(selectedObject);
	}

	if (selectedObject == maxObjects) {
		$("#next_obj").css("opacity", "0.5");
	} else {
		$("#next_obj").css("opacity", "1");
	}

	if (selectedObject > 1) {
		$("#prev_obj").css("opacity", "1");
	} else {
		$("#prev_obj").css("opacity", "0.5");
	}
}

function nextObjBtn() {
	if (selectedObject < maxObjects) {
		setObjectFromInputs(selectedObject);
		selectedObject += 1;
		setInputsFromObject(selectedObject);

		$("#obj_selected").html(selectedObject);
	}

	if (selectedObject == maxObjects) {
		$("#next_obj").css("opacity", "0.5");
	} else {
		$("#next_obj").css("opacity", "1");
	}

	if (selectedObject > 1) {
		$("#prev_obj").css("opacity", "1");
	} else {
		$("#prev_obj").css("opacity", "0.5");
	}
}

function addObjBtn() {
	maxObjects += 1;

	const data = {
		ppl_color_target: [],
		xpl_color_target: [],
		ppl_tollerance: [],
		xpl_tollerance: [],
		ppl_color_target_1: '#ffffff',
		xpl_color_target_1: '#000000',
		ppl_tollerance_1: '15',
		xpl_tollerance_1: '15',
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
		obj_name: 'Nameless ' + maxObjects,
		render_color: '#' + Math.floor(Math.random() * 16777215).toString(16)
	}

	setObject(maxObjects, data);

	$("#next_obj").css("opacity", "1");
	$("#remove_obj").css("opacity", "1");
	$("#obj_max,#obj_max_2").html(maxObjects);
}

function deleteObjBtn() {
	if (maxObjects > 1) {
		deleteObject(selectedObject);

		if (selectedObject == maxObjects) {
			selectedObject -=1;
		}

		maxObjects -= 1;

		setInputsFromObject(selectedObject);

		if (maxObjects == 1) {
			$("#prev_obj").css("opacity", "0.5");
			$("#remove_obj").css("opacity", "0.5");
		}

		if (selectedObject == maxObjects) {
			$("#next_obj").css("opacity", "0.5");
		}

		$("#obj_selected").html(selectedObject);
		$("#obj_max,#obj_max_2").html(maxObjects);
	}
}