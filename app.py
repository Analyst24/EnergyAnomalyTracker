import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create database base class
class Base(DeclarativeBase):
    pass

# Initialize SQLAlchemy
db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///energy_anomaly.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
db.init_app(app)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

# Create database tables
with app.app_context():
    import models  # noqa: F401
    db.create_all()
    
    # Add demo user and data for easier testing if no users exist
    from models import User, Dataset, Analysis
    import json
    import numpy as np
    import os
    
    if not User.query.first():
        demo_user = User(username="demo_user", email="demo@example.com")
        demo_user.set_password("password123")
        db.session.add(demo_user)
        
        # Check if the sample file exists
        sample_file_path = os.path.join(os.getcwd(), 'uploads', 'sample_energy_data.csv')
        if os.path.exists(sample_file_path):
            # Create demo dataset
            demo_dataset = Dataset(
                name="Sample Energy Data",
                filename="sample_energy_data.csv",
                description="Sample energy consumption dataset for demonstration",
                user_id=1  # This will be the ID of the demo user
            )
            db.session.add(demo_dataset)
            
            # Generate random anomalies for demo
            num_samples = 120  # Approximate number of rows in the sample file
            random_anomalies = np.zeros(num_samples)
            anomaly_indices = np.random.choice(num_samples, size=int(num_samples * 0.1), replace=False)
            random_anomalies[anomaly_indices] = 1
            
            # Create demo analysis
            demo_analysis = Analysis(
                name="Sample Analysis - Isolation Forest",
                algorithm="isolation_forest",
                dataset_id=1,  # This will be the ID of the demo dataset
                results=json.dumps(random_anomalies.tolist()),
                accuracy=0.92,
                precision=0.85,
                recall=0.78,
                f1_score=0.81,
                anomaly_count=int(np.sum(random_anomalies))
            )
            db.session.add(demo_analysis)
            
            try:
                db.session.commit()
            except Exception as e:
                # If the demo data creation fails, just log it and continue
                print(f"Error creating demo data: {str(e)}")
                db.session.rollback()

# Load user function for login manager
from models import User  # noqa: E402

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
