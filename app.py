import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS 

MODEL_PATH = 'model.pkl'

EXPECTED_FEATURES = [
    'age', 'sex', 'cp', 'trestbps', 'chol',
    'fbs', 'restecg', 'thalach', 'exang',
    'oldpeak', 'slope', 'ca', 'thal'
]

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print(f"Model '{MODEL_PATH}' loaded successfully.")
except FileNotFoundError:
    print(f"Error: Model file '{MODEL_PATH}' not found.")
    exit() 
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    """Receives patient data, predicts heart disease, returns JSON."""
    try:
        data = request.get_json()
        print(f"Received data: {data}") 

        missing_features = [f for f in EXPECTED_FEATURES if f not in data]
        if missing_features:
            return jsonify({"error": f"Missing features: {', '.join(missing_features)}"}), 400

        try:
            feature_values = [float(data[feature]) for feature in EXPECTED_FEATURES]
        except (ValueError, TypeError) as e:
             return jsonify({"error": f"Invalid data type for features. Expected numbers. Error: {e}"}), 400

        features_array = np.array([feature_values])
        print(f"Features array for model: {features_array}") # Log data sent to model

        prediction = model.predict(features_array) # Get 0 or 1
        probability = None
        if hasattr(model, "predict_proba"):
             probability_all_classes = model.predict_proba(features_array)
             probability = probability_all_classes[0][1] * 100 # Convert to percentage
             print(f"Prediction Probabilities: {probability_all_classes}, Selected: {probability}%")
        else:
             print("Model does not support predict_proba.")


        result = {
            'prediction': int(prediction[0]),
            'probability': float(f'{probability:.2f}') if probability is not None else None
        }
        print(f"Sending result: {result}") 

        return jsonify(result)

    except Exception as e:
        print(f"Error during prediction: {e}") 
        return jsonify({"error": "An error occurred during prediction."}), 500

# --- Run the App ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)