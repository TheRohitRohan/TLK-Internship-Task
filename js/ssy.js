// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const yearlyInvestmentInput = document.getElementById('yearlyInvestment');
const interestRateInput = document.getElementById('interestRate');
const ageInput = document.getElementById('age');

const yearlyInvestmentBubble = document.getElementById('yearlyInvestmentValue');
const interestRateBubble = document.getElementById('interestRateValue');
const ageBubble = document.getElementById('ageValue');

const totalInvestmentEl = document.getElementById('totalInvestment');
const interestEarnedEl = document.getElementById('interestEarned');
const maturityValueEl = document.getElementById('maturityValue');

let chart;

function updateBubbles() {
    yearlyInvestmentBubble.className = 'sip-value-bubble money';
    yearlyInvestmentBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(yearlyInvestmentInput.value).toLocaleString('en-IN')}</span>`;
    
    interestRateBubble.className = 'sip-value-bubble percent';
    interestRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(interestRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    ageBubble.className = 'sip-value-bubble years';
    ageBubble.innerHTML = `<span class='bubble-number'>${parseInt(ageInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateSSY() {
    const yearlyInvestment = parseFloat(yearlyInvestmentInput.value);
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const age = parseInt(ageInput.value);
    
    // SSY has a fixed tenure of 21 years from account opening
    const years = 21 - age;
    const totalInvestment = yearlyInvestment * years;
    
    // Calculate maturity value using compound interest formula
    let maturityValue = 0;
    for (let i = 0; i < years; i++) {
        maturityValue = (maturityValue + yearlyInvestment) * (1 + interestRate);
    }
    
    const interestEarned = maturityValue - totalInvestment;
    
    return { totalInvestment, interestEarned, maturityValue };
}

function updateSummaryAndChart() {
    const { totalInvestment, interestEarned, maturityValue } = calculateSSY();
    
    totalInvestmentEl.textContent = formatINR(totalInvestment);
    interestEarnedEl.textContent = formatINR(interestEarned);
    maturityValueEl.textContent = formatINR(maturityValue);

    // Chart.js donut
    const ctx = document.getElementById('ssyChart').getContext('2d');
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
yearlyInvestmentInput.addEventListener('input', handleInput);
interestRateInput.addEventListener('input', handleInput);
ageInput.addEventListener('input', handleInput);

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
        if (type === 'years') { valueStr = parseInt(valueStr); suffix = '<span class="bubble-suffix">Yr</span>'; bubbleClass = 'sip-value-bubble years editing'; }
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
            } else if (type === 'years') {
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
makeEditable(yearlyInvestmentBubble, yearlyInvestmentInput, 'money');
makeEditable(interestRateBubble, interestRateInput, 'percent');
makeEditable(ageBubble, ageInput, 'years');

// Initial render
updateBubbles();
updateSummaryAndChart(); 