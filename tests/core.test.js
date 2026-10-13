const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/core.js"), "utf8");

function createAnalyser(overrides = {}, globals = {}) {
  const elements = new Map();
  const getElement = (selector) => {
    if (!elements.has(selector)) {
      elements.set(selector, { style: {}, value: "", disabled: false });
    }
    return elements.get(selector);
  };
  const context = {
    Tiff: { initialize() {} },
    setTimeout() {},
    document: { getElementById: getElement, querySelector: getElement },
    math: require("../js/math.js"),
    ...globals,
  };
  vm.createContext(context);
  vm.runInContext(source + "\nthis.Analyser = ThinAnalyser;", context);
  const analyser = Object.create(context.Analyser.prototype);
  Object.assign(analyser, {
    labColors: {},
    margin: { left: 0, top: 0, right: 0, bottom: 0, offsetX: 0, offsetY: 0 },
    segments: [],
    filtered: [],
    validPixels: [],
    stats: [],
    statsProperties: ["area", "compactness", "convexity", "aspectRatio", "majorAxisAngle"],
    pplCroppedCanvas: { width: 50, height: 40 },
    comparisonPoints: [],
    trainingPoints: [],
    comparisonValidPoints: [],
    filteredTrainingPoints: [],
    imgDataMaskAll: [],
    objects: [{}],
    maxObjects: 1,
    selectedObject: 1,
    addLog() {},
    updateStatus() {},
    ...overrides,
  });
  return analyser;
}

test("RGB cache distinguishes previously colliding colors", () => {
  const analyser = createAnalyser();
  const colorA = { r: 1, g: 23, b: 4 };
  const colorB = { r: 12, g: 3, b: 4 };
  const labA = analyser.rgb2lab(colorA);
  const labB = analyser.rgb2lab(colorB);
  const uncachedLabB = createAnalyser().rgb2lab(colorB);

  assert.notDeepEqual(Array.from(labA), Array.from(labB));
  assert.deepEqual(Array.from(labB), Array.from(uncachedLabB));
  assert.ok(analyser.deltaE(labA, labB) > 11);
  assert.equal(analyser.rgb2lab(colorA), labA);
});

function createSegment(points, width = 50, height = 40) {
  const analyser = createAnalyser({
    pplCroppedCanvas: { width, height },
    imgDataMask: Array(width * height).fill(false),
    imgDataMaskB: Array(width * height).fill(false),
    segmentAreaPixels: [],
    segmentPerimeterPixels: [],
  });
  for (const [column, row] of points) {
    analyser.imgDataMaskB[row * width + column] = true;
  }
  for (const [column, row] of points) {
    analyser.addPixel(row * width + column, column, row);
  }
  return {
    areaPixels: analyser.segmentAreaPixels,
    perimeterPixels: analyser.segmentPerimeterPixels,
  };
}

test("perimeter counts all four edges of isolated pixels, including image borders", () => {
  for (const [column, row] of [[0, 0], [2, 0], [0, 2], [2, 2], [1, 1]]) {
    const segment = createSegment([[column, row]], 3, 3);
    assert.equal(segment.perimeterPixels.length, 4, `pixel ${column},${row}`);
  }
});

test("perimeter of a full image includes the bottom-left edge", () => {
  const points = [];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) points.push([column, row]);
  }
  assert.equal(createSegment(points, 3, 3).perimeterPixels.length, 12);
});

function filterSegments(segments, object = {}, overrides = {}) {
  const analyser = createAnalyser({
    object: {
      obj_name: "test",
      min_area: 1,
      max_area: Infinity,
      min_compactness: 0,
      max_compactness: 1,
      min_convexity: 0,
      max_convexity: 1,
      min_aspect_ratio: 0,
      max_aspect_ratio: 1,
      min_major_axis_angle: -90,
      max_major_axis_angle: 90,
      ...object,
    },
    ...overrides,
  });
  analyser.segments[1] = segments;
  analyser.filtered[1] = [];
  analyser.validPixels[1] = 0;
  analyser.filtering(1, 0, segments.length, 100);
  return analyser;
}

test("centroid uses all area pixels and preserves fractional coordinates", () => {
  const points = [];
  for (let row = 5; row < 15; row++) {
    for (let column = 5; column < 15; column++) points.push([column, row]);
  }
  for (let column = 15; column < 35; column++) points.push([column, 5]);
  const analyser = filterSegments([createSegment(points)]);

  assert.equal(analyser.filtered[1].length, 1);
  assert.equal(analyser.filtered[1][0].centroid.x, 12);
  assert.equal(analyser.filtered[1][0].centroid.y, 8.75);
});

test("centroid adds crop margins exactly once", () => {
  const segment = createSegment([[5, 5], [6, 5], [5, 6], [6, 6]]);
  const analyser = filterSegments([segment], {}, { margin: { left: 10, top: 20 } });

  assert.equal(analyser.filtered[1][0].centroid.x, 15.5);
  assert.equal(analyser.filtered[1][0].centroid.y, 25.5);
});

function rectanglePoints(width, height) {
  const points = [];
  for (let row = 5; row < height + 5; row++) {
    for (let column = 5; column < width + 5; column++) points.push([column, row]);
  }
  return points;
}

test("principal axes give a 10x3 rectangle aspect ratio 0.3", () => {
  const analyser = filterSegments([createSegment(rectanglePoints(10, 3))], {
    min_aspect_ratio: 0.29,
    max_aspect_ratio: 0.31,
  });
  assert.equal(analyser.filtered[1].length, 1);
  const stats = analyser.filtered[1][0].stats;
  assert.ok(Math.abs(stats.aspectRatio - 0.3) < 1e-12);
  assert.equal(stats.majorAxisAngle, 0);
});

test("principal axes handle vertical rectangles, squares and single pixels", () => {
  for (const [width, height, expectedRatio, expectedAngle] of [[3, 10, 0.3, -90], [5, 5, 1, 0], [1, 1, 1, 0]]) {
    const analyser = filterSegments([createSegment(rectanglePoints(width, height))]);
    assert.equal(analyser.filtered[1].length, 1);
    const stats = analyser.filtered[1][0].stats;
    assert.ok(Math.abs(stats.aspectRatio - expectedRatio) < 1e-12);
    assert.equal(stats.majorAxisAngle, expectedAngle);
    assert.equal(Math.abs(stats.minorAxisAngle - stats.majorAxisAngle), 90);
  }
});

test("principal axes preserve oblique angles without integer rounding", () => {
  const points = [[5, 5], [6, 6], [7, 6], [8, 7], [9, 7], [10, 8]];
  const analyser = filterSegments([createSegment(points)]);
  assert.equal(analyser.filtered[1].length, 1);
  const stats = analyser.filtered[1][0].stats;
  assert.ok(stats.majorAxisAngle > -40 && stats.majorAxisAngle < -20);
  assert.notEqual(stats.majorAxisAngle, Math.round(stats.majorAxisAngle));
  assert.ok(stats.aspectRatio > 0 && stats.aspectRatio < 1);
});

function renderSegmentCase(mode, comparisonPoints = [], trainingPoints = []) {
  const analyser = filterSegments([createSegment(rectanglePoints(3, 3))], {
    render_mode: mode,
    render_color: "#ff0000",
    render_segment_color: "#00ff00",
  }, { comparisonPoints, trainingPoints });
  const pixels = new Uint8ClampedArray(50 * 40 * 4).fill(100);
  analyser.imgData = {
    ppl: { data: pixels.slice() },
    xpl: { data: pixels.slice() },
  };
  analyser.sourceImgData = { ppl: pixels.slice(), xpl: pixels.slice() };
  analyser.totalPixels = 50 * 40;
  analyser.rendering(1);
  return analyser;
}

test("render modes claim identical segment pixels before drawing", () => {
  const fill = renderSegmentCase("fill");
  const border = renderSegmentCase("only_border");
  assert.deepEqual(fill.imgDataMaskAll, border.imgDataMaskAll);
  assert.equal(fill.imgDataMaskAll.filter(Boolean).length, 9);
  assert.equal(border.imgData.ppl.data[(6 * 50 + 6) * 4], 100);
  assert.equal(fill.imgData.ppl.data[(6 * 50 + 6) * 4], 255);
});

test("render highlighting cannot leave the exclusion mask incomplete", () => {
  const analyser = renderSegmentCase("fill", [{ name: "test", x: 5, y: 5 }]);
  assert.equal(analyser.imgDataMaskAll.filter(Boolean).length, 9);
});

test("render colors never replace source colors used by comparison", () => {
  const analyser = renderSegmentCase("fill");
  analyser.imgDataMaskAll = [];
  analyser.imgDataMask = [];
  analyser.object.max_colors = 1;
  analyser.object.ppl_tolerance_1 = 0;
  analyser.object.xpl_tolerance_1 = 0;
  const target = analyser.rgb2lab({ r: 100, g: 100, b: 100 });
  analyser.pplColorTargetLab = [target];
  analyser.xplColorTargetLab = [target];
  analyser.comparison(1, 0, analyser.imgData.ppl.data.length, 100);

  assert.equal(analyser.imgDataMask.filter(Boolean).length, 50 * 40);
  assert.equal(analyser.sourceImgData.ppl[(5 * 50 + 5) * 4], 100);
});

test("start snapshots source pixels independently of rendering buffers", () => {
  const getImageData = () => ({ data: new Uint8ClampedArray(16).fill(100) });
  const analyser = createAnalyser({
    pplCroppedCanvas: { width: 2, height: 2 },
    xplCroppedCanvas: { width: 2, height: 2 },
    pplCroppedCtx: { getImageData },
    xplCroppedCtx: { getImageData },
    imgData: {},
    setObjectFromInputs() {},
  });
  analyser.start();
  analyser.imgData.ppl.data[0] = 255;
  analyser.imgData.xpl.data[0] = 0;
  assert.equal(analyser.sourceImgData.ppl[0], 100);
  assert.equal(analyser.sourceImgData.xpl[0], 100);
});

test("point comparison counts every matching point in fill and border modes", () => {
  const points = [{ name: "test", x: 5, y: 5 }, { name: "test", x: 7, y: 7 }, { name: "other", x: 6, y: 6 }];
  for (const mode of ["fill", "only_border"]) {
    const analyser = renderSegmentCase(mode, points);
    assert.equal(analyser.comparisonValidPoints[1].length, 2);
    assert.deepEqual(Array.from(analyser.comparisonValidPoints[1], (point) => Array.from(point)), [[5, 5], [7, 7]]);
    assert.equal(analyser.imgDataMaskAll.filter(Boolean).length, 9);
  }
});

test("training includes a segment only once even with multiple training points", () => {
  for (const mode of ["fill", "only_border"]) {
    const analyser = renderSegmentCase(mode, [], [{ x: 5, y: 5 }, { x: 7, y: 7 }]);
    assert.equal(analyser.filtered[1].length, 1);
    assert.equal(analyser.validPixels[1], 9);
    assert.equal(analyser.stats[1].area.mean, 9);
  }
});

test("training selection updates counts, masks and results before rendering", () => {
  const segments = [createSegment(rectanglePoints(3, 3)), createSegment([[20, 20], [21, 20]])];
  const analyser = filterSegments(segments, {}, { trainingPoints: [{ name: "test", x: 5, y: 5 }, { name: "other", x: 20, y: 20 }] });
  assert.equal(analyser.filtered[1].length, 1);
  assert.equal(analyser.validPixels[1], 9);
  assert.equal(analyser.imgDataMaskAll.filter(Boolean).length, 9);
});

test("training with no matching segment yields empty results instead of all segments", () => {
  const analyser = renderSegmentCase("fill", [{ name: "test", x: 5, y: 5 }], [{ name: "test", x: 20, y: 20 }]);
  assert.equal(analyser.filtered[1].length, 0);
  assert.equal(analyser.validPixels[1], 0);
  assert.equal(analyser.comparisonValidPoints[1].length, 0);
  assert.equal(analyser.imgDataMaskAll.filter(Boolean).length, 0);
  assert.deepEqual(Object.keys(analyser.stats[1]), []);
});