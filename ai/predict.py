import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
import tensorflow as tf

MODEL_PATH = "model/disaster_model.tflite"
IMG_SIZE = (224, 224)
CLASS_NAMES = ['dust', 'fire', 'flood', 'fog', 'normal', 'smoke']

CONFIDENCE_THRESHOLD = 60.0

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

print("Loading TFLite model...")
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("TFLite model loaded")


def preprocess_image(image: Image.Image):
    image = image.convert("RGB")
    image = image.resize(IMG_SIZE)

    img_array = np.array(image, dtype=np.float32)
    img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


@app.get("/")
def home():
    return "ai server ok"


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "image is required"}), 400

    file = request.files["image"]
    image = Image.open(file.stream).convert("RGB")

    img_array = preprocess_image(image)

    interpreter.set_tensor(input_details[0]["index"], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]["index"])[0]

    sorted_indices = np.argsort(predictions)[::-1]
    top1_idx = int(sorted_indices[0])
    top2_idx = int(sorted_indices[1])

    top1_class = CLASS_NAMES[top1_idx]
    top2_class = CLASS_NAMES[top2_idx]

    top1_conf = float(predictions[top1_idx] * 100)
    top2_conf = float(predictions[top2_idx] * 100)
    margin = top1_conf - top2_conf

    if top1_conf < CONFIDENCE_THRESHOLD:
        final_class = "normal"
        final_conf = top1_conf
        note = f"confidence below {CONFIDENCE_THRESHOLD:.0f}%, fallback to normal"
    else:
        final_class = top1_class
        final_conf = top1_conf
        note = None

    probs = {CLASS_NAMES[i]: float(predictions[i]) for i in range(len(CLASS_NAMES))}

    return jsonify({
        "class": final_class,
        "confidence": final_conf / 100.0,
        "top1_class": top1_class,
        "top1_confidence": top1_conf / 100.0,
        "top2_class": top2_class,
        "top2_confidence": top2_conf / 100.0,
        "margin": margin / 100.0,
        "note": note,
        "probs": probs
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)