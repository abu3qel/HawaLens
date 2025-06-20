## Product Overview
You can have access to the product overview by downloading the presentation slides of HawaLens in the link below:

https://drive.google.com/file/d/18wDpDTj-RS-i5_qRCfivDvQpMlcdGlKe/view?usp=sharing

## Getting Started – Local Development Setup

Follow these steps to run the HawaLens application locally:

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

---

### 2. Install Frontend Dependencies

Ensure you have **Node.js** and **npm** installed.

```bash
npm install
```

---

### 3. Set Up Python Environment

Ensure **Python 3.12.7** is installed.

Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Then install required backend dependencies:

```bash
pip install flask flask-cors joblib pandas torch numpy requests sendgrid
pip install scikit-learn==1.5.2
```

---

### 4. Configure API Keys

**SendGrid:**

* Go to [SendGrid](https://sendgrid.com), generate an API key.
* In `server.py`, replace the placeholder:

```python
api_key = "YOUR_SENDGRID_API_KEY"
```

* Also update the `from_email` field in the `Mail(...)` section to your **verified SendGrid sender email**.

---

### 5. Add Model Files

* Download the pre-trained model from [Google Drive](https://drive.google.com/file/d/1kFEcnLDZ2Y48RLz_GjW1sBAaA_6HCiR1/view?usp=sharing).
* Create a folder for models:

```bash
mkdir models
```

* Place all `.pt` model files inside the newly created `models/` directory.

---

### 6. Start the Backend Server

Navigate to the backend folder and run:

```bash
python server.py
```

This starts the Flask backend at:

```
http://localhost:5001
```

---

### 7. Start the Frontend App

In a new terminal (from the project root):

```bash
npm run dev
```

Your React frontend will launch at:

```
http://localhost:5173
```
