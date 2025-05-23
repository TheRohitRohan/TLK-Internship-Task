// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const investmentAmountInput = document.getElementById('investmentAmount');
const interestRateInput = document.getElementById('interestRate');
const timePeriodInput = document.getElementById('timePeriod');
const interestPayoutSelect = document.getElementById('interestPayout');

const investmentAmountBubble = document.getElementById('investmentAmountValue');
const interestRateBubble = document.getElementById('interestRateValue');
const timePeriodBubble = document.getElementById('timePeriodValue');

const principalAmountEl = document.getElementById('principalAmount');
const interestEarnedEl = document.getElementById('interestEarned');
const maturityValueEl = document.getElementById('maturityValue');

let chart;

function updateBubbles() {
    investmentAmountBubble.className = 'sip-value-bubble money';
    investmentAmountBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(investmentAmountInput.value).toLocaleString('en-IN')}</span>`;
    
    interestRateBubble.className = 'sip-value-bubble percent';
    interestRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(interestRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    timePeriodBubble.className = 'sip-value-bubble years';
    timePeriodBubble.innerHTML = `<span class='bubble-number'>${parseInt(timePeriodInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateFD() {
    const principal = parseFloat(investmentAmountInput.value);
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const years = parseInt(timePeriodInput.value);
    const payoutFrequency = interestPayoutSelect.value;
    
    let n; // Number of times interest is compounded per year
    switch (payoutFrequency) {
        case 'quarterly':
            n = 4;
            break;
        case 'halfYearly':
            n = 2;
            break;
        case 'yearly':
            n = 1;
            break;
        case 'maturity':
            n = 1;
            break;
    }
    
    // Calculate maturity value using compound interest formula
    const maturityValue = principal * Math.pow(1 + interestRate / n, n * years);
    const interestEarned = maturityValue - principal;
    
    return { principal, interestEarned, maturityValue };
}

function updateSummaryAndChart() {
    const { principal, interestEarned, maturityValue } = calculateFD();
    
    principalAmountEl.textContent = formatINR(principal);
    interestEarnedEl.textContent = formatINR(interestEarned);
    maturityValueEl.textContent = formatINR(maturityValue);

    // Chart.js donut
    const ctx = document.getElementById('fdChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal amount', 'Interest earned'],
            datasets: [{
                data: [principal, interestEarned],
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
investmentAmountInput.addEventListener('input', handleInput);
interestRateInput.addEventListener('input', handleInput);
timePeriodInput.addEventListener('input', handleInput);
interestPayoutSelect.addEventListener('change', handleInput);

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
makeEditable(investmentAmountBubble, investmentAmountInput, 'money');
makeEditable(interestRateBubble, interestRateInput, 'percent');
makeEditable(timePeriodBubble, timePeriodInput, 'years');

// Initial render
updateBubbles();
updateSummaryAndChart(); 