let video;
let featureExtractor;
let classifier;

// State management: "CLASSIFY" or "TRAIN"
let appMode = "CLASSIFY";

// Predictions & Model status
let label = "waiting...";
let isModelReady = false;
let isTrained = false;

// 5 Categories
const categories = ["plastic", "paper", "textiles", "metal", "unknown"];
let sampleCounts = { plastic: 0, paper: 0, textiles: 0, metal: 0, unknown: 0 };

// Minimum samples required per category before training
const MIN_SAMPLES_PER_CLASS = 5;

// UI Elements
let modeToggleButton;
let infoButton;
let trainingButtons = [];
let modelFileInput;   // hidden <input type="file"> used by Load Model
let statusMsg = "";   // feedback shown in Trainer Mode (save/load results)

// Guide Links
let plasticLink = "https://drive.google.com/file/d/1TY-8mN_-djEz5pU25IauzGvSxKa-yFTU/view?usp=sharing";
let paperLink = "https://drive.google.com/file/d/1jzKRv3i_qIt6S5Eh7dedGHkS0MzUyP2u/view?usp=sharing";

function setup() {
  let canvas = createCanvas(480, 360);
  canvas.elt.focus();

  // Initialize webcam feed
  video = createCapture(VIDEO);
  video.size(480, 360);
  video.hide();

  initClassifier();
  setupUI();
}

function initClassifier() {
  // FIX: ml5's featureExtractor defaults to numLabels: 2, which is why only
  // the first two classes you trained were ever predicted.
  const options = {
    numLabels: categories.length, // 5 classes
    epochs: 30,                   // a bit more training helps with 5 classes
  };
  featureExtractor = ml5.featureExtractor('MobileNet', options, modelReady);
}

function modelReady() {
  console.log('MobileNet Loaded!');
  classifier = featureExtractor.classification(video, () => {
    console.log('Classifier Ready!');
    isModelReady = true;
  });
}

function draw() {
  background(0);

  // Mirrored video feed
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (appMode === "CLASSIFY") {
    drawClassifierMode();
  } else if (appMode === "TRAIN") {
    drawTrainerMode();
  }
}

// ------------------------------------------------------------------
// MODE 1: CLASSIFIER UI
// ------------------------------------------------------------------
function drawClassifierMode() {
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, height - 70, width, 70);

  fill(255);
  textAlign(CENTER, CENTER);

  if (!isTrained) {
    textSize(13);
    fill("#FFCC00");
    text("Model not trained yet!\nClick '⚙️ Trainer Mode' top-right to add samples or load a model.", width / 2, height - 35);
    infoButton.hide();
    return;
  }

  if (label === "analyzing...") {
    textSize(20);
    fill("#00FFFF");
    text("Analyzing item...", width / 2, height - 35);
    textSize(80);
    text("⏳", width / 2, height / 2 - 10);
    infoButton.hide();
    return;
  }

  if (label === "unknown / low confidence") {
    textSize(18);
    fill("#FF3333");
    text("Unrecognized Item - Try Again", width / 2, height - 48);
    textSize(12);
    fill(200);
    text("Hold object closer to camera & away from background noise", width / 2, height - 20);

    textSize(90);
    text("❓", width / 2, height / 2 - 10);
    infoButton.hide();
    return;
  }

  if (label === "ready") {
    textSize(14);
    fill("#00FF00");
    text("Place object close to camera to avoid background noise,\nthen click mouse or press ENTER to classify", width / 2, height - 35);
    textSize(80);
    text("📷", width / 2, height / 2 - 10);
    infoButton.hide();
    return;
  }

  // Display Classification Label
  textSize(22);
  fill(255);
  text(toTitleCase(label), width / 2, height - 48);

  // Instruction subtext
  textSize(12);
  fill(200);
  text("Click mouse or press ENTER to classify again", width / 2, height - 20);

  let emoji = "";
  if (label === "metal") {
    emoji = "♻️";
    infoButton.hide();
  } else if (label === "paper" || label === "plastic") {
    emoji = "📋";
    infoButton.html(`Guide ↗`);
    infoButton.show();
  } else if (label === "textiles") {
    emoji = "👕";
    infoButton.hide();
  } else if (label === "unknown") {
    emoji = "❓";
    infoButton.hide();
  } else {
    emoji = "🔍";
    infoButton.hide();
  }

  textSize(100);
  text(emoji, width / 2, height / 2 - 10);
}

// ------------------------------------------------------------------
// MODE 2: TRAINER UI
// ------------------------------------------------------------------
function drawTrainerMode() {
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(18);
  fill("#FFCC00");
  text("EcoVision AI - Trainer Mode", width / 2, 25);

  textSize(12);
  fill(220);
  text("Add 10-15 samples for EACH category before clicking Train.\nRotate object while capturing.", width / 2, 52);

  // Sample counts HUD
  let yStart = 90;
  textAlign(LEFT, CENTER);
  textSize(14);
  fill(255);
  text(`• Plastic Samples:  ${sampleCounts.plastic}`, 30, yStart);
  text(`• Paper Samples:    ${sampleCounts.paper}`, 30, yStart + 22);
  text(`• Textiles Samples: ${sampleCounts.textiles}`, 30, yStart + 44);
  text(`• Metal Samples:    ${sampleCounts.metal}`, 30, yStart + 66);
  text(`• Unknown Samples:  ${sampleCounts.unknown}`, 30, yStart + 88);

  // Status message
  textAlign(CENTER, CENTER);
  textSize(14);
  if (!isModelReady) {
    fill("#FFCC00");
    text("Loading MobileNet...", width / 2, height - 90);
  } else if (label === "Training in progress...") {
    fill("#00FFFF");
    text("⏳ Training model across all classes...", width / 2, height - 90);
  } else if (isTrained) {
    fill("#00FF00");
    text("✅ Model ready! Switch back to Classifier Mode.", width / 2, height - 90);
  }

  // Save / load feedback
  if (statusMsg) {
    textSize(12);
    fill(255);
    text(statusMsg, width / 2, height - 60);
  }
}

// ------------------------------------------------------------------
// MANUAL TRIGGER CLASSIFICATION
// ------------------------------------------------------------------
function keyPressed() {
  if (keyCode === ENTER && appMode === "CLASSIFY" && isTrained) {
    runSingleClassification();
  }
}

function mousePressed(event) {
  // Ignore clicks on HTML buttons (Trainer Mode toggle, Guide button, etc.)
  if (event && event.target && event.target.tagName === 'BUTTON') return;

  if (appMode === "CLASSIFY" && isTrained && mouseY < height - 70 && mouseY > 0) {
    runSingleClassification();
  }
}

function runSingleClassification() {
  label = "analyzing...";
  classifier.classify(gotResults);
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    label = "ready";
    return;
  }

  if (results && results.length > 0) {
    let topResult = results[0];

    console.log("Results across categories:", results.map(r => `${r.label}: ${(r.confidence * 100).toFixed(1)}%`).join(" | "));

    if (topResult.confidence < 0.25 || topResult.label === "unknown") {
      label = "unknown / low confidence";

      setTimeout(() => {
        if (label === "unknown / low confidence") {
          label = "ready";
        }
      }, 2000);
    } else {
      label = topResult.label;
    }
  } else {
    label = "ready";
  }
}

// ------------------------------------------------------------------
// TRAINING, LOADING, & RESET LOGIC
// ------------------------------------------------------------------
function addSample(customClass) {
  if (!isModelReady) return;

  classifier.addImage(customClass);
  sampleCounts[customClass]++;
}

function trainModel() {
  if (!isModelReady) return;

  // Ensure every category has enough samples before training
  let missing = categories.filter(cat => sampleCounts[cat] < MIN_SAMPLES_PER_CLASS);
  if (missing.length > 0) {
    alert(`Please add at least ${MIN_SAMPLES_PER_CLASS} images for ALL categories before training. Need more: ${missing.join(', ')}`);
    return;
  }

  label = "Training in progress...";
  statusMsg = "";

  classifier.train((lossValue) => {
    if (lossValue === null) {
      console.log('Training Complete across all 5 classes!');
      isTrained = true;
      label = "ready";
    } else {
      console.log(`Loss: ${lossValue}`);
    }
  });
}

// SAVE: downloads two files, model.json and model.weights.bin.
// Keep them together; you need BOTH to load the model later.
function saveModel() {
  if (!isTrained) {
    alert("There's no trained model to save yet. Train (or load) a model first.");
    return;
  }
  statusMsg = "💾 Saving...";
  Promise.resolve(
    classifier.save(() => {
      console.log("Model saved!");
      statusMsg = "💾 Saved! Check Downloads for model.json + model.weights.bin";
    }, 'model')
  ).catch((err) => {
    console.error(err);
    statusMsg = "❌ Save failed. See console for details.";
  });
}

// LOAD step 1: open a file picker (classifier.load needs actual files or a URL)
function openModelPicker() {
  if (!isModelReady) {
    alert("MobileNet is still loading. Try again in a few seconds.");
    return;
  }
  modelFileInput.value = ""; // lets you pick the same files again
  modelFileInput.click();
}

// LOAD step 2: pass the selected files to ml5
function handleModelFiles() {
  const files = modelFileInput.files;
  const names = Array.from(files).map(f => f.name);
  const hasJson = names.some(n => n.endsWith('.json'));
  const hasWeights = names.some(n => n.endsWith('.bin'));

  if (!hasJson || !hasWeights) {
    alert("Select BOTH files at once: model.json AND model.weights.bin\n(hold Ctrl or Cmd to select multiple files).");
    return;
  }

  statusMsg = "📂 Loading model...";

  // NOTE: when loading from files (not a URL), ml5 never calls the load
  // callback, so we wait on the promise that load() returns instead.
  Promise.resolve(classifier.load(files))
    .then(() => {
      console.log("Pre-trained model loaded successfully!");
      isTrained = true;
      label = "ready";
      statusMsg = "📂 Model loaded! Switch back to Classifier Mode.";
    })
    .catch((err) => {
      console.error(err);
      statusMsg = "❌ Load failed. Check the files are named model.json and model.weights.bin";
    });
}

function resetModel() {
  isTrained = false;
  isModelReady = false;
  label = "waiting...";
  statusMsg = "";
  sampleCounts = { plastic: 0, paper: 0, textiles: 0, metal: 0, unknown: 0 };

  initClassifier();
  console.log("Model wiped and re-initialized!");
}

// ------------------------------------------------------------------
// UI TOGGLE & DOM CONTROLS
// ------------------------------------------------------------------
function toggleAppMode() {
  if (appMode === "CLASSIFY") {
    appMode = "TRAIN";
    modeToggleButton.html("🏠 Classifier Mode");
    infoButton.hide();
    showTrainingControls(true);
  } else {
    appMode = "CLASSIFY";
    modeToggleButton.html("⚙️ Trainer Mode");
    showTrainingControls(false);
  }
}

function showTrainingControls(visible) {
  for (let btn of trainingButtons) {
    if (visible) btn.show();
    else btn.hide();
  }
}

function openContextualLink() {
  if (label === "plastic") {
    window.open(plasticLink, '_blank');
  } else if (label === "paper") {
    window.open(paperLink, '_blank');
  }
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, (txt) => txt.toUpperCase());
}

function setupUI() {
  modeToggleButton = createButton("⚙️ Trainer Mode");
  modeToggleButton.position(340, 10);
  modeToggleButton.style('padding', '6px 10px');
  modeToggleButton.style('background-color', '#333');
  modeToggleButton.style('color', '#fff');
  modeToggleButton.style('border', '1px solid #666');
  modeToggleButton.style('border-radius', '6px');
  modeToggleButton.style('cursor', 'pointer');
  modeToggleButton.mousePressed(toggleAppMode);

  let yRow1 = height + 10;
  let yRow2 = height + 42;

  let btnPlastic  = createButton('+ Plastic').position(10, yRow1).mousePressed(() => addSample('plastic'));
  let btnPaper    = createButton('+ Paper').position(80, yRow1).mousePressed(() => addSample('paper'));
  let btnTextiles = createButton('+ Textiles').position(146, yRow1).mousePressed(() => addSample('textiles'));
  let btnMetal    = createButton('+ Metal').position(221, yRow1).mousePressed(() => addSample('metal'));
  let btnUnknown  = createButton('+ Unknown').position(284, yRow1).mousePressed(() => addSample('unknown'));

  let btnTrain = createButton('⚡ Train').position(10, yRow2);
  btnTrain.style('background-color', '#ffcc00');
  btnTrain.mousePressed(trainModel);

  let btnLoad = createButton('📂 Load Model').position(80, yRow2);
  btnLoad.style('background-color', '#4CAF50');
  btnLoad.style('color', '#fff');
  btnLoad.mousePressed(openModelPicker);

  let btnSave = createButton('💾 Save Model').position(190, yRow2);
  btnSave.mousePressed(saveModel);

  // Hidden file input used by the Load button
  modelFileInput = document.createElement('input');
  modelFileInput.type = 'file';
  modelFileInput.multiple = true;
  modelFileInput.accept = '.json,.bin';
  modelFileInput.style.display = 'none';
  modelFileInput.addEventListener('change', handleModelFiles);
  document.body.appendChild(modelFileInput);

  let btnReset = createButton('🔄 Reset').position(300, yRow2);
  btnReset.style('background-color', '#ff4444');
  btnReset.style('color', '#fff');
  btnReset.mousePressed(resetModel);

  trainingButtons = [btnPlastic, btnPaper, btnTextiles, btnMetal, btnUnknown, btnTrain, btnLoad, btnSave, btnReset];
  showTrainingControls(false);

  infoButton = createButton('');
  infoButton.position(width / 2 - 60, height - 110);
  infoButton.mousePressed(openContextualLink);
  infoButton.hide();
  styleButton(infoButton, '#ffcc00');
}

function styleButton(btn, col) {
  btn.style('padding', '6px 12px');
  btn.style('width', '120px');
  btn.style('background-color', col);
  btn.style('border', 'none');
  btn.style('border-radius', '6px');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
  btn.style('font-size', '13px');
}