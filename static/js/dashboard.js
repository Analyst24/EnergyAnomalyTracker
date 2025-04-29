/**
 * Energy Anomaly Detection - Dashboard Scripts
 * This file contains scripts for the dashboard functionality
 */

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard summary data
    loadDashboardSummary();
    
    // Initialize any dashboard charts
    initializeDashboardCharts();
    
    // Add event listeners for dashboard interactions
    addDashboardEventListeners();
});

/**
 * Load dashboard summary data from API
 */
function loadDashboardSummary() {
    fetch('/api/dashboard/summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }
            return response.json();
        })
        .then(data => {
            updateDashboardStats(data);
            updateAlgorithmDistribution(data.algorithm_distribution);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            // Display error message to user
            const errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger';
            errorAlert.textContent = 'Failed to load dashboard data. Please try again later.';
            document.querySelector('.dashboard-container').prepend(errorAlert);
        });
}

/**
 * Update dashboard statistics with API data
 * @param {Object} data - Dashboard summary data
 */
function updateDashboardStats(data) {
    // Update dataset count
    const datasetCountElement = document.getElementById('dataset-count');
    if (datasetCountElement) {
        datasetCountElement.textContent = data.dataset_count;
    }
    
    // Update analysis count
    const analysisCountElement = document.getElementById('analysis-count');
    if (analysisCountElement) {
        analysisCountElement.textContent = data.analysis_count;
    }
    
    // Update anomaly count
    const anomalyCountElement = document.getElementById('anomaly-count');
    if (anomalyCountElement) {
        anomalyCountElement.textContent = data.anomaly_stats.total;
    }
    
    // Update average anomalies per analysis
    const avgAnomalyElement = document.getElementById('avg-anomalies');
    if (avgAnomalyElement) {
        avgAnomalyElement.textContent = data.anomaly_stats.avg_per_analysis.toFixed(2);
    }
}

/**
 * Initialize dashboard charts
 */
function initializeDashboardCharts() {
    // If algorithm distribution chart container exists, create it
    const algoChartContainer = document.getElementById('algorithm-distribution-chart');
    if (algoChartContainer) {
        // Initial empty chart - will be populated with data from API
        createAlgorithmComparisonChart('algorithm-distribution-chart', {
            'Isolation Forest': 0,
            'AutoEncoder': 0,
            'K-Means': 0
        }, 'Algorithm Distribution');
    }
    
    // Create energy usage trend chart if container exists
    const trendChartContainer = document.getElementById('energy-trend-chart');
    if (trendChartContainer) {
        // Generate dynamic energy chart for demonstration
        createDynamicEnergyChart('energy-trend-chart');
    }
}

/**
 * Update algorithm distribution chart with data from API
 * @param {Object} distributionData - Algorithm distribution data
 */
function updateAlgorithmDistribution(distributionData) {
    const algoChartContainer = document.getElementById('algorithm-distribution-chart');
    if (!algoChartContainer) return;
    
    // Format algorithm names for display
    const formattedLabels = distributionData.labels.map(label => {
        if (label === 'isolation_forest') return 'Isolation Forest';
        if (label === 'autoencoder') return 'AutoEncoder';
        if (label === 'kmeans') return 'K-Means';
        return label;
    });
    
    // Create algorithm data object
    const algorithmData = {};
    formattedLabels.forEach((label, index) => {
        algorithmData[label] = distributionData.counts[index];
    });
    
    // Update chart
    createAlgorithmComparisonChart('algorithm-distribution-chart', algorithmData, 'Algorithm Distribution');
}

/**
 * Add event listeners for dashboard interactions
 */
function addDashboardEventListeners() {
    // Dataset select element for loading dataset visualizations
    const datasetSelect = document.getElementById('dataset-select');
    if (datasetSelect) {
        datasetSelect.addEventListener('change', function() {
            const datasetId = this.value;
            if (datasetId) {
                loadDatasetVisualization(datasetId);
            }
        });
    }
    
    // Analysis select element for loading analysis results
    const analysisSelect = document.getElementById('analysis-select');
    if (analysisSelect) {
        analysisSelect.addEventListener('change', function() {
            const analysisId = this.value;
            if (analysisId) {
                loadAnalysisResults(analysisId);
            }
        });
    }
    
    // Refresh visualization button
    const refreshBtn = document.getElementById('refresh-visualization');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const datasetId = document.getElementById('dataset-select')?.value;
            const analysisId = document.getElementById('analysis-select')?.value;
            
            if (datasetId) {
                loadDatasetVisualization(datasetId);
            }
            
            if (analysisId) {
                loadAnalysisResults(analysisId);
            }
            
            if (!datasetId && !analysisId) {
                alert('Please select a dataset or analysis to visualize');
            }
        });
    }
    
    // Dataset view buttons in the recent datasets table
    const datasetViewBtns = document.querySelectorAll('.dataset-view-btn');
    datasetViewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const datasetId = this.getAttribute('data-id');
            if (datasetId) {
                // Update the dataset select dropdown
                const datasetSelect = document.getElementById('dataset-select');
                if (datasetSelect) {
                    datasetSelect.value = datasetId;
                }
                
                // Load the visualization
                loadDatasetVisualization(datasetId);
                
                // Scroll to the visualization section
                document.getElementById('dataset-visualization')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });
    });
}

/**
 * Load dataset visualization based on selected dataset
 * @param {number} datasetId - ID of the selected dataset
 */
function loadDatasetVisualization(datasetId) {
    fetch(`/api/dataset/${datasetId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load dataset data');
            }
            return response.json();
        })
        .then(data => {
            // Display dataset visualization
            displayDatasetVisualization(data);
        })
        .catch(error => {
            console.error('Error loading dataset data:', error);
            // Display error message
            const chartContainer = document.getElementById('dataset-visualization');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load dataset visualization. Please try again later.
                    </div>
                `;
            }
        });
}

/**
 * Display dataset visualization
 * @param {Object} data - Dataset data from API
 */
function displayDatasetVisualization(data) {
    const chartContainer = document.getElementById('dataset-visualization');
    if (!chartContainer) return;
    
    // Clear existing content
    chartContainer.innerHTML = '';
    
    // Check if we have data
    if (!data.data || data.data.length === 0) {
        chartContainer.innerHTML = `
            <div class="alert alert-warning">
                No data available for visualization.
            </div>
        `;
        return;
    }
    
    // Find numeric columns for visualization
    const numericColumns = data.columns.filter(column => {
        return !isNaN(data.data[0][column]);
    });
    
    // If no numeric columns, show message
    if (numericColumns.length === 0) {
        chartContainer.innerHTML = `
            <div class="alert alert-warning">
                No numeric data available for visualization.
            </div>
        `;
        return;
    }
    
    // Create chart container
    const plotDiv = document.createElement('div');
    plotDiv.id = 'dataset-plot';
    plotDiv.style.height = '400px';
    chartContainer.appendChild(plotDiv);
    
    // Use first numeric column for visualization
    const yField = numericColumns[0];
    
    // Create index for x-axis if no timestamp column
    const xValues = Array.from(Array(data.data.length).keys());
    const yValues = data.data.map(d => d[yField]);
    
    // Create trace
    const trace = {
        x: xValues,
        y: yValues,
        mode: 'lines+markers',
        type: 'scatter',
        name: yField,
        line: {
            color: '#3498db',
            width: 2
        },
        marker: {
            size: 6,
            color: '#3498db'
        }
    };
    
    // Layout configuration
    const layout = {
        title: {
            text: `Dataset Visualization: ${yField}`,
            font: {
                color: '#ecf0f1',
                size: 18
            }
        },
        paper_bgcolor: '#1e1e1e',
        plot_bgcolor: '#1e1e1e',
        xaxis: {
            title: 'Data Point Index',
            gridcolor: '#2c3e50',
            color: '#ecf0f1'
        },
        yaxis: {
            title: yField,
            gridcolor: '#2c3e50',
            color: '#ecf0f1'
        }
    };
    
    // Create plot
    Plotly.newPlot('dataset-plot', [trace], layout, {responsive: true});
}

/**
 * Load analysis results based on selected analysis
 * @param {number} analysisId - ID of the selected analysis
 */
function loadAnalysisResults(analysisId) {
    fetch(`/api/analysis/${analysisId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load analysis data');
            }
            return response.json();
        })
        .then(data => {
            // Display analysis results
            displayAnalysisResults(data, analysisId);
        })
        .catch(error => {
            console.error('Error loading analysis data:', error);
            // Display error message
            const resultContainer = document.getElementById('analysis-results');
            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load analysis results. Please try again later.
                    </div>
                `;
            }
        });
}

/**
 * Display analysis results
 * @param {Object} data - Analysis data from API
 * @param {number} analysisId - ID of the analysis
 */
function displayAnalysisResults(data, analysisId) {
    const resultContainer = document.getElementById('analysis-results');
    if (!resultContainer) return;
    
    // Clear existing content
    resultContainer.innerHTML = '';
    
    // Check if we have data
    if (!data.data || data.data.length === 0) {
        resultContainer.innerHTML = `
            <div class="alert alert-warning">
                No data available for this analysis.
            </div>
        `;
        return;
    }
    
    // Create metrics summary
    const metricsSummary = document.createElement('div');
    metricsSummary.className = 'row mb-4';
    metricsSummary.innerHTML = `
        <div class="col-md-3">
            <div class="card">
                <div class="card-body text-center">
                    <h5 class="card-title">Accuracy</h5>
                    <h2>${(data.metrics.accuracy * 100).toFixed(1)}%</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body text-center">
                    <h5 class="card-title">Precision</h5>
                    <h2>${(data.metrics.precision * 100).toFixed(1)}%</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body text-center">
                    <h5 class="card-title">Recall</h5>
                    <h2>${(data.metrics.recall * 100).toFixed(1)}%</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body text-center">
                    <h5 class="card-title">Anomalies</h5>
                    <h2>${data.metrics.anomaly_count}</h2>
                </div>
            </div>
        </div>
    `;
    
    resultContainer.appendChild(metricsSummary);
    
    // Create charts row
    const chartsRow = document.createElement('div');
    chartsRow.className = 'row';
    
    // Find numeric columns for visualization
    const numericColumns = data.columns.filter(column => {
        return !isNaN(data.data[0][column]);
    });
    
    // If no numeric columns, show message
    if (numericColumns.length === 0) {
        chartsRow.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    No numeric data available for visualization.
                </div>
            </div>
        `;
        resultContainer.appendChild(chartsRow);
        return;
    }
    
    // Create time series chart container
    const timeSeriesCol = document.createElement('div');
    timeSeriesCol.className = 'col-md-8 mb-4';
    timeSeriesCol.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Anomaly Detection Results</h5>
            </div>
            <div class="card-body">
                <div id="time-series-chart" style="height: 400px;"></div>
            </div>
        </div>
    `;
    
    // Create distribution chart container
    const distributionCol = document.createElement('div');
    distributionCol.className = 'col-md-4 mb-4';
    distributionCol.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Anomaly Distribution</h5>
            </div>
            <div class="card-body">
                <div id="anomaly-pie-chart" style="height: 400px;"></div>
            </div>
        </div>
    `;
    
    chartsRow.appendChild(timeSeriesCol);
    chartsRow.appendChild(distributionCol);
    resultContainer.appendChild(chartsRow);
    
    // Create second row for additional charts
    const secondRow = document.createElement('div');
    secondRow.className = 'row';
    
    // Create distribution chart container
    const featureDistCol = document.createElement('div');
    featureDistCol.className = 'col-md-6 mb-4';
    featureDistCol.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Feature Distribution</h5>
            </div>
            <div class="card-body">
                <div id="feature-distribution-chart" style="height: 350px;"></div>
            </div>
        </div>
    `;
    
    // Create metrics radar chart container
    const radarCol = document.createElement('div');
    radarCol.className = 'col-md-6 mb-4';
    radarCol.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Model Performance</h5>
            </div>
            <div class="card-body">
                <div id="metrics-radar-chart" style="height: 350px;"></div>
            </div>
        </div>
    `;
    
    secondRow.appendChild(featureDistCol);
    secondRow.appendChild(radarCol);
    resultContainer.appendChild(secondRow);
    
    // Get data for charts
    const yField = numericColumns[0];
    
    // Create time series chart
    createTimeSeriesChart(
        'time-series-chart',
        data.data,
        data.anomalies,
        'index',
        yField,
        `${yField} with Anomalies`
    );
    
    // Create anomaly pie chart
    createAnomalyPieChart(
        'anomaly-pie-chart',
        data.anomalies,
        'Anomaly Distribution'
    );
    
    // Create feature distribution chart
    createDistributionChart(
        'feature-distribution-chart',
        data.data,
        data.anomalies,
        yField,
        `${yField} Distribution`
    );
    
    // Create metrics radar chart
    createMetricsRadarChart(
        'metrics-radar-chart',
        data.metrics,
        'Model Performance Metrics'
    );
    
    // Add view details button
    const viewDetailsRow = document.createElement('div');
    viewDetailsRow.className = 'row mt-3';
    viewDetailsRow.innerHTML = `
        <div class="col-12 text-center">
            <a href="/results/${analysisId}" class="btn btn-primary">
                <i class="fas fa-chart-line me-2"></i> View Detailed Results
            </a>
        </div>
    `;
    
    resultContainer.appendChild(viewDetailsRow);
}
