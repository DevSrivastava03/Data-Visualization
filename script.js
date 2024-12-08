const API_KEY = 'IHHMVk2NW0JC588ovfZPMZC2pu01MuD6';
const TICKER = 'AAPL';

// Global state to manage chart interaction
let globalStockData = [];
let currentViewData = [];

// Fetch stock data for November to December 2024
async function fetchStockData() {
    const loading = document.getElementById('loading');
    const dateRangeInfo = document.getElementById('dateRangeInfo');
    
    try {
        loading.textContent = 'Loading stock data...';
        
        // Fetch stock data for AAPL from Nov 2024 to Dec 2024
        const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${TICKER}/range/1/day/2024-11-01/2024-12-31?apiKey=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('No stock data available');
        }
        
        // Process and store global stock data
        globalStockData = data.results.map(item => ({
            date: new Date(item.t),
            closePrice: item.c,
            volume: item.v,
            openPrice: item.o,
            highPrice: item.h,
            lowPrice: item.l
        })).sort((a, b) => a.date - b.date);

        // Set initial view to all data
        currentViewData = [...globalStockData];
        
        loading.textContent = '';
        dateRangeInfo.textContent = `Showing data from Nov 1, 2024 to Dec 31, 2024`;
        
        createRidgeChart();
        displayStockSummary(currentViewData);
    } catch (error) {
        loading.textContent = `Error: ${error.message}`;
        console.error('Fetch error:', error);
    }
}

// Create the ridge chart
function createRidgeChart() {
    const svg = d3.select('#stockChart');
    svg.selectAll("*").remove();  // Clear previous chart

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create X scale (time)
    const xScale = d3.scaleTime()
        .domain([d3.min(currentViewData, d => d.date), d3.max(currentViewData, d => d.date)])
        .range([0, innerWidth]);

    // Create Y scale (close price)
    const yScale = d3.scaleLinear()
        .domain([d3.min(currentViewData, d => d.closePrice), d3.max(currentViewData, d => d.closePrice)])
        .range([innerHeight, 0]);

    // Create an area generator for the ridge
    const area = d3.area()
        .x(d => xScale(d.date))
        .y0(innerHeight)
        .y1(d => yScale(d.closePrice))
        .curve(d3.curveBasis);  // Smooth the curve

    // Create a group for the ridge plot
    const ridgePath = chartArea.append('path')
        .datum(currentViewData)
        .attr('class', 'ridge')
        .attr('d', area)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7)
        .style('transition', 'fill 0.3s ease');  // Smooth transition for hover

    // Add hover effect to change color to green
    ridgePath.on('mouseover', function() {
        d3.select(this).attr('fill', 'green');  // Change to green on hover
    }).on('mouseout', function() {
        d3.select(this).attr('fill', 'steelblue');  // Change back to original color on mouseout
    });

    // X Axis
    const xAxis = chartArea.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    // Y Axis
    const yAxis = chartArea.append('g')
        .call(d3.axisLeft(yScale));
}

// Function to display stock summary
function displayStockSummary(data) {
    const stockInfo = document.getElementById('stockInfo');
    
    // Calculate summary statistics
    const closePrices = data.map(d => d.closePrice);
    const volumes = data.map(d => d.volume);
    
    stockInfo.innerHTML = `
        <strong>Ticker:</strong> ${TICKER}<br>
        <strong>Average Close Price:</strong> $${d3.mean(closePrices).toFixed(2)}<br>
        <strong>Lowest Close:</strong> $${d3.min(closePrices).toFixed(2)}<br>
        <strong>Highest Close:</strong> $${d3.max(closePrices).toFixed(2)}<br>
        <strong>Average Daily Volume:</strong> ${d3.mean(volumes).toLocaleString()}
    `;
}

// Initialize the application
function init() {
    fetchStockData(); // Fetch stock data for the date range
}

// Call initialization
init();
