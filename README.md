# Traelth

Traelth is an advanced personal health intelligence platform that synthesizes biometrics, training data, and clinical signals to provide deep physiological insights and forecasting.

## Architecture

Traelth consists of two main components:
- **Frontend**: A React application built with Vite, utilizing modern glassmorphism design and `recharts` for rich data visualization.
- **Backend**: A Python Flask REST API powered by machine learning (`scikit-learn`, `xgboost`, `shap`) to calculate trend metrics, predict physiological states, and provide actionable health recommendations.

## Features

- **Key Metrics Dashboard**: Real-time evaluation of Resting Heart Rate (RHR), HRV, VO₂ Max, Sleep Duration, and Daily Steps.
- **Trend Analysis**: 90-day tracking with moving averages and interpolation algorithms to visualize daily autonomic fluctuations.
- **Intelligent Forecasting**: Uses predictive modeling to estimate 12-week physiological trajectories and metabolic age.
- **Systemic Interactions**: Analyzes how different health pillars (e.g., Sleep Duration vs. RHR, Training Intensity vs. Recovery) interact and affect your body.
- **Printable Reports**: Fully optimized for generating clean, page-break-safe PDF health reports directly from the browser.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- pip

### Backend Setup

1. Navigate to the `backend` directory.
2. (Optional) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   PYTHONPATH=. python3 app.py
   ```
   The backend will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## Tech Stack

- **Frontend**: React, React Router, Recharts, Lucide-React, Vanilla CSS
- **Backend**: Python, Flask, Pandas, Scikit-learn, XGBoost, SHAP

## Privacy
BioLens processes sensitive biometric data. Always ensure appropriate security measures and environment variable configurations before deploying to production.
