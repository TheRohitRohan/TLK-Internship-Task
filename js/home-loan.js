// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTenureInput = document.getElementById('loanTenure');

const loanAmountBubble = document.getElementById('loanAmountValue');
const interestRateBubble = document.getElementById('interestRateValue');
const loanTenureBubble = document.getElementById('loanTenureValue');

const monthlyEMIEl = document.getElementById('monthlyEMI');
const totalInterestEl = document.getElementById('totalInterest');
const totalPaymentEl = document.getElementById('totalPayment');

const yearlyTableBody = document.querySelector('#yearlyTable tbody');

function updateBubbles() {
    loanAmountBubble.className = 'value-bubble';
    loanAmountBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(loanAmountInput.value).toLocaleString('en-IN')}</span>`;
    
    interestRateBubble.className = 'value-bubble';
    interestRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(interestRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    loanTenureBubble.className = 'value-bubble';
    loanTenureBubble.innerHTML = `<span class='bubble-number'>${parseInt(loanTenureInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateEMI(principal, rate, tenure) {
    const monthlyRate = rate / 12 / 100;
    const numberOfPayments = tenure * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return emi;
}

function calculateHomeLoan() {
    const principal = parseFloat(loanAmountInput.value);
    const rate = parseFloat(interestRateInput.value);
    const tenure = parseInt(loanTenureInput.value);
    
    const monthlyEMI = calculateEMI(principal, rate, tenure);
    const totalPayment = monthlyEMI * tenure * 12;
    const totalInterest = totalPayment - principal;
    
    // Calculate yearly breakdown
    let yearlyBreakdown = [];
    let remainingLoan = principal;
    
    for (let year = 1; year <= tenure; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        
        for (let month = 1; month <= 12; month++) {
            const interestForMonth = remainingLoan * (rate / 12 / 100);
            const principalForMonth = monthlyEMI - interestForMonth;
            
            yearlyPrincipal += principalForMonth;
            yearlyInterest += interestForMonth;
            remainingLoan -= principalForMonth;
        }
        
        yearlyBreakdown.push({
            year,
            principalPaid: yearlyPrincipal,
            interestPaid: yearlyInterest,
            remainingLoan: Math.max(0, remainingLoan)
        });
    }
    
    return {
        monthlyEMI,
        totalInterest,
        totalPayment,
        yearlyBreakdown
    };
}

function updateYearlyTable(breakdown) {
    yearlyTableBody.innerHTML = '';
    breakdown.forEach(year => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year.year}</td>
            <td>${formatINR(year.principalPaid)}</td>
            <td>${formatINR(year.interestPaid)}</td>
            <td>${formatINR(year.remainingLoan)}</td>
        `;
        yearlyTableBody.appendChild(row);
    });
}

function updateSummary() {
    const { monthlyEMI, totalInterest, totalPayment, yearlyBreakdown } = calculateHomeLoan();
    
    monthlyEMIEl.textContent = formatINR(monthlyEMI);
    totalInterestEl.textContent = formatINR(totalInterest);
    totalPaymentEl.textContent = formatINR(totalPayment);
    
    updateYearlyTable(yearlyBreakdown);
}

function handleInput() {
    updateBubbles();
    updateSummary();
}

// Event Listeners
loanAmountInput.addEventListener('input', handleInput);
interestRateInput.addEventListener('input', handleInput);
loanTenureInput.addEventListener('input', handleInput);

// Editable value bubbles
function makeEditable(bubble, input, type) {
    bubble.addEventListener('click', function () {
        if (bubble.classList.contains('editing')) return;
        bubble.classList.add('editing');
        let min = input.min, max = input.max, step = input.step;
        let valueStr = input.value;
        let prefix = '', suffix = '', bubbleClass = 'value-bubble editing';
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
makeEditable(loanAmountBubble, loanAmountInput, 'money');
makeEditable(interestRateBubble, interestRateInput, 'percent');
makeEditable(loanTenureBubble, loanTenureInput, 'years');

// Initial render
updateBubbles();
updateSummary(); 