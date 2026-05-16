# FinSight

FinSight is an AI-powered financial dashboard that extracts and categorizes transaction data from bank statements. It features a robust, dual-platform extraction engine supporting cloud-based LLMs (Gemini, OpenRouter) and local models via Ollama with automatic fallback and retry logic.

## 🚀 Quick Start

Getting started is fully automated using the provided batch scripts. 

### 1. Initial Setup
Just double-click the **`setup.bat`** file.
This script will automatically:
* Install all Frontend Node dependencies (`npm install`).
* Create a Python virtual environment for the Backend.
* Install all Backend Python dependencies (`pip install -r requirements.txt`).
* Generate a `.gitignore` file.
* (Optional) Help you initialize and push to your GitHub repository.

### 2. Add Your API Keys (Required)
Before starting the servers, you need to provide the AI models with API keys. 
Create a file named `.env` in the `backend` folder (where `main.py` is located) and add the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
