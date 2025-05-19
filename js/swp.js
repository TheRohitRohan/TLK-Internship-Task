// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const corpusInput = document.getElementById('corpusAmount');
const withdrawalInput = document.getElementById('monthlyWithdrawal');
const returnInput = document.getElementById('expectedReturn');

const corpusBubble = document.getElementById('corpusAmountValue');
const withdrawalBubble = document.getElementById('monthlyWithdrawalValue');
const returnBubble = document.getElementById('expectedReturnValue');

const corpusAmountEl = document.getElementById('corpusAmount');
const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
const remainingCorpusEl = document.getElementById('remainingCorpus');

let chart;

function updateBubbles() {
    corpusBubble.className = 'sip-value-bubble money';
    corpusBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(corpusInput.value).toLocaleString('en-IN')}</span>`;
    
    withdrawalBubble.className = 'sip-value-bubble money';
    withdrawalBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(withdrawalInput.value).toLocaleString('en-IN')}</span>`;
    
    returnBubble.className = 'sip-value-bubble percent';
    returnBubble.innerHTML = `<span class='bubble-number'>${parseFloat(returnInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
}

function calculateSWP() {
    const corpus = parseFloat(corpusInput.value);
    const monthlyWithdrawal = parseFloat(withdrawalInput.value);
    const annualReturn = parseFloat(returnInput.value) / 100;
    const monthlyReturn = annualReturn / 12;
    
    // Calculate how long the corpus will last
    let remainingCorpus = corpus;
    let totalWithdrawals = 0;
    let months = 0;
    
    while (remainingCorpus > 0 && months < 600) { // Max 50 years
        remainingCorpus = remainingCorpus * (1 + monthlyReturn) - monthlyWithdrawal;
        totalWithdrawals += monthlyWithdrawal;
        months++;
        
        if (remainingCorpus < 0) {
            remainingCorpus = 0;
            break;
        }
    }
    
    return {
        corpus,
        totalWithdrawals,
        remainingCorpus,
        months
    };
}

function updateSummaryAndChart() {
    const { corpus, totalWithdrawals, remainingCorpus } = calculateSWP();
    
    corpusAmountEl.textContent = formatINR(corpus);
    totalWithdrawalsEl.textContent = formatINR(totalWithdrawals);
    remainingCorpusEl.textContent = formatINR(remainingCorpus);

    // Chart.js donut
    const ctx = document.getElementById('swpChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Corpus amount', 'Total withdrawals'],
            datasets: [{
                data: [corpus, totalWithdrawals],
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
corpusInput.addEventListener('input', handleInput);
withdrawalInput.addEventListener('input', handleInput);
returnInput.addEventListener('input', handleInput);

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
makeEditable(corpusBubble, corpusInput, 'money');
makeEditable(withdrawalBubble, withdrawalInput, 'money');
makeEditable(returnBubble, returnInput, 'percent');

// Initial render
updateBubbles();
updateSummaryAndChart(); 