Follow these steps to get the application running locally.
1. Clone the Repository
git clone https://github.com/your-username/your-repo.git
cd your-repo
2. Install Frontend Dependencies
Make sure you have Node.js and npm installed, then:
npm install
3. Set Up Python Environment
Make sure Python 3.8+ is installed. Create a virtual environment (optional but recommended):
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
Then install Python dependencies. Inside the root backend folder (where server.py is located):
pip install flask flask-cors joblib pandas torch numpy requests sendgrid
pip install scikit-learn==1.5.2
5. Add API Keys
* SendGrid: Go to SendGrid, create an API key, and replace the api_key variable in server.py: api_key = "YOUR_SENDGRID_API_KEY"
* Update from_email in the Mail(...) section to your verified SendGrid sender email.
5. Add Models
* Download the model from the provided Google Drive link.
* https://drive.google.com/file/d/1kFEcnLDZ2Y48RLz_GjW1sBAaA_6HCiR1/view?usp=sharing
* Create a folder named Models inside your project root: mkdir models.
* Place your .pt model files into the Models/ directory.
6. Run the Python Server
From the backend folder run:
python server.py
This will start your Flask backend on http://localhost:5001.
7. Run the Frontend
In a separate terminal, start the frontend React app:
npm run dev
This should launch your development server at http://localhost:5173
