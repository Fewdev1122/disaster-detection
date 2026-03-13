import os
import tensorflow as tf
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify

MODEL_PATH = "model/final_disaster_model.keras"
IMG_SIZE = (224, 224)
CLASS_NAMES = ['dust', 'fire', 'flood', 'fog', 'normal', 'smoke']

CONFIDENCE_THRESHOLD = 60.0
MARGIN_THRESHOLD = 15.0


class WeightedCategoricalFocalLoss(tf.keras.losses.Loss):
    def __init__(
        self,
        class_weights=None,
        gamma=2.0,
        from_logits=False,
        reduction="sum_over_batch_size",
        name="weighted_categorical_focal_loss"
    ):
        super().__init__(reduction=reduction, name=name)
        self.gamma = gamma
        self.from_logits = from_logits
        self.class_weights = class_weights

        self.class_weights_tensor = None
        if class_weights is not None:
            if isinstance(class_weights, dict):
                weights = [class_weights[i] for i in range(len(class_weights))]
            else:
                weights = class_weights
            self.class_weights_tensor = tf.constant(weights, dtype=tf.float32)

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)

        if self.from_logits:
            y_pred = tf.nn.softmax(y_pred, axis=-1)

        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        ce = -y_true * tf.math.log(y_pred)
        focal = tf.pow(1.0 - y_pred, self.gamma) * ce

        if self.class_weights_tensor is not None:
            focal = focal * self.class_weights_tensor

        return tf.reduce_sum(focal, axis=-1)

    def get_config(self):
        config = super().get_config()
        config.update({
            "class_weights": self.class_weights,
            "gamma": self.gamma,
            "from_logits": self.from_logits,
        })
        return config


model = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={"WeightedCategoricalFocalLoss": WeightedCategoricalFocalLoss},
    compile=False
)

app = Flask(__name__)


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
    predictions = model.predict(img_array, verbose=0)[0]

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
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)