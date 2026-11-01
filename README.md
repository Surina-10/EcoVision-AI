# EcoVision AI ♻️

A webcam-based recycling classifier that runs entirely in the browser. Hold an item up to the camera and EcoVision AI identifies whether it's **plastic, paper, textiles, or metal**, then links to a disposal guide for that material.

Built with **p5.js** and **ml5.js**, using transfer learning on top of the pre-trained MobileNet image model.

## Why I built this

I noticed that people around me, including my own family, often hesitated in front of the recycling bins, unsure whether something like a coated paper cup or an old T-shirt belonged in recycling, trash, or somewhere else entirely. When things end up in the wrong bin, they can contaminate a whole batch of recyclables. I wanted to build a tool that takes the guesswork out of sorting: point a camera at an item, get an answer, and learn how to dispose of it properly. It was also my first chance to apply machine learning to a real problem I could see every day.

## Features

- **Two modes in one app.** *Classifier Mode* for everyday use and *Trainer Mode* for teaching the model new examples.
- **Train your own model in the browser.** Capture webcam samples for each of the 5 categories (plastic, paper, textiles, metal, unknown) and train with one click. No server or GPU needed.
- **"Unknown" class and confidence threshold.** Predictions below 25% confidence, or anything matching the "unknown" class, are rejected with a prompt to try again instead of producing a wrong guess.
- **Save and load trained models.** Export the model as `model.json` + `model.weights.bin` and reload it later without retraining.
- **Contextual recycling guides.** When an item is identified as plastic or paper, a Guide button opens a reference document on how to dispose of it.
- **Input validation.** Training is blocked until every category has at least 5 samples, so the model is never trained on lopsided data.

## How it works

1. **Feature extraction:** MobileNet, a neural network pre-trained on millions of images, converts each webcam frame into a set of numerical features.
2. **Transfer learning:** Instead of training a network from scratch, a small classification layer is trained on top of those features using the samples I captured for each material.
3. **Classification:** When you click or press Enter, the current frame is passed through the model and the top prediction is shown with a matching icon.

## Tech stack

- [p5.js](https://p5js.org/) for the canvas, webcam capture, and UI
- [ml5.js](https://ml5js.org/) v0.12.2 for MobileNet feature extraction and transfer learning
- JavaScript, HTML, CSS

## Project structure

- `index.html` loads p5.js and ml5.js (v0.12.2) from a CDN and runs the sketch
- `sketch.js` contains all the app logic: webcam capture, training, classification, and the UI
- `style.css` handles basic page styling
- `versions/` holds earlier versions of the project (see Development history below)

## Running it

**Easiest:** open the project in the [p5.js Web Editor](https://editor.p5js.org/) [add your sketch link here] and click Play. Allow camera access when asked.

**Locally:** clone this repo and serve the folder with a local server (webcam access requires `localhost` or HTTPS), for example:

```bash
python -m http.server
```

Then open `http://localhost:8000`.

## Using the app

1. Click **⚙️ Trainer Mode** in the top-right.
2. Hold up an item and click **+ Plastic**, **+ Paper**, etc. to add samples. Aim for 10–15 per category and rotate the object between captures.
3. Click **⚡ Train** and wait for the confirmation.
4. Optionally click **💾 Save Model** to download your trained model, or **📂 Load Model** to use one you saved earlier.
5. Switch back to **🏠 Classifier Mode**, hold an item close to the camera, and click or press Enter.

## Development history

EcoVision AI went through three versions, each using a different approach to machine learning. Earlier versions are in the [`versions`](versions/) folder.

- **[v1: Teachable Machine](versions/v1-teachable-machine/)**: My first version used an image classification model I trained in Google's Teachable Machine and loaded into p5.js with ml5. It sorted items into categories like glass, metal, plastic, paper/cardboard, organic waste, and textiles, and showed whether each was recyclable (♻️), needed checking (⚠️), or didn't belong in the blue bin (❌). It worked, but its accuracy was limited by the small number of training images I could collect myself.

- **[v2: Roboflow object detection]([versions/v2-roboflow-detection/](https://github.com/Surina-10/EcoVision-AI/tree/main/versions/v2-robotflow-detection))**: To improve accuracy, I switched to an object detection model trained on a larger public waste dataset, hosted on Roboflow. Each webcam frame was sent to Roboflow's API, and the app picked the highest-confidence detection. This taught me how to work with web APIs, send images as base64 data, and handle network errors. However, it depended on an internet connection and an external service, and I couldn't easily retrain it for the items people around me actually throw away.

- **Current version: in-browser training**: The version in the main folder brings everything back into the browser. Using ml5's feature extractor with MobileNet, anyone can train the model on their own items in a few minutes, save it, and reload it later, with no external service needed. I also added an "unknown" class and a confidence threshold so the app admits when it isn't sure.

## Challenges and what I learned

- **Only two categories ever showed up.** After training on all five materials, the model kept predicting just plastic or paper, no matter what I held up. I eventually found that ml5's feature extractor defaults to only 2 output labels. Setting `numLabels` to match my 5 categories fixed it. This taught me to read library documentation closely instead of assuming the defaults fit my project.

- **Loading a saved model silently did nothing.** My Load button would open the file picker, but the app never confirmed the model was ready. I figured out that when loading from files instead of a URL, ml5 never calls the callback function, so my code was waiting for something that would never happen. Switching to the promise that `load()` returns solved it.

- **The model guessed confidently even when it was wrong.** Early on, holding up something random (like my hand) still got labeled as one of the materials. I added an "unknown" training category and a 25% confidence threshold, so the app now admits when it isn't sure instead of giving a wrong answer. For a recycling tool, a wrong answer is worse than no answer.

- **Background and lighting affected accuracy.** Items held far from the camera were often misclassified because the model was picking up the room behind them. I added on-screen instructions to hold objects close, and learned to vary angles while capturing training samples so the model focuses on the object itself.

- **Clicking buttons accidentally triggered a classification.** Since classification runs on any mouse click, pressing the Trainer Mode or Guide buttons also made the app classify. I fixed this by checking whether the click came from an HTML button and ignoring it if so.

## Future improvements

- Add more categories, such as glass and compost, which earlier versions supported
- Build a larger, more varied training dataset to improve accuracy in different lighting
- Add disposal guides for every material, not just plastic and paper
- Make the layout mobile-friendly so it can be used on a phone at the bin
