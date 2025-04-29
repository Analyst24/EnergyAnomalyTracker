import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.decomposition import PCA
from sklearn.neighbors import LocalOutlierFactor

class AnomalyDetectionModel:
    """Base class for anomaly detection models"""
    
    def detect_anomalies(self, data):
        """
        Detect anomalies in the data
        
        Args:
            data (pd.DataFrame): Preprocessed data
            
        Returns:
            dict: Dictionary containing predictions and metrics
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    def _calculate_metrics(self, y_true, y_pred):
        """
        Calculate performance metrics
        
        Args:
            y_true (array-like): True labels
            y_pred (array-like): Predicted labels
            
        Returns:
            dict: Dictionary containing performance metrics
        """
        # For demo purposes, we'll generate synthetic labels
        # In a real scenario, these would come from labeled data
        if y_true is None:
            # Assume 10% of data are anomalies
            anomaly_idx = np.random.choice(len(y_pred), size=int(len(y_pred) * 0.1), replace=False)
            y_true = np.zeros(len(y_pred))
            y_true[anomaly_idx] = 1
        
        return {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1_score': f1_score(y_true, y_pred, zero_division=0)
        }

class IsolationForestModel(AnomalyDetectionModel):
    """Isolation Forest anomaly detection model"""
    
    def detect_anomalies(self, data, contamination=0.05, y_true=None):
        """
        Detect anomalies using Isolation Forest
        
        Args:
            data (pd.DataFrame): Preprocessed data
            contamination (float): Expected proportion of anomalies
            y_true (array-like, optional): True labels for metrics calculation
            
        Returns:
            dict: Dictionary containing predictions and metrics
        """
        # Scale data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        
        # Train model
        model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        
        # Fit and predict
        model.fit(scaled_data)
        # Convert from -1/1 to 0/1 where 1 is anomaly
        raw_predictions = model.predict(scaled_data)
        predictions = np.where(raw_predictions == -1, 1, 0)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_true, predictions)
        
        return {
            'predictions': predictions,
            **metrics
        }

class AutoEncoderModel(AnomalyDetectionModel):
    """AutoEncoder-like anomaly detection model using PCA for dimensionality reduction"""
    
    def detect_anomalies(self, data, contamination=0.05, y_true=None):
        """
        Detect anomalies using PCA reconstruction error (similar to AutoEncoder concept)
        
        Args:
            data (pd.DataFrame): Preprocessed data
            contamination (float): Expected proportion of anomalies
            y_true (array-like, optional): True labels for metrics calculation
            
        Returns:
            dict: Dictionary containing predictions and metrics
        """
        # Scale data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        
        # Define dimensionality
        n_components = max(min(scaled_data.shape[1] // 2, scaled_data.shape[0] // 5), 1)
        
        # Apply PCA for dimensionality reduction
        pca = PCA(n_components=n_components)
        reduced = pca.fit_transform(scaled_data)
        
        # Reconstruct the data
        reconstructions = pca.inverse_transform(reduced)
        
        # Calculate reconstruction error (MSE)
        mse = np.mean(np.power(scaled_data - reconstructions, 2), axis=1)
        
        # Define threshold based on contamination
        threshold = np.percentile(mse, 100 * (1 - contamination))
        
        # Mark anomalies
        predictions = np.where(mse > threshold, 1, 0)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_true, predictions)
        
        return {
            'predictions': predictions,
            **metrics
        }

class KMeansModel(AnomalyDetectionModel):
    """K-Means clustering for anomaly detection"""
    
    def detect_anomalies(self, data, contamination=0.05, y_true=None):
        """
        Detect anomalies using K-Means clustering
        
        Args:
            data (pd.DataFrame): Preprocessed data
            contamination (float): Expected proportion of anomalies
            y_true (array-like, optional): True labels for metrics calculation
            
        Returns:
            dict: Dictionary containing predictions and metrics
        """
        # Scale data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data)
        
        # Define number of clusters
        k = min(5, max(2, int(len(data) / 100)))
        
        # Train model
        kmeans = KMeans(n_clusters=k, random_state=42)
        cluster_labels = kmeans.fit_predict(scaled_data)
        
        # Calculate distance to cluster center
        distances = []
        for i, point in enumerate(scaled_data):
            cluster = cluster_labels[i]
            center = kmeans.cluster_centers_[cluster]
            distance = np.linalg.norm(point - center)
            distances.append(distance)
        
        distances = np.array(distances)
        
        # Define threshold based on contamination
        threshold = np.percentile(distances, 100 * (1 - contamination))
        
        # Mark anomalies
        predictions = np.where(distances > threshold, 1, 0)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_true, predictions)
        
        return {
            'predictions': predictions,
            **metrics
        }
