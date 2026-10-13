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