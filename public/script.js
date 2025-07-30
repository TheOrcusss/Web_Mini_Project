// --- Configuration ---
const backendUrl = 'http://127.0.0.1:5000/predict'; // Adjust if your backend runs elsewhere

// --- DOM Element Selection ---
const form = document.getElementById('prediction-form');
const formErrorMessage = document.getElementById('form-error-message');

// Gender Buttons
const genderButtons = document.querySelectorAll('.gender-btn');
const hiddenGenderInput = document.getElementById('sex');

// Sliders and Value Displays
const sliders = {
    trestbps: { input: document.getElementById('trestbps'), display: document.getElementById('trestbps-val') },
    chol:     { input: document.getElementById('chol'),     display: document.getElementById('chol-val') },
    thalach:  { input: document.getElementById('thalach'),  display: document.getElementById('thalach-val') },
    oldpeak:  { input: document.getElementById('oldpeak'),  display: document.getElementById('oldpeak-val') },
};

// Results Area Elements
const probabilityText = document.getElementById('probability-text');
const probabilityArcPath = document.getElementById('probability-arc-path');
const aiDiagnosis = document.getElementById('ai-diagnosis');
const alertCard = document.getElementById('alert-card');
const alertIcon = document.getElementById('alert-icon');
const alertTitle = document.getElementById('alert-title');
const alertDesc = document.getElementById('alert-desc');

// --- Helper Functions ---

// Function to update slider value display
function updateSliderDisplay(sliderId) {
    if (sliders[sliderId]) {
        sliders[sliderId].display.textContent = sliders[sliderId].input.value;
    }
}

// Function to calculate SVG arc path
function calculateArcPath(percentage, radius, centerX = 70, centerY = 70) {
    // Clamp percentage between 0 and 99.99 to avoid full circle rendering issues
    const p = Math.min(Math.max(percentage, 0), 99.999);
    const angle = (p / 100) * 360;
    const radians = (angle - 90) * Math.PI / 180; // Adjust start angle to top
    const endX = centerX + radius * Math.cos(radians);
    const endY = centerY + radius * Math.sin(radians);
    const largeArcFlag = angle > 180 ? 1 : 0;

    // Path definition: M = move to start, A = arc command
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    const d = `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    return d;
}

// Function to update the results display
function updateResultsUI(result) {
    // 1. Update Probability Arc and Text
    const probability = result.probability !== null && !isNaN(result.probability) ? result.probability : 0;
    probabilityText.textContent = `${probability.toFixed(1)}%`; // Show one decimal place
    const arcD = calculateArcPath(probability, 60); // 60 is the radius used in the SVG
    probabilityArcPath.setAttribute('d', arcD);
    // Change arc color based on probability (optional)
    if (probability > 75) probabilityArcPath.style.stroke = '#ff5757'; // High risk color
    else if (probability > 50) probabilityArcPath.style.stroke = '#ffcc00'; // Medium risk color
    else probabilityArcPath.style.stroke = '#5be4e4'; // Low risk color


    // 2. Update AI Diagnosis Text
    if (result.prediction === 1) {
        aiDiagnosis.textContent = `High Risk (${probability.toFixed(1)}%)`;
    } else if (result.prediction === 0) {
        aiDiagnosis.textContent = `Low Risk (${probability.toFixed(1)}%)`;
    } else {
         aiDiagnosis.textContent = "Awaiting valid prediction"; // Handle potential null prediction
    }


    // 3. Update Alert Card
    alertCard.classList.remove('initial', 'normal', 'high'); // Remove existing classes
    if (result.prediction === 1) {
        alertCard.classList.add('high');
        alertIcon.textContent = '⚠️'; // Warning icon
        alertTitle.textContent = 'High Risk Detected';
        alertDesc.textContent = 'The model predicts a high likelihood of heart disease based on the provided data. Consultation with a healthcare professional is strongly recommended.';
    } else if (result.prediction === 0) {
        alertCard.classList.add('normal');
        alertIcon.textContent = '✅'; // Checkmark icon
        alertTitle.textContent = 'Low Risk Detected';
        alertDesc.textContent = 'The model predicts a low likelihood of heart disease. Maintaining a healthy lifestyle is still important.';
    } else {
        // Handle cases where prediction might be missing or invalid
         alertCard.classList.add('initial');
         alertIcon.textContent = 'ℹ️'; // Info icon
         alertTitle.textContent = 'Information';
         alertDesc.textContent = 'Could not determine risk. Please check inputs or try again.';
    }
}

// --- Event Listeners ---

// Initialize Slider Displays on Load
document.addEventListener('DOMContentLoaded', () => {
    Object.keys(sliders).forEach(updateSliderDisplay);
     // Set default arc to 0%
    probabilityArcPath.setAttribute('d', calculateArcPath(0, 60));
});

// Gender Button Clicks
genderButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        genderButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to the clicked button
        button.classList.add('active');
        // Update the hidden input value
        hiddenGenderInput.value = button.getAttribute('data-value');
        // Clear error if selection is made
        if(hiddenGenderInput.value) formErrorMessage.textContent = '';
    });
});

// Slider Input Changes
Object.keys(sliders).forEach(sliderId => {
    sliders[sliderId].input.addEventListener('input', () => {
        updateSliderDisplay(sliderId);
    });
});

// Form Submission
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default page reload
    formErrorMessage.textContent = ''; // Clear previous form errors

    // --- Form Validation ---
    // Check if gender is selected
    if (!hiddenGenderInput.value) {
        formErrorMessage.textContent = 'Please select a gender.';
        // Optionally, scroll to or highlight the gender buttons
        return;
    }

    // Basic check for other required fields (HTML5 'required' handles most)
    let isFormValid = form.checkValidity(); // Use built-in HTML5 validation check
     if (!isFormValid) {
         // Find first invalid field for better feedback (optional)
         const firstInvalidField = form.querySelector(':invalid');
         formErrorMessage.textContent = `Please fill out the '${firstInvalidField?.name || 'required'}' field correctly.`;
         firstInvalidField?.focus(); // Focus the invalid field
         return;
     }

    // --- Data Collection ---
    const formData = new FormData(form);
    const data = {};
    let dataConversionError = false;

    for (let [key, value] of formData.entries()) {
         // Skip empty strings if any somehow bypass 'required' (shouldn't happen with required)
        if (value === '' && form.elements[key]?.required) {
            formErrorMessage.textContent = `Field '${key}' cannot be empty.`;
            dataConversionError = true;
            break;
        }
        // Convert to number, except for the hidden gender input which is already set
         const numValue = Number(value);
         if (isNaN(numValue)) {
             // Allow potentially non-numeric keys if your backend expects them
             // but for this model, all inputs should be numeric.
             formErrorMessage.textContent = `Invalid numeric value for ${key}.`;
             dataConversionError = true;
             break;
         }
         data[key] = numValue;
    }

    if (dataConversionError) {
        // Reset results UI to initial state if data is bad
        probabilityText.textContent = '--%';
        probabilityArcPath.setAttribute('d', calculateArcPath(0, 60));
        probabilityArcPath.style.stroke = '#5be4e4'; // Reset arc color
        aiDiagnosis.textContent = 'Invalid input data.';
        alertCard.className = 'alert-card initial'; // Reset alert card
        alertIcon.textContent = 'ℹ️';
        alertTitle.textContent = 'Information';
        alertDesc.textContent = 'Please correct the errors in the form.';
        return; // Stop submission
    }

    console.log('Sending data:', data);
    // UI feedback during prediction
    probabilityText.textContent = '...';
    aiDiagnosis.textContent = 'Processing...';


    // --- API Call ---
    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (e) { /* Ignore if body isn't json */ }
            throw new Error(errorData?.error || `Server Error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Received result:', result);

        // --- Update Results UI ---
        updateResultsUI(result);

    } catch (error) {
        console.error('Fetch Error:', error);
        // Update UI to show the error
        probabilityText.textContent = 'Err';
        aiDiagnosis.textContent = 'Prediction Failed';
        probabilityArcPath.setAttribute('d', calculateArcPath(0, 60)); // Reset arc
        probabilityArcPath.style.stroke = '#ff5757'; // Error color
        alertCard.className = 'alert-card high'; // Use 'high' style for errors
        alertIcon.textContent = '❌'; // Error icon
        alertTitle.textContent = 'Prediction Error';
        alertDesc.textContent = `Failed to get prediction: ${error.message}. Please check connection or try again.`;
    }
});