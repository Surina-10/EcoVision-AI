let video;
let label = "waiting...";
let classifier;
let modelURL = 'https://teachablemachine.withgoogle.com/models/FJqUMAYIY/model.json';

let isModelLoaded = false;
let hasStarted = false;

// Buttons
let infoButton; 

// --- YOUR GOOGLE DRIVE LINKS ---
let plasticLink = "https://drive.google.com/file/d/1TY-8mN_-djEz5pU25IauzGvSxKa-yFTU/view?usp=sharing";
let paperLink = "https://drive.google.com/file/d/1jzKRv3i_qIt6S5Eh7dedGHkS0MzUyP2u/view?usp=sharing";

function preload() {
  classifier = ml5.imageClassifier(modelURL, modelReady);
}

function modelReady() {
  isModelLoaded = true;
}

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
  } else if (label === "paper/cardboard") {
    window.open(paperLink, '_blank');
  }
}

function draw() {
  background(0);
  
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (!hasStarted) {
    drawWelcomeScreen();
  } 
  else {
    drawResultsUI();
  }
}

function drawWelcomeScreen() {
    fill(0, 0, 0, 200); 
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    
    textSize(24);
    text("Thank you for using the Recycling Sorter!\nPlease put your item in front of the camera.", width / 2, height / 2 - 40);
    
    textSize(16);
    let msg = isModelLoaded ? "Press ENTER to analyze" : "Loading AI System...";
    fill(isModelLoaded ? "#00FF00" : "#FFCC00");
    text(msg, width / 2, height / 2 + 50);
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
    
    // UPDATED LOGIC FOR X vs WARNING
    if (label == "glass" || label == "metal") {
      emoji = "♻️"; // Definitely Recyclable
      infoButton.hide();
    } else if (label == "paper/cardboard" || label == "plastic") {
      emoji = "⚠️"; // Warning: Needs more info (PDF guides)
      infoButton.html(`View ${toTitleCase(label)} Guide ↗`);
      infoButton.show();
    } else if (label == "organic waste" || label == "textiles") {
      emoji = "❌"; // Not for standard blue bin
      infoButton.hide();
    } else {
      emoji = "🔍"; 
      infoButton.hide();
    }

    textSize(200);
    text(emoji, width / 2, height / 2);
}

function keyPressed() {
  if (keyCode === ENTER && isModelLoaded) {
    runClassification();
  }
}

function mousePressed() {
  if (isModelLoaded && mouseY < height - 150) {
    runClassification();
  }
}

function runClassification() {
    hasStarted = true;
    label = "analyzing..."; 
    classifier.classify(video, gotResults);
}

function gotResults(error, results) {
  if (error) return;
  label = results[0].label.toLowerCase();
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