const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const canvas = require('canvas');
const csv = require('csv-parser');
const unzipper = require('unzipper');
const kaggleCredentials = require('./kaggle.json');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');  // Import ChartJSNodeCanvas

const app = express();
const port = 302;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/chart-images', async (req, res) => {
  try {
    const dataset = 'taweilo/loan-approval-classification-data';
    const url = `https://www.kaggle.com/api/v1/datasets/download/${dataset}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${kaggleCredentials.key}` },
      responseType: 'arraybuffer',
    });

    const zipFilePath = path.join(__dirname, 'temp', 'loan_data.zip');
    fs.writeFileSync(zipFilePath, response.data);

    const extractedPath = path.join(__dirname, 'temp');
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractedPath }))
      .on('close', async () => {
        const csvFilePath = path.join(extractedPath, 'loan_data.csv');
        const results = await parseCsv(csvFilePath);

        const charts = await Promise.all([
          generateChartImage(results, 'approved-vs-denied'),
          generateChartImage(results, 'loan-amount-distribution'),
          generateChartImage(results, 'loan-term-distribution'),
        ]);

        res.json({
          chart1: charts[0],
          chart2: charts[1],
          chart3: charts[2],
        });
      })
      .on('error', (error) => {
        console.error('Error extracting ZIP file:', error);
        res.status(500).send('Error extracting ZIP file');
      });
  } catch (error) {
    console.error('Error fetching dataset:', error.message);
    res.status(500).send('Error fetching dataset');
  }
});

const parseCsv = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ',' }))
      .on('data', (data) => {
        const cleanedData = {};
        for (const key in data) {
          if (data.hasOwnProperty(key) && key !== '') {
            if (data[key] && !isNaN(data[key].replace(',', '.'))) {
              cleanedData[key] = parseFloat(data[key].replace(',', '.'));
            } else {
              cleanedData[key] = data[key];
            }
          }
        }
        results.push(cleanedData);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const generateChartImage = async (data, chartType) => {
  const width = 400; 
  const height = 400; 
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['Example Label 1', 'Example Label 2'], 
      datasets: [{
        data: [10, 20],
        backgroundColor: '#36a2eb',
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
    },
  };

  switch (chartType) {
    case 'approved-vs-denied':
      const approved = data.filter(item => item.loan_status === 1).length;
      const denied = data.filter(item => item.loan_status === 0).length;
      
      chartConfig.type = 'pie';
      chartConfig.data.labels = ['Approved', 'Denied'];
      chartConfig.data.datasets[0].data = [approved, denied];
      chartConfig.data.datasets[0].backgroundColor = ['#36a2eb', '#ff6384'];

      chartConfig.options.plugins = {
        ...chartConfig.options.plugins,
        tooltip: {
          enabled: false, 
        },
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          
          const centerX = chart.chartArea.left + chart.chartArea.width / 2;
          const centerY = chart.chartArea.top + chart.chartArea.height / 2;
          const padding = 20;

          ctx.fillStyle = '#000000';
          ctx.font = '16px Arial';
          ctx.fillText(`Approved: ${approved}`, centerX - padding, centerY + 40);
          ctx.fillText(`Denied: ${denied}`, centerX - padding, centerY + 60);

          ctx.restore();
        },
      };
      break;

      case 'loan-amount-distribution':
        const amounts = data.map(item => item.loan_amnt).filter(amount => !isNaN(amount)); 
        const bins = [0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000]; 
        
        const binLabels = bins.map((bin, index) => {
          if (index === bins.length - 1) {
            return `$${bin}+`;
          }
          return `$${bin} - $${bins[index + 1] - 1}`;
        });
        
        const binnedData = bins.map((bin, index) => {
          if (index === bins.length - 1) {
            return amounts.filter(amount => amount >= bin).length;
          }
          return amounts.filter(amount => amount >= bin && amount < bins[index + 1]).length;
        });
        
        chartConfig.type = 'bar';
        chartConfig.data.labels = binLabels;
        chartConfig.data.datasets[0] = {
          label: 'Loan Amount Distribution', 
          data: binnedData,
          backgroundColor: '#ff6384',
        };
        
        break;

    case 'loan-term-distribution':
  const terms = data
    .map(item => item.term) 
    .filter(term => term)  
    .map(term => term.trim()); 

  const termCounts = terms.reduce((counts, term) => {
    counts[term] = (counts[term] || 0) + 1;
    return counts;
  }, {});

  chartConfig.type = 'bar';
  chartConfig.data.labels = Object.keys(termCounts); 
  chartConfig.data.datasets[0] = { 
    label: 'Loan Term Distribution', 
    data: Object.values(termCounts), 
    backgroundColor: '#36a2eb',
  };
  break;

   


    default:
      throw new Error('Unknown chart type');
  }

  try {
    const chartImageBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
    return chartImageBuffer.toString('base64');
  } catch (error) {
    throw new Error('Error generating chart image: ' + error.message);
  }
};
app.get('/api/dataset', async (req, res) => {
  try {
    const dataset = 'taweilo/loan-approval-classification-data';
    const url = `https://www.kaggle.com/api/v1/datasets/download/${dataset}`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${kaggleCredentials.key}` },
      responseType: 'arraybuffer',
    });

    const zipFilePath = path.join(__dirname, 'temp', 'dataset.zip');
    fs.writeFileSync(zipFilePath, response.data);
    console.log(`Dataset saved to ${zipFilePath}`);

    const extractedPath = path.join(__dirname, 'temp');
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractedPath }))
      .on('close', () => {
        console.log('ZIP file extracted');

        const csvFilePath = path.join(extractedPath, 'loan_data.csv'); 
        const results = [];

        fs.createReadStream(csvFilePath)
          .pipe(csv())  
          .on('data', (data) => {
            const rowObject = {};
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                let value = data[key].trim();

                if (value && !isNaN(value.replace(',', '.'))) {
                  value = parseFloat(value.replace(',', '.'));
                }
                rowObject[key] = value;
              }
            }

            results.push(rowObject);
          })
          .on('end', () => {
            console.log('Dataset parsed and organized successfully.');
            res.json(results); 
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            res.status(500).send('Error parsing CSV file');
          });
      })
      .on('error', (error) => {
        console.error('Error extracting ZIP file:', error);
        res.status(500).send('Error extracting ZIP file');
      });
  } catch (error) {
    console.error('Error fetching dataset:', error.message);
    res.status(500).send('Error fetching dataset');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
