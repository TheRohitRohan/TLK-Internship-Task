// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const monthlyInvestmentInput = document.getElementById('monthlyInvestment');
const interestRateInput = document.getElementById('interestRate');
const timePeriodInput = document.getElementById('timePeriod');

const monthlyInvestmentBubble = document.getElementById('monthlyInvestmentValue');
const interestRateBubble = document.getElementById('interestRateValue');
const timePeriodBubble = document.getElementById('timePeriodValue');

const totalInvestmentEl = document.getElementById('totalInvestment');
const interestEarnedEl = document.getElementById('interestEarned');
const maturityValueEl = document.getElementById('maturityValue');

let chart;

function updateBubbles() {
    monthlyInvestmentBubble.className = 'sip-value-bubble money';
    monthlyInvestmentBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(monthlyInvestmentInput.value).toLocaleString('en-IN')}</span>`;
    
    interestRateBubble.className = 'sip-value-bubble percent';
    interestRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(interestRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    timePeriodBubble.className = 'sip-value-bubble months';
    timePeriodBubble.innerHTML = `<span class='bubble-number'>${parseInt(timePeriodInput.value)}</span><span class='bubble-suffix'>Mo</span>`;
}

function calculateRD() {
    const monthlyInvestment = parseFloat(monthlyInvestmentInput.value);
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const months = parseInt(timePeriodInput.value);
    
    const totalInvestment = monthlyInvestment * months;
    
    // Calculate maturity value using RD formula
    // M = P * (1 + r/n)^(n*t) + P * (1 + r/n)^(n*t-1) + ... + P * (1 + r/n)^(n*1)
    // where P = monthly investment, r = annual interest rate, n = 12 (monthly compounding), t = time in years
    let maturityValue = 0;
    for (let i = 1; i <= months; i++) {
        maturityValue += monthlyInvestment * Math.pow(1 + interestRate / 12, i);
    }
    
    const interestEarned = maturityValue - totalInvestment;
    
    return { totalInvestment, interestEarned, maturityValue };
}

function updateSummaryAndChart() {
    const { totalInvestment, interestEarned, maturityValue } = calculateRD();
    
    totalInvestmentEl.textContent = formatINR(totalInvestment);
    interestEarnedEl.textContent = formatINR(interestEarned);
    maturityValueEl.textContent = formatINR(maturityValue);

    // Chart.js donut
    const ctx = document.getElementById('rdChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total investment', 'Interest earned'],
            datasets: [{
                data: [totalInvestment, interestEarned],
                backgroundColor: ['#e6fff7', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                        color: '#888',
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${formatINR(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

function handleInput() {
    updateBubbles();
    updateSummaryAndChart();
}

// Event Listeners
monthlyInvestmentInput.addEventListener('input', handleInput);
interestRateInput.addEventListener('input', handleInput);
timePeriodInput.addEventListener('input', handleInput);

// Editable value bubbles
function makeEditable(bubble, input, type) {
    bubble.addEventListener('click', function () {
        if (bubble.classList.contains('editing')) return;
        bubble.classList.add('editing');
        let min = input.min, max = input.max, step = input.step;
        let valueStr = input.value;
        let prefix = '', suffix = '', bubbleClass = '';
        if (type === 'money') { valueStr = parseInt(valueStr); prefix = '<span class="bubble-prefix">₹</span>'; bubbleClass = 'sip-value-bubble money editing'; }
        if (type === 'percent') { valueStr = parseFloat(valueStr).toFixed(1); suffix = '<span class="bubble-suffix">%</span>'; bubbleClass = 'sip-value-bubble percent editing'; }
        if (type === 'months') { valueStr = parseInt(valueStr); suffix = '<span class="bubble-suffix">Mo</span>'; bubbleClass = 'sip-value-bubble months editing'; }
        bubble.className = bubbleClass;
        bubble.innerHTML = `${prefix}<input type="number" class="bubble-number" min="${min}" max="${max}" step="${step}" value="${valueStr}" />${suffix}`;
        const editInput = bubble.querySelector('input');
        editInput.focus();
        editInput.select();
        function finishEdit() {
            let newValue = editInput.value;
            if (type === 'money') {
                newValue = Math.max(parseInt(min), Math.min(parseInt(max), parseInt(newValue) || parseInt(min)));
                input.value = newValue;
            } else if (type === 'percent') {
                newValue = Math.max(parseFloat(min), Math.min(parseFloat(max), parseFloat(newValue) || parseFloat(min)));
                input.value = newValue;
            } else if (type === 'months') {
                newValue = Math.max(parseInt(min), Math.min(parseInt(max), parseInt(newValue) || parseInt(min)));
                input.value = newValue;
            }
            bubble.classList.remove('editing');
            updateBubbles();
            updateSummaryAndChart();
        }
        editInput.addEventListener('blur', finishEdit);
        editInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            }
            if (e.key === 'Escape') {
                bubble.classList.remove('editing');
                updateBubbles();
            }
        });
    });
}

// Make inputs editable
makeEditable(monthlyInvestmentBubble, monthlyInvestmentInput, 'money');
makeEditable(interestRateBubble, interestRateInput, 'percent');
makeEditable(timePeriodBubble, timePeriodInput, 'months');

// Initial render
updateBubbles();
updateSummaryAndChart(); 