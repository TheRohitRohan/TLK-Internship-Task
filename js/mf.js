// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const investmentInput = document.getElementById('investmentAmount');
const currentValueInput = document.getElementById('currentValue');
const periodInput = document.getElementById('timePeriod');

const investmentBubble = document.getElementById('investmentAmountValue');
const currentValueBubble = document.getElementById('currentValueValue');
const periodBubble = document.getElementById('timePeriodValue');

const investedAmountEl = document.getElementById('investedAmount');
const returnsEl = document.getElementById('returns');
const totalValueEl = document.getElementById('totalValue');
const annualizedReturnEl = document.getElementById('annualizedReturn');

let chart;

function updateBubbles() {
    investmentBubble.className = 'sip-value-bubble money';
    investmentBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(investmentInput.value).toLocaleString('en-IN')}</span>`;
    
    currentValueBubble.className = 'sip-value-bubble money';
    currentValueBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(currentValueInput.value).toLocaleString('en-IN')}</span>`;
    
    periodBubble.className = 'sip-value-bubble years';
    periodBubble.innerHTML = `<span class='bubble-number'>${parseInt(periodInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateMFReturns() {
    const investment = parseFloat(investmentInput.value);
    const currentValue = parseFloat(currentValueInput.value);
    const years = parseFloat(periodInput.value);
    
    const returns = currentValue - investment;
    
    // Calculate annualized return (CAGR)
    const annualizedReturn = (Math.pow(currentValue / investment, 1 / years) - 1) * 100;
    
    return {
        investment,
        returns,
        currentValue,
        annualizedReturn
    };
}

function updateSummaryAndChart() {
    const { investment, returns, currentValue, annualizedReturn } = calculateMFReturns();
    
    investedAmountEl.textContent = formatINR(investment);
    returnsEl.textContent = formatINR(returns);
    totalValueEl.textContent = formatINR(currentValue);
    annualizedReturnEl.textContent = `${annualizedReturn.toFixed(2)}%`;

    // Chart.js donut
    const ctx = document.getElementById('mfChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Investment amount', 'Returns'],
            datasets: [{
                data: [investment, returns],
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
investmentInput.addEventListener('input', handleInput);
currentValueInput.addEventListener('input', handleInput);
periodInput.addEventListener('input', handleInput);

// Editable value bubbles
function makeEditable(bubble, input, type) {
    bubble.addEventListener('click', function () {
        if (bubble.classList.contains('editing')) return;
        bubble.classList.add('editing');
        let min = input.min, max = input.max, step = input.step;
        let valueStr = input.value;
        let prefix = '', suffix = '', bubbleClass = '';
        if (type === 'money') { valueStr = parseInt(valueStr); prefix = '<span class="bubble-prefix">₹</span>'; bubbleClass = 'sip-value-bubble money editing'; }
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
makeEditable(investmentBubble, investmentInput, 'money');
makeEditable(currentValueBubble, currentValueInput, 'money');
makeEditable(periodBubble, periodInput, 'years');

// Initial render
updateBubbles();
updateSummaryAndChart(); 