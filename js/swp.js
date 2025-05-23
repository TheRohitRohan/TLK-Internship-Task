// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const totalInvestmentInput = document.getElementById('totalInvestment');
const monthlyWithdrawalInput = document.getElementById('monthlyWithdrawal');
const expectedReturnInput = document.getElementById('expectedReturn');
const timePeriodInput = document.getElementById('timePeriod');

const totalInvestmentBubble = document.getElementById('totalInvestmentValue');
const monthlyWithdrawalBubble = document.getElementById('monthlyWithdrawalValue');
const expectedReturnBubble = document.getElementById('expectedReturnValue');
const timePeriodBubble = document.getElementById('timePeriodValue');

const totalInvestmentEl = document.getElementById('totalInvestment');
const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
const finalValueEl = document.getElementById('finalValue');

const monthlyTableBody = document.querySelector('#monthlyTable tbody');

function updateBubbles() {
    totalInvestmentBubble.className = 'swp-value-bubble';
    totalInvestmentBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(totalInvestmentInput.value).toLocaleString('en-IN')}</span>`;
    
    monthlyWithdrawalBubble.className = 'swp-value-bubble';
    monthlyWithdrawalBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(monthlyWithdrawalInput.value).toLocaleString('en-IN')}</span>`;
    
    expectedReturnBubble.className = 'swp-value-bubble';
    expectedReturnBubble.innerHTML = `<span class='bubble-number'>${parseFloat(expectedReturnInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    timePeriodBubble.className = 'swp-value-bubble';
    timePeriodBubble.innerHTML = `<span class='bubble-number'>${parseInt(timePeriodInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateSWP() {
    const totalInvestment = parseFloat(totalInvestmentInput.value);
    const monthlyWithdrawal = parseFloat(monthlyWithdrawalInput.value);
    const annualReturn = parseFloat(expectedReturnInput.value) / 100;
    const months = parseInt(timePeriodInput.value) * 12;
    
    let balance = totalInvestment;
    let totalWithdrawals = 0;
    let monthlyBreakdown = [];
    
    for (let month = 1; month <= months; month++) {
        const openingBalance = balance;
        const interestEarned = balance * (annualReturn / 12);
        balance = openingBalance + interestEarned - monthlyWithdrawal;
        totalWithdrawals += monthlyWithdrawal;
        
        monthlyBreakdown.push({
            month,
            openingBalance,
            withdrawal: monthlyWithdrawal,
            interestEarned,
            closingBalance: balance
        });
        
        if (balance <= 0) break;
    }
    
    return {
        totalInvestment,
        totalWithdrawals,
        finalValue: balance > 0 ? balance : 0,
        monthlyBreakdown
    };
}

function updateMonthlyTable(breakdown) {
    monthlyTableBody.innerHTML = '';
    breakdown.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month.month}</td>
            <td>${formatINR(month.openingBalance)}</td>
            <td>${formatINR(month.withdrawal)}</td>
            <td>${formatINR(month.interestEarned)}</td>
            <td>${formatINR(month.closingBalance)}</td>
        `;
        monthlyTableBody.appendChild(row);
    });
}

function updateSummary() {
    const { totalInvestment, totalWithdrawals, finalValue, monthlyBreakdown } = calculateSWP();
    
    totalInvestmentEl.textContent = formatINR(totalInvestment);
    totalWithdrawalsEl.textContent = formatINR(totalWithdrawals);
    finalValueEl.textContent = formatINR(finalValue);
    
    updateMonthlyTable(monthlyBreakdown);
}

function handleInput() {
    updateBubbles();
    updateSummary();
}

// Event Listeners
totalInvestmentInput.addEventListener('input', handleInput);
monthlyWithdrawalInput.addEventListener('input', handleInput);
expectedReturnInput.addEventListener('input', handleInput);
timePeriodInput.addEventListener('input', handleInput);

// Editable value bubbles
function makeEditable(bubble, input, type) {
    bubble.addEventListener('click', function () {
        if (bubble.classList.contains('editing')) return;
        bubble.classList.add('editing');
        let min = input.min, max = input.max, step = input.step;
        let valueStr = input.value;
        let prefix = '', suffix = '', bubbleClass = 'swp-value-bubble editing';
        if (type === 'money') { valueStr = parseInt(valueStr); prefix = '<span class="bubble-prefix">₹</span>'; }
        if (type === 'percent') { valueStr = parseFloat(valueStr).toFixed(1); suffix = '<span class="bubble-suffix">%</span>'; }
        if (type === 'years') { valueStr = parseInt(valueStr); suffix = '<span class="bubble-suffix">Yr</span>'; }
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
            updateSummary();
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
makeEditable(totalInvestmentBubble, totalInvestmentInput, 'money');
makeEditable(monthlyWithdrawalBubble, monthlyWithdrawalInput, 'money');
makeEditable(expectedReturnBubble, expectedReturnInput, 'percent');
makeEditable(timePeriodBubble, timePeriodInput, 'years');

// Initial render
updateBubbles();
updateSummary(); 