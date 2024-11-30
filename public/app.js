const fetchDatasetOnLaunch = async () => {
    try {
        const response = await fetch('/api/dataset');
        if (response.ok) {
            const data = await response.json();

            const averageCreditScore = calculateAverageCreditScore(data);
            const totalLoanApprovals = calculateTotalLoanApprovals(data);
            const averageAge = calculateAverageAge(data);
            const approvalRate = calculateApprovalRate(data);
            const averageLoanAmount = calculateAverageLoanAmount(data);
            const averageExperience = calculateAverageExperience(data);
            const homeOwnershipPercentages = calculateHomeOwnershipPercentages(data);
            const educationBreakdown = calculateEducationBreakdown(data);
            const loanIntentBreakdown = calculateLoanIntentBreakdown(data);
            const loanInterestRateDistribution = calculateLoanInterestRateDistribution(data);
            const defaultRate = calculateDefaultRate(data);

            displayLoanStatistics(averageCreditScore, totalLoanApprovals);
            displayAdditionalStatistics(averageAge, approvalRate, averageLoanAmount, averageExperience, homeOwnershipPercentages, educationBreakdown, loanIntentBreakdown, loanInterestRateDistribution, defaultRate);
        } else {
            console.error('Failed to fetch dataset:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching dataset:', error);
    }
};

const calculateAverageCreditScore = (data) => {
    const totalScore = data.reduce((sum, record) => sum + record.credit_score, 0);
    return (totalScore / data.length).toFixed(2); 
};

const calculateTotalLoanApprovals = (data) => {
    return data.filter(record => record.loan_status === 1).length;
};

const calculateAverageAge = (data) => {
    const totalAge = data.reduce((sum, record) => sum + record.person_age, 0);
    return (totalAge / data.length).toFixed(2); 
};

const calculateApprovalRate = (data) => {
    const totalApprovals = calculateTotalLoanApprovals(data);
    return ((totalApprovals / data.length) * 100).toFixed(2); 
};

const calculateAverageLoanAmount = (data) => {
    const totalLoanAmount = data.reduce((sum, record) => sum + record.loan_amnt, 0);
    return (totalLoanAmount / data.length).toFixed(2); 
};

const calculateAverageExperience = (data) => {
    const totalExperience = data.reduce((sum, record) => sum + record.person_emp_exp, 0);
    return (totalExperience / data.length).toFixed(2);
};

const calculateHomeOwnershipPercentages = (data) => {
    const renters = data.filter(record => record.person_home_ownership === 'RENT').length;
    const owners = data.filter(record => record.person_home_ownership === 'OWN').length;
    const renterPercentage = ((renters / data.length) * 100).toFixed(2);
    const ownerPercentage = ((owners / data.length) * 100).toFixed(2);
    return { renterPercentage, ownerPercentage };
};

const calculateEducationBreakdown = (data) => {
    const educationLevels = {
        'High School': 0,
        'Bachelor': 0,
        'Master': 0,
        'PhD': 0
    };

    data.forEach(record => {
        console.log(record.person_education);  // Inspect education values in the data
        if (educationLevels.hasOwnProperty(record.person_education)) {
            educationLevels[record.person_education] += 1;
        } else {
            console.warn(`Unexpected education level: ${record.person_education}`);
        }
    });

    const total = data.length;
    return Object.keys(educationLevels).map(level => ({
        level,
        percentage: ((educationLevels[level] / total) * 100).toFixed(2)
    }));
};


const calculateLoanIntentBreakdown = (data) => {
    const loanIntents = {
        'PERSONAL': 0,
        'EDUCATION': 0,
        'VENTURE': 0
    };

    data.forEach(record => {
        if (loanIntents.hasOwnProperty(record.loan_intent)) {
            loanIntents[record.loan_intent] += 1;
        } else {
            console.warn(`Unexpected loan intent: ${record.loan_intent}`);
        }
    });

    const total = data.length;
    return Object.keys(loanIntents).map(intent => ({
        intent,
        percentage: ((loanIntents[intent] / total) * 100).toFixed(2)
    }));
};

const calculateLoanInterestRateDistribution = (data) => {
    const lowInterest = data.filter(record => record.loan_int_rate < 7).length;
    const mediumInterest = data.filter(record => record.loan_int_rate >= 7 && record.loan_int_rate <= 15).length;
    const highInterest = data.filter(record => record.loan_int_rate > 15).length;
    const total = data.length;
    return {
        lowInterest: ((lowInterest / total) * 100).toFixed(2),
        mediumInterest: ((mediumInterest / total) * 100).toFixed(2),
        highInterest: ((highInterest / total) * 100).toFixed(2)
    };
};

const calculateDefaultRate = (data) => {
    const defaults = data.filter(record => record.previous_loan_defaults_on_file === 'Yes').length;
    return ((defaults / data.length) * 100).toFixed(2); 
};

const displayLoanStatistics = (avgCreditScore, totalApprovals) => {
    const scene = document.querySelector('a-scene');
  
    const avgScoreText = document.createElement('a-text');
    avgScoreText.setAttribute('value', `Average Credit Score: ${avgCreditScore}`);
    avgScoreText.setAttribute('position', '0 -2 -5'); 
    avgScoreText.setAttribute('color', 'white');
    avgScoreText.setAttribute('font', 'mozillavr');
    scene.appendChild(avgScoreText);
  
    const totalApprovalsText = document.createElement('a-text');
    totalApprovalsText.setAttribute('value', `Total Loan Approvals: ${totalApprovals}`);
    totalApprovalsText.setAttribute('position', '0 -2.5 -5'); 
    totalApprovalsText.setAttribute('color', 'green');
    totalApprovalsText.setAttribute('font', 'mozillavr');
    scene.appendChild(totalApprovalsText);
};


const displayAdditionalStatistics = (averageAge, approvalRate, averageLoanAmount, averageExperience, homeOwnershipPercentages, educationBreakdown, loanIntentBreakdown, loanInterestRateDistribution, defaultRate) => {
    const scene = document.querySelector('a-scene');
  
    displayText(scene, `Average Age: ${averageAge} years`, '0 -3 -5');
    displayText(scene, `Approval Rate: ${approvalRate}%`, '0 -3.5 -5');
    displayText(scene, `Average Loan Amount: $${averageLoanAmount}`, '0 -4 -5');
    displayText(scene, `Average Employment Experience: ${averageExperience} years`, '0 -4.5 -5');
    displayText(scene, `Renters: ${homeOwnershipPercentages.renterPercentage}%`, '5 -3 -5');
    displayText(scene, `Home Owners: ${homeOwnershipPercentages.ownerPercentage}%`, '5 -3.5 -5');
  
    educationBreakdown.forEach((level, index) => {
        displayText(scene, `${level.level}: ${level.percentage}%`, `5 ${-5 - index * 1} -5`);
    });
  
    
  
    const interestText = `Low Interest: ${loanInterestRateDistribution.lowInterest}% | Medium Interest: ${loanInterestRateDistribution.mediumInterest}% | High Interest: ${loanInterestRateDistribution.highInterest}%`;
    displayText(scene, interestText, '5 -8 -5');
  
    displayText(scene, `Default Rate: ${defaultRate}%`, '5 -8.5 -5');
};

const displayText = (scene, text, position) => {
    const textElement = document.createElement('a-text');
    textElement.setAttribute('value', text);
    textElement.setAttribute('position', position);
    textElement.setAttribute('color', 'white');
    textElement.setAttribute('font', 'mozillavr');
    scene.appendChild(textElement);
};

window.addEventListener('load', fetchDatasetOnLaunch);

window.addEventListener('load', async () => {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
  
        video.onloadedmetadata = async () => {
            if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                await fetchAndDisplayCharts(); // Fetch charts after video is ready
            } else {
                console.error('Video not ready');
            }
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
});

const fetchAndDisplayCharts = async () => {
    try {
        const response = await fetch('/api/chart-images'); 
        const data = await response.json(); 
  
        displayChartImage(data.chart1, 'chart1');
        displayChartImage(data.chart2, 'chart2');
        displayChartImage(data.chart3, 'chart3');
    } catch (error) {
        console.error('Error fetching charts:', error);
    }
};

const displayChartImage = (base64Image, chartId) => {
    const imageElement = document.createElement('a-image');
    imageElement.setAttribute('src', 'data:image/png;base64,' + base64Image); 
    imageElement.setAttribute('width', '5'); 
    imageElement.setAttribute('height', '5'); 
  
    let position;
    switch(chartId) {
      case 'chart1':
        position = '0 2 -5'; 
        break;
      case 'chart2':
        position = '7 2 -5'; 
        break;
      case 'chart3':
        position = '-7 2 -5'; 
        break;
      default:
        position = '0 2 -5'; 
    }
    imageElement.setAttribute('position', position); 
  
    imageElement.setAttribute('id', chartId); 
  
    const scene = document.querySelector('a-scene'); 
    scene.appendChild(imageElement); 
};
