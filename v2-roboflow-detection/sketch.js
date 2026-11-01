let video;
let label = "waiting...";
let isModelLoaded = true;
let hasStarted = false;

// --- ROBOFLOW OBJECT DETECTION CONFIGURATION ---
const ROBOFLOW_API_KEY = 'YOUR_API_KEY_HERE';
const MODEL_ID = 'ecovision-dataset/1'; // project-slug/version

// Endpoint for Object Detection with lower confidence threshold
const INFERENCE_URL = `https://detect.roboflow.com/${MODEL_ID}?api_key=${ROBOFLOW_API_KEY}&confidence=20`;

// Buttons
let infoButton; 

// --- YOUR GOOGLE DRIVE LINKS ---
let plasticLink = "https://drive.google.com/file/d/1TY-8mN_-djEz5pU25IauzGvSxKa-yFTU/view?usp=sharing";
let paperLink = "https://drive.google.com/file/d/1jzKRv3i_qIt6S5Eh7dedGHkS0MzUyP2u/view?usp=sharing";

function setup() {
  let canvas = createCanvas(640, 520);
  canvas.elt.focus(); 
  
  video = createCapture(VIDEO);
  video.hide();

  infoButton = createButton('');
  infoButton.position(width / 2 - 100, height - 150); 
  infoButton.mousePressed(openContextualLink);
  infoButton.hide();
  styleButton(infoButton, '#ffcc00');
}

function openContextualLink() {
  if (label === "plastic") {
    window.open(plasticLink, '_blank');
  } else if (label === "paper/cardboard" || label === "paper") {
    window.open(paperLink, '_blank');
  }
}

function draw() {
  background(0);
  
  // Mirror webcam preview
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (!hasStarted) {
    drawWelcomeScreen();
  } else {
    drawResultsUI();
  }
}

function drawWelcomeScreen() {
  fill(0, 0, 0, 200); 
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  
  textSize(24);
  text("Thank you for using EcoVision Recycling Sorter!\nPlease put your item in front of the camera.", width / 2, height / 2 - 40);
  
  textSize(16);
  fill("#00FF00");
  text("Press ENTER to analyze", width / 2, height / 2 + 50);
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, (txt) => txt.toUpperCase());
}

function drawResultsUI() {
  fill(0, 0, 0, 150);
  rect(0, height - 60, width, 60);
  
  fill(255);
  textSize(40);
  textAlign(CENTER, CENTER);
  text(toTitleCase(label), width / 2, height - 30);

  let emoji = "";
  
  if (label == "glass" || label == "metal") {
    emoji = "♻️"; 
    infoButton.hide();
  } else if (label == "paper/cardboard" || label == "plastic" || label == "paper") {
    emoji = "⚠️"; 
    infoButton.html(`View ${toTitleCase(label)} Guide ↗`);
    infoButton.show();
  } else if (label == "organic waste" || label == "textiles" || label == "trash") {
    emoji = "❌"; 
    infoButton.hide();
  } else {
    emoji = "🔍"; 
    infoButton.hide();
  }

  textSize(200);
  text(emoji, width / 2, height / 2);
}

function keyPressed() {
  if (keyCode === ENTER) {
    runClassification();
  }
}

function mousePressed() {
  if (mouseY < height - 150 && mouseX > 0 && mouseX < width) {
    runClassification();
  }
}

// --- CALLING ROBOFLOW OBJECT DETECTION API ---
async function runClassification() {
  hasStarted = true;
  label = "analyzing..."; 

  // 1. Get raw base64 data URL from p5 canvas
  let canvasElement = document.querySelector('canvas');
  let fullBase64 = canvasElement.toDataURL('image/jpeg', 0.8);

  // 2. Strip off metadata header
  let cleanBase64 = fullBase64.split(',')[1];

  try {
    const response = await fetch(INFERENCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: cleanBase64
    });

    if (!response.ok) {
      throw new Error(`HTTP Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Roboflow Detection Output:", result);

    extractLabelFromResult(result);

  } catch (error) {
    console.error("Inference Connection Error:", error);
    label = "connection error";
  }
}

// Extract predicted category from object detection bounding box output
function extractLabelFromResult(result) {
  if (!result || !result.predictions) {
    label = "no item detected";
    return;
  }

  // Check if any bounding box predictions were found
  if (Array.isArray(result.predictions) && result.predictions.length > 0) {
    // Sort predictions by highest confidence score
    result.predictions.sort((a, b) => b.confidence - a.confidence);
    
    // Grab the class label of the highest-confidence bounding box
    let topPrediction = result.predictions[0];
    label = (topPrediction.class || topPrediction.label || "unknown").toLowerCase();
  } else {
    label = "no item detected";
  }
}

function styleButton(btn, col) {
  btn.style('padding', '12px 24px');
  btn.style('width', '200px');
  btn.style('background-color', col);
  btn.style('border', 'none');
  btn.style('border-radius', '8px');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
}