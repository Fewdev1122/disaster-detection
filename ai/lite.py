import tensorflow as tf

MODEL_PATH = "model/final_disaster_model.keras"
OUTPUT_PATH = "model/disaster_model.tflite"

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


print("Loading model...")
model = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={"WeightedCategoricalFocalLoss": WeightedCategoricalFocalLoss},
    compile=False
)

print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# สำคัญ: อย่าเพิ่งเปิด optimize ก่อน
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS,
    tf.lite.OpsSet.SELECT_TF_OPS,
]

tflite_model = converter.convert()

with open(OUTPUT_PATH, "wb") as f:
    f.write(tflite_model)

print(f"Saved TFLite model to: {OUTPUT_PATH}")