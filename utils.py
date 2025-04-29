import os
import pandas as pd
import numpy as np
from datetime import datetime
from werkzeug.utils import secure_filename

def get_upload_folder():
    """Get the folder for uploaded datasets"""
    upload_folder = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    return upload_folder

def save_dataset(file_data, filename):
    """
    Save uploaded dataset file
    
    Args:
        file_data: File data from the request
        filename: Secure filename
        
    Returns:
        str: Path to the saved file
    """
    # Add timestamp to filename to ensure uniqueness
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    base, ext = os.path.splitext(filename)
    unique_filename = f"{base}_{timestamp}{ext}"
    
    # Save file
    upload_folder = get_upload_folder()
    file_path = os.path.join(upload_folder, unique_filename)
    file_data.save(file_path)
    
    return file_path

def get_dataset_path(filename):
    """
    Get the full path to a dataset file
    
    Args:
        filename: Filename of the dataset
        
    Returns:
        str: Full path to the dataset file
    """
    return os.path.join(get_upload_folder(), filename)

def preprocess_data(df):
    """
    Preprocess data for anomaly detection
    
    Args:
        df (pd.DataFrame): Raw data
        
    Returns:
        pd.DataFrame: Preprocessed data
    """
    # Make a copy to avoid modifying the original
    df_processed = df.copy()
    
    # Handle datetime columns
    datetime_cols = []
    for col in df_processed.columns:
        if pd.api.types.is_datetime64_any_dtype(df_processed[col]):
            datetime_cols.append(col)
        elif 'date' in col.lower() or 'time' in col.lower():
            try:
                df_processed[col] = pd.to_datetime(df_processed[col])
                datetime_cols.append(col)
            except:
                pass
    
    # Extract time features from datetime columns
    for col in datetime_cols:
        df_processed[f'{col}_hour'] = df_processed[col].dt.hour
        df_processed[f'{col}_day'] = df_processed[col].dt.day
        df_processed[f'{col}_month'] = df_processed[col].dt.month
        df_processed[f'{col}_dayofweek'] = df_processed[col].dt.dayofweek
        
        # Drop original datetime column
        df_processed = df_processed.drop(col, axis=1)
    
    # Handle categorical columns
    cat_cols = []
    for col in df_processed.columns:
        if pd.api.types.is_categorical_dtype(df_processed[col]) or pd.api.types.is_object_dtype(df_processed[col]):
            cat_cols.append(col)
    
    # One-hot encode categorical columns
    if cat_cols:
        df_processed = pd.get_dummies(df_processed, columns=cat_cols, drop_first=True)
    
    # Handle missing values
    df_processed = df_processed.fillna(df_processed.mean())
    
    # Select only numeric columns
    numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
    df_processed = df_processed[numeric_cols]
    
    return df_processed
