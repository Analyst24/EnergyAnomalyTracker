/**
 * Energy Anomaly Detection - Chart Utilities
 * This file contains functions for creating interactive charts
 */

// Chart colors
const chartColors = {
    primary: '#3498db',
    success: '#2ecc71',
    danger: '#e74c3c',
    warning: '#f39c12',
    info: '#1abc9c',
    dark: '#34495e',
    text: '#ecf0f1',
    grid: '#2c3e50',
    background: '#1e1e1e'
};

/**
 * Create a time series chart with anomaly highlighting
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - The time series data
 * @param {Array} anomalies - Anomaly indicators (0 or 1)
 * @param {string} xField - The field to use for x-axis
 * @param {string} yField - The field to use for y-axis
 * @param {string} title - Chart title
 */
function createTimeSeriesChart(containerId, data, anomalies, xField, yField, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Prepare data
    const xValues = data.map(d => d[xField]);
    const yValues = data.map(d => d[yField]);
    
    // Create normal points trace
    const normalIndices = anomalies.map((a, i) => a === 0 ? i : null).filter(i => i !== null);
    const normalTrace = {
        x: normalIndices.map(i => xValues[i]),
        y: normalIndices.map(i => yValues[i]),
        mode: 'markers',
        type: 'scatter',
        name: 'Normal',
        marker: {
            color: chartColors.primary,
            size: 8
        }
    };
    
    // Create anomaly points trace
    const anomalyIndices = anomalies.map((a, i) => a === 1 ? i : null).filter(i => i !== null);
    const anomalyTrace = {
        x: anomalyIndices.map(i => xValues[i]),
        y: anomalyIndices.map(i => yValues[i]),
        mode: 'markers',
        type: 'scatter',
        name: 'Anomaly',
        marker: {
            color: chartColors.danger,
            size: 12,
            symbol: 'circle-open',
            line: {
                width: 2,
                color: chartColors.danger
            }
        }
    };
    
    // Create line trace for all points
    const lineTrace = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        type: 'scatter',
        name: 'Trend',
        line: {
            color: chartColors.dark,
            width: 1
        },
        hoverinfo: 'none'
    };
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 20, b: 50, l: 50 },
        xaxis: {
            title: xField,
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        yaxis: {
            title: yField,
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        legend: {
            x: 1,
            y: 1,
            font: {
                color: chartColors.text
            }
        },
        hovermode: 'closest'
    };
    
    // Responsive configuration
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create chart
    Plotly.newPlot(containerId, [lineTrace, normalTrace, anomalyTrace], layout, config);
}

/**
 * Create a distribution chart for comparing normal vs anomaly values
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - The data array
 * @param {Array} anomalies - Anomaly indicators (0 or 1)
 * @param {string} field - The field to analyze
 * @param {string} title - Chart title
 */
function createDistributionChart(containerId, data, anomalies, field, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Extract values
    const values = data.map(d => d[field]);
    
    // Separate normal and anomaly values
    const normalValues = values.filter((_, i) => anomalies[i] === 0);
    const anomalyValues = values.filter((_, i) => anomalies[i] === 1);
    
    // Create traces
    const normalTrace = {
        x: normalValues,
        type: 'histogram',
        name: 'Normal',
        opacity: 0.7,
        marker: {
            color: chartColors.primary
        }
    };
    
    const anomalyTrace = {
        x: anomalyValues,
        type: 'histogram',
        name: 'Anomaly',
        opacity: 0.7,
        marker: {
            color: chartColors.danger
        }
    };
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 20, b: 50, l: 50 },
        xaxis: {
            title: field,
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        yaxis: {
            title: 'Count',
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        legend: {
            x: 1,
            y: 1,
            font: {
                color: chartColors.text
            }
        },
        barmode: 'overlay'
    };
    
    // Responsive configuration
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create chart
    Plotly.newPlot(containerId, [normalTrace, anomalyTrace], layout, config);
}

/**
 * Create a pie chart for anomaly distribution
 * @param {string} containerId - The ID of the container element
 * @param {Array} anomalies - Anomaly indicators (0 or 1)
 * @param {string} title - Chart title
 */
function createAnomalyPieChart(containerId, anomalies, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Count anomalies and normal points
    const anomalyCount = anomalies.filter(a => a === 1).length;
    const normalCount = anomalies.length - anomalyCount;
    
    // Create pie chart
    const data = [{
        values: [normalCount, anomalyCount],
        labels: ['Normal', 'Anomaly'],
        type: 'pie',
        marker: {
            colors: [chartColors.primary, chartColors.danger]
        },
        textinfo: 'label+percent',
        textfont: {
            color: chartColors.text
        },
        hoverinfo: 'label+value'
    }];
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 20, b: 30, l: 20 },
        legend: {
            font: {
                color: chartColors.text
            }
        }
    };
    
    // Responsive configuration
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create chart
    Plotly.newPlot(containerId, data, layout, config);
}

/**
 * Create a heatmap for time of day analysis
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - The data array
 * @param {Array} anomalies - Anomaly indicators (0 or 1)
 * @param {string} hourField - The field containing hour information
 * @param {string} valueField - The field containing the value to analyze
 * @param {string} title - Chart title
 */
function createTimeOfDayHeatmap(containerId, data, anomalies, hourField, valueField, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Prepare data structure for heatmap
    const hours = Array.from(Array(24).keys());
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize heatmap values
    const zValues = Array(7).fill().map(() => Array(24).fill(0));
    const zCounts = Array(7).fill().map(() => Array(24).fill(0));
    
    // Populate heatmap values
    data.forEach((d, i) => {
        if (anomalies[i] === 1) {
            const hour = d[hourField] % 24;
            const day = d.dayofweek !== undefined ? d.dayofweek : 0;
            
            zValues[day][hour] += 1;
            zCounts[day][hour] += 1;
        }
    });
    
    // Create heatmap trace
    const heatmapTrace = {
        z: zValues,
        x: hours,
        y: days,
        type: 'heatmap',
        colorscale: [
            [0, chartColors.background],
            [0.01, chartColors.primary],
            [0.5, chartColors.warning],
            [1, chartColors.danger]
        ],
        showscale: true,
        hovertemplate: 'Day: %{y}<br>Hour: %{x}<br>Anomalies: %{z}<extra></extra>'
    };
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 50, b: 50, l: 100 },
        xaxis: {
            title: 'Hour of Day',
            tickvals: hours,
            ticktext: hours.map(h => h.toString()),
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        yaxis: {
            title: 'Day of Week',
            gridcolor: chartColors.grid,
            color: chartColors.text
        }
    };
    
    // Responsive configuration
    const config = {
        responsive: true
    };
    
    // Create chart
    Plotly.newPlot(containerId, [heatmapTrace], layout, config);
}

/**
 * Create a radar chart for model performance comparison
 * @param {string} containerId - The ID of the container element
 * @param {Object} metrics - Object containing model metrics
 * @param {string} title - Chart title
 */
function createMetricsRadarChart(containerId, metrics, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Metrics to display
    const metricNames = ['Accuracy', 'Precision', 'Recall', 'F1 Score'];
    const metricValues = [
        metrics.accuracy || 0,
        metrics.precision || 0,
        metrics.recall || 0,
        metrics.f1_score || 0
    ];
    
    // Create radar chart
    const data = [{
        type: 'scatterpolar',
        r: metricValues,
        theta: metricNames,
        fill: 'toself',
        fillcolor: `${chartColors.primary}50`,
        line: {
            color: chartColors.primary
        },
        name: 'Performance Metrics'
    }];
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 1],
                color: chartColors.text
            },
            angularaxis: {
                color: chartColors.text
            },
            bgcolor: chartColors.background
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 50, b: 50, l: 50 }
    };
    
    // Responsive configuration
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create chart
    Plotly.newPlot(containerId, data, layout, config);
}

/**
 * Create an algorithm comparison bar chart
 * @param {string} containerId - The ID of the container element
 * @param {Object} algorithms - Object with algorithm names as keys and anomaly counts as values
 * @param {string} title - Chart title
 */
function createAlgorithmComparisonChart(containerId, algorithms, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Prepare data
    const algoNames = Object.keys(algorithms);
    const anomalyCounts = Object.values(algorithms);
    
    // Create bar chart
    const data = [{
        x: algoNames,
        y: anomalyCounts,
        type: 'bar',
        marker: {
            color: [chartColors.primary, chartColors.warning, chartColors.danger],
            line: {
                width: 1,
                color: '#ffffff'
            }
        }
    }];
    
    // Layout configuration
    const layout = {
        title: {
            text: title,
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 20, b: 50, l: 50 },
        xaxis: {
            title: 'Algorithm',
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        yaxis: {
            title: 'Anomalies Detected',
            gridcolor: chartColors.grid,
            color: chartColors.text
        }
    };
    
    // Responsive configuration
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create chart
    Plotly.newPlot(containerId, data, layout, config);
}

/**
 * Create a dynamic animated chart for the get started page
 * @param {string} containerId - The ID of the container element
 */
function createDynamicEnergyChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Generate synthetic data
    const timePoints = 100;
    const time = Array.from(Array(timePoints).keys());
    
    // Create sine wave with noise
    const baseValue = 50;
    const amplitude = 20;
    const frequency = 0.1;
    const noiseLevel = 5;
    
    // Function to generate values
    const generateValues = () => {
        return time.map(t => {
            const sineValue = baseValue + amplitude * Math.sin(frequency * t);
            const noise = noiseLevel * (Math.random() - 0.5);
            return sineValue + noise;
        });
    };
    
    // Add anomalies
    const addAnomalies = (values) => {
        const anomalyPositions = [20, 40, 60, 80];
        const anomalyValues = [...values];
        
        anomalyPositions.forEach(pos => {
            anomalyValues[pos] = values[pos] + amplitude * 1.5;
        });
        
        return anomalyValues;
    };
    
    // Generate initial values
    let energyValues = generateValues();
    energyValues = addAnomalies(energyValues);
    
    // Create normal trace
    const normalValues = time.filter(t => ![20, 40, 60, 80].includes(t));
    const normalTrace = {
        x: normalValues,
        y: normalValues.map(t => energyValues[t]),
        mode: 'markers',
        type: 'scatter',
        name: 'Normal',
        marker: {
            color: chartColors.primary,
            size: 8
        }
    };
    
    // Create anomaly trace
    const anomalyValues = [20, 40, 60, 80];
    const anomalyTrace = {
        x: anomalyValues,
        y: anomalyValues.map(t => energyValues[t]),
        mode: 'markers',
        type: 'scatter',
        name: 'Anomaly',
        marker: {
            color: chartColors.danger,
            size: 12,
            symbol: 'circle-open',
            line: {
                width: 2,
                color: chartColors.danger
            }
        }
    };
    
    // Create line trace
    const lineTrace = {
        x: time,
        y: energyValues,
        mode: 'lines',
        type: 'scatter',
        name: 'Energy Usage',
        line: {
            color: chartColors.info,
            width: 2
        }
    };
    
    // Create layout
    const layout = {
        title: {
            text: 'Energy Consumption Pattern',
            font: {
                color: chartColors.text,
                size: 18
            }
        },
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        margin: { t: 50, r: 20, b: 50, l: 50 },
        xaxis: {
            title: 'Time',
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        yaxis: {
            title: 'Energy Usage (kW)',
            gridcolor: chartColors.grid,
            color: chartColors.text
        },
        legend: {
            x: 1,
            y: 1,
            font: {
                color: chartColors.text
            }
        }
    };
    
    // Create initial plot
    Plotly.newPlot(containerId, [lineTrace, normalTrace, anomalyTrace], layout, {responsive: true});
    
    // Update function for animation
    function updateChart() {
        // Generate new values
        energyValues = generateValues();
        energyValues = addAnomalies(energyValues);
        
        // Update traces
        Plotly.update(containerId, {
            'y': [energyValues, normalValues.map(t => energyValues[t]), anomalyValues.map(t => energyValues[t])]
        });
        
        // Schedule next update
        setTimeout(updateChart, 3000);
    }
    
    // Start animation
    setTimeout(updateChart, 3000);
}
