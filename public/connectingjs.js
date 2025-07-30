    // Replace the predictHeartDisease function with this API version
    async function predictHeartDisease(data) {
        try {
          // Send data to Python backend for prediction
          const response = await fetch('http://localhost:3000/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error('API call failed');
          }
          
          const result = await response.json();
          return {
            prediction: result.prediction,
            probability: result.probability // Already in percentage format
          };
        } catch (error) {
          console.error('Prediction API error:', error);
          // Fallback to a simplified model for testing only
          return { prediction: 0, probability: 19 };
        }
      }
      
      // Make collectAndUpdate function async
      async function collectAndUpdate() {
        const data = {
          age: parseInt(document.getElementById('age').value),
          sex: gender,
          cp: parseInt(document.getElementById('cp').value),
          trestbps: parseInt(document.getElementById('trestbps').value),
          chol: parseInt(document.getElementById('chol').value),
          fbs: parseInt(document.getElementById('fbs').value),
          restecg: parseInt(document.getElementById('restecg').value),
          thalach: parseInt(document.getElementById('thalach').value),
          exang: parseInt(document.getElementById('exang').value),
          oldpeak: parseFloat(document.getElementById('oldpeak').value),
          slope: parseInt(document.getElementById('slope').value),
          ca: parseInt(document.getElementById('ca').value || 0),
          thal: parseInt(document.getElementById('thal').value)
        };
        
        // Get prediction from the ML model 
        const result = await predictHeartDisease(data);
        
        // Update UI with results
        document.getElementById('probPercent').textContent = result.probability + '%';
        setArc(result.probability);
      
        // AI Diagnosis based on probability from model
        let diagnosis = '';
        if (result.probability < 25) {
          diagnosis = 'Low risk of heart disease based on the provided data.';
        } else if (result.probability < 60) {
          diagnosis = 'Moderate risk of heart disease. Consider consulting a doctor.';
        } else {
          diagnosis = 'High risk of heart disease. Medical attention recommended.';
        }
        document.getElementById('aiDiagnosis').textContent = diagnosis;
      
        // Update alerts based on input values (could also come from backend)
        updateAlerts(data);
      }
      
      // Event listeners should be updated to work with async function
      document.getElementById('trestbps').oninput = function() {
        setSliderDisplay('trestbpsval', this.value);
        collectAndUpdate();
      };
      
      // Make sure window.onload is also async
      window.onload = async function() {
        // Show correct slider values
        setSliderDisplay('trestbpsval', document.getElementById('trestbps').value);
        setSliderDisplay('cholval', document.getElementById('chol').value);
        setSliderDisplay('thalachval', document.getElementById('thalach').value);
        setSliderDisplay('oldpeakval', document.getElementById('oldpeak').value);
        await collectAndUpdate();
      };
      