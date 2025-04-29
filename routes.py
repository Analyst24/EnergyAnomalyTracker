import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from flask import render_template, url_for, flash, redirect, request, abort, jsonify, send_from_directory
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.utils import secure_filename
from app import app, db
from models import User, Dataset, Analysis
from forms import RegistrationForm, LoginForm, DatasetUploadForm, AnalysisForm
from ml_models import IsolationForestModel, AutoEncoderModel, KMeansModel
from utils import preprocess_data, save_dataset, get_dataset_path

# Base routes
@app.route('/')
@app.route('/get_started')
def get_started():
    return render_template('get_started.html', title='Get Started')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login unsuccessful. Please check your username and password.', 'danger')
    
    return render_template('login.html', title='Login', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('get_started'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html', title='Home')

# Dashboard route
@app.route('/dashboard')
@login_required
def dashboard():
    datasets = Dataset.query.filter_by(user_id=current_user.id).all()
    analyses = Analysis.query.join(Dataset).filter(Dataset.user_id == current_user.id).all()
    
    return render_template('dashboard.html', 
                          title='Dashboard',
                          datasets=datasets,
                          analyses=analyses)

# Data upload route
@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    form = DatasetUploadForm()
    
    if form.validate_on_submit():
        try:
            # Save uploaded file
            filename = secure_filename(form.file.data.filename)
            file_path = save_dataset(form.file.data, filename)
            
            # Validate CSV format
            try:
                df = pd.read_csv(file_path)
                if df.empty:
                    raise ValueError("The uploaded CSV file is empty.")
            except Exception as e:
                os.remove(file_path)
                flash(f'Error reading CSV file: {str(e)}', 'danger')
                return redirect(url_for('upload'))
            
            # Create dataset record
            dataset = Dataset(
                name=form.name.data,
                filename=filename,
                description=form.description.data,
                user_id=current_user.id
            )
            db.session.add(dataset)
            db.session.commit()
            
            flash('Dataset uploaded successfully!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            flash(f'Error uploading file: {str(e)}', 'danger')
    
    return render_template('upload.html', title='Upload Data', form=form)

# Analysis/Detection route
@app.route('/detection', methods=['GET', 'POST'])
@login_required
def detection():
    form = AnalysisForm()
    
    # Get user datasets for dropdown
    datasets = Dataset.query.filter_by(user_id=current_user.id).all()
    form.dataset.choices = [(d.id, d.name) for d in datasets]
    
    if form.validate_on_submit():
        dataset_id = form.dataset.data
        algorithm = form.algorithm.data
        
        dataset = Dataset.query.get_or_404(dataset_id)
        
        # Ensure dataset belongs to current user
        if dataset.user_id != current_user.id:
            abort(403)
        
        try:
            # Load dataset
            file_path = get_dataset_path(dataset.filename)
            df = pd.read_csv(file_path)
            
            # Preprocess data
            processed_data = preprocess_data(df)
            
            # Select algorithm and run detection
            if algorithm == 'isolation_forest':
                model = IsolationForestModel()
                results = model.detect_anomalies(processed_data)
            elif algorithm == 'autoencoder':
                model = AutoEncoderModel()
                results = model.detect_anomalies(processed_data)
            elif algorithm == 'kmeans':
                model = KMeansModel()
                results = model.detect_anomalies(processed_data)
            else:
                flash('Invalid algorithm selected.', 'danger')
                return redirect(url_for('detection'))
            
            # Create analysis record
            analysis = Analysis(
                name=f"{dataset.name} - {algorithm} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                algorithm=algorithm,
                dataset_id=dataset_id,
                results=json.dumps(results['predictions'].tolist()),
                accuracy=results.get('accuracy'),
                precision=results.get('precision'),
                recall=results.get('recall'),
                f1_score=results.get('f1_score'),
                anomaly_count=int(np.sum(results['predictions']))
            )
            db.session.add(analysis)
            db.session.commit()
            
            flash('Anomaly detection completed successfully!', 'success')
            return redirect(url_for('results', analysis_id=analysis.id))
        
        except Exception as e:
            flash(f'Error running analysis: {str(e)}', 'danger')
    
    return render_template('detection.html', title='Run Detection', form=form)

# Results route
@app.route('/results/<int:analysis_id>')
@login_required
def results(analysis_id):
    analysis = Analysis.query.get_or_404(analysis_id)
    
    # Ensure analysis belongs to current user
    if analysis.dataset.user_id != current_user.id:
        abort(403)
    
    # Get dataset
    dataset = analysis.dataset
    
    try:
        # Load data
        file_path = get_dataset_path(dataset.filename)
        df = pd.read_csv(file_path)
        
        # Get results
        results = json.loads(analysis.results)
        
        return render_template('results.html', 
                              title='Analysis Results',
                              analysis=analysis,
                              dataset=dataset,
                              data_preview=df.head(10).to_html(classes='table table-dark table-striped'),
                              column_names=df.columns.tolist())
    except Exception as e:
        flash(f'Error loading analysis results: {str(e)}', 'danger')
        return redirect(url_for('dashboard'))
        
# Fallback route for results without an ID
@app.route('/results')
@login_required
def results_redirect():
    # Find the most recent analysis for the current user
    latest_analysis = Analysis.query.join(Dataset).filter(
        Dataset.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()
    
    if latest_analysis:
        return redirect(url_for('results', analysis_id=latest_analysis.id))
    else:
        flash('No analysis results available. Run an anomaly detection first.', 'info')
        return redirect(url_for('detection'))

# Model insights route
@app.route('/insights')
@login_required
def insights():
    analyses = Analysis.query.join(Dataset).filter(Dataset.user_id == current_user.id).all()
    return render_template('insights.html', title='Model Insights', analyses=analyses)

# Recommendations route
@app.route('/recommendations')
@login_required
def recommendations():
    # Get the most recent analysis
    latest_analysis = Analysis.query.join(Dataset).filter(
        Dataset.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()
    
    # Default recommendations if no analysis exists
    if not latest_analysis:
        recommendations = [
            "Upload your first energy consumption dataset to get started with anomaly detection.",
            "Try different algorithms to compare their performance on your data.",
            "Regular monitoring helps identify energy efficiency issues early."
        ]
        return render_template('recommendations.html', title='Recommendations', 
                              recommendations=recommendations, has_analysis=False)
    
    # Get dataset
    dataset = latest_analysis.dataset
    
    # Load data and predictions
    file_path = get_dataset_path(dataset.filename)
    df = pd.read_csv(file_path)
    predictions = np.array(json.loads(latest_analysis.results))
    
    # Generate recommendations based on anomalies
    anomaly_count = int(np.sum(predictions))
    recommendations = []
    
    if anomaly_count > 0:
        recommendations.append(f"We detected {anomaly_count} anomalies in your energy consumption data.")
        recommendations.append("Consider investigating unusual patterns during peak hours.")
        recommendations.append("Check for equipment that may be operating inefficiently.")
        recommendations.append("Monitor consumption patterns for specific time periods where anomalies occur.")
        recommendations.append("Consider implementing real-time monitoring for early detection.")
    else:
        recommendations.append("No significant anomalies detected in your energy consumption patterns.")
        recommendations.append("Continue monitoring your energy usage regularly.")
        recommendations.append("Consider analyzing data from different time periods or sources.")
    
    return render_template('recommendations.html', 
                          title='Recommendations',
                          recommendations=recommendations,
                          has_analysis=True,
                          analysis=latest_analysis)

# Settings route
@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        if 'clear_analyses' in request.form:
            try:
                # Get all analyses for the current user's datasets
                user_analyses = Analysis.query.join(Dataset).filter(Dataset.user_id == current_user.id).all()
                
                # Delete all analyses
                for analysis in user_analyses:
                    db.session.delete(analysis)
                
                db.session.commit()
                flash('All analyses have been successfully cleared.', 'success')
            except Exception as e:
                db.session.rollback()
                flash(f'Error clearing analyses: {str(e)}', 'danger')
                
    return render_template('settings.html', title='Settings')

# API routes for chart data
@app.route('/api/dataset/<int:dataset_id>')
@login_required
def get_dataset_data(dataset_id):
    dataset = Dataset.query.get_or_404(dataset_id)
    
    # Ensure dataset belongs to current user
    if dataset.user_id != current_user.id:
        abort(403)
    
    file_path = get_dataset_path(dataset.filename)
    df = pd.read_csv(file_path)
    
    # Limit to 1000 points for performance
    if len(df) > 1000:
        df = df.sample(1000)
    
    return jsonify({
        'columns': df.columns.tolist(),
        'data': df.to_dict(orient='records')
    })

@app.route('/api/analysis/<int:analysis_id>')
@login_required
def get_analysis_data(analysis_id):
    analysis = Analysis.query.get_or_404(analysis_id)
    
    # Ensure analysis belongs to current user
    if analysis.dataset.user_id != current_user.id:
        abort(403)
    
    # Get dataset
    dataset = analysis.dataset
    
    # Load data
    file_path = get_dataset_path(dataset.filename)
    df = pd.read_csv(file_path)
    
    # Get results
    anomalies = np.array(json.loads(analysis.results))
    
    # Limit to 1000 points for performance
    if len(df) > 1000:
        # Sample while maintaining anomaly distribution
        normal_idx = np.where(anomalies == 0)[0]
        anomaly_idx = np.where(anomalies == 1)[0]
        
        # Calculate proportions to maintain
        if len(normal_idx) > 0 and len(anomaly_idx) > 0:
            normal_sample_size = min(int(1000 * len(normal_idx) / len(anomalies)), len(normal_idx))
            anomaly_sample_size = min(1000 - normal_sample_size, len(anomaly_idx))
            
            # Sample indices
            normal_sample = np.random.choice(normal_idx, normal_sample_size, replace=False)
            anomaly_sample = np.random.choice(anomaly_idx, anomaly_sample_size, replace=False)
            
            # Combine indices
            sample_idx = np.concatenate([normal_sample, anomaly_sample])
            
            # Sample data and anomalies
            df = df.iloc[sample_idx].reset_index(drop=True)
            anomalies = anomalies[sample_idx]
        else:
            # If all normal or all anomalies, just sample randomly
            sample_idx = np.random.choice(len(df), min(1000, len(df)), replace=False)
            df = df.iloc[sample_idx].reset_index(drop=True)
            anomalies = anomalies[sample_idx]
    
    # Prepare response
    return jsonify({
        'columns': df.columns.tolist(),
        'data': df.to_dict(orient='records'),
        'anomalies': anomalies.tolist(),
        'metrics': {
            'accuracy': analysis.accuracy,
            'precision': analysis.precision,
            'recall': analysis.recall,
            'f1_score': analysis.f1_score,
            'anomaly_count': analysis.anomaly_count
        }
    })

@app.route('/api/dashboard/summary')
@login_required
def dashboard_summary():
    # Count datasets and analyses
    dataset_count = Dataset.query.filter_by(user_id=current_user.id).count()
    analysis_count = Analysis.query.join(Dataset).filter(Dataset.user_id == current_user.id).count()
    
    # Get algorithm distribution
    algorithm_counts = db.session.query(
        Analysis.algorithm, db.func.count(Analysis.id)
    ).join(Dataset).filter(
        Dataset.user_id == current_user.id
    ).group_by(Analysis.algorithm).all()
    
    algorithm_data = {
        'labels': [algo for algo, _ in algorithm_counts],
        'counts': [count for _, count in algorithm_counts]
    }
    
    # Get anomaly statistics
    analyses = Analysis.query.join(Dataset).filter(Dataset.user_id == current_user.id).all()
    anomaly_counts = [a.anomaly_count for a in analyses if a.anomaly_count is not None]
    
    return jsonify({
        'dataset_count': dataset_count,
        'analysis_count': analysis_count,
        'algorithm_distribution': algorithm_data,
        'anomaly_stats': {
            'total': sum(anomaly_counts) if anomaly_counts else 0,
            'avg_per_analysis': sum(anomaly_counts) / len(anomaly_counts) if anomaly_counts else 0
        }
    })
