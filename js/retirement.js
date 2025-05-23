// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const currentAgeInput = document.getElementById('currentAge');
const retirementAgeInput = document.getElementById('retirementAge');
const monthlyExpensesInput = document.getElementById('monthlyExpenses');
const inflationRateInput = document.getElementById('inflationRate');
const returnRateInput = document.getElementById('returnRate');
const currentSavingsInput = document.getElementById('currentSavings');

const currentAgeBubble = document.getElementById('currentAgeValue');
const retirementAgeBubble = document.getElementById('retirementAgeValue');
const monthlyExpensesBubble = document.getElementById('monthlyExpensesValue');
const inflationRateBubble = document.getElementById('inflationRateValue');
const returnRateBubble = document.getElementById('returnRateValue');
const currentSavingsBubble = document.getElementById('currentSavingsValue');

const requiredCorpusEl = document.getElementById('requiredCorpus');
const monthlyInvestmentEl = document.getElementById('monthlyInvestment');
const totalInvestmentEl = document.getElementById('totalInvestment');

const yearlyTableBody = document.querySelector('#yearlyTable tbody');

function updateBubbles() {
    currentAgeBubble.className = 'value-bubble';
    currentAgeBubble.innerHTML = `<span class='bubble-number'>${parseInt(currentAgeInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
    
    retirementAgeBubble.className = 'value-bubble';
    retirementAgeBubble.innerHTML = `<span class='bubble-number'>${parseInt(retirementAgeInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
    
    monthlyExpensesBubble.className = 'value-bubble';
    monthlyExpensesBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(monthlyExpensesInput.value).toLocaleString('en-IN')}</span>`;
    
    inflationRateBubble.className = 'value-bubble';
    inflationRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(inflationRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    returnRateBubble.className = 'value-bubble';
    returnRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(returnRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    currentSavingsBubble.className = 'value-bubble';
    currentSavingsBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(currentSavingsInput.value).toLocaleString('en-IN')}</span>`;
}

function calculateRetirement() {
    const currentAge = parseInt(currentAgeInput.value);
    const retirementAge = parseInt(retirementAgeInput.value);
    const monthlyExpenses = parseFloat(monthlyExpensesInput.value);
    const inflationRate = parseFloat(inflationRateInput.value) / 100;
    const returnRate = parseFloat(returnRateInput.value) / 100;
    const currentSavings = parseFloat(currentSavingsInput.value);
    const yearsToRetirement = retirementAge - currentAge;
    
    // Calculate required corpus at retirement
    const monthlyExpensesAtRetirement = monthlyExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
    const yearlyExpensesAtRetirement = monthlyExpensesAtRetirement * 12;
    const requiredCorpus = yearlyExpensesAtRetirement * 25; // Using 25x rule for retirement corpus
    
    // Calculate future value of current savings
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + returnRate, yearsToRetirement);
    
    // Calculate additional corpus needed
    const additionalCorpusNeeded = requiredCorpus - futureValueOfCurrentSavings;
    
    // Calculate monthly investment needed
    const monthlyInvestment = (additionalCorpusNeeded * returnRate) / (12 * (Math.pow(1 + returnRate, yearsToRetirement * 12) - 1));
    
    // Calculate yearly breakdown
    let yearlyBreakdown = [];
    let totalInvestment = 0;
    let totalValue = currentSavings;
    
    for (let year = 1; year <= yearsToRetirement; year++) {
        const yearlyInvestment = monthlyInvestment * 12;
        totalInvestment += yearlyInvestment;
        
        const openingBalance = totalValue;
        const interestEarned = (openingBalance + yearlyInvestment) * returnRate;
        totalValue = openingBalance + yearlyInvestment + interestEarned;
        
        yearlyBreakdown.push({
            year,
            age: currentAge + year,
            investment: yearlyInvestment,
            returns: interestEarned,
            totalValue
        });
    }
    
    return {
        requiredCorpus,
        monthlyInvestment,
        totalInvestment,
        yearlyBreakdown
    };
}

function updateYearlyTable(breakdown) {
    yearlyTableBody.innerHTML = '';
    breakdown.forEach(year => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year.year}</td>
            <td>${year.age}</td>
            <td>${formatINR(year.investment)}</td>
            <td>${formatINR(year.returns)}</td>
            <td>${formatINR(year.totalValue)}</td>
        `;
        yearlyTableBody.appendChild(row);
    });
}

function updateSummary() {
    const { requiredCorpus, monthlyInvestment, totalInvestment, yearlyBreakdown } = calculateRetirement();
    
    requiredCorpusEl.textContent = formatINR(requiredCorpus);
    monthlyInvestmentEl.textContent = formatINR(monthlyInvestment);
    totalInvestmentEl.textContent = formatINR(totalInvestment);
    
    updateYearlyTable(yearlyBreakdown);
}

function handleInput() {
    updateBubbles();
    updateSummary();
}

// Event Listeners
currentAgeInput.addEventListener('input', handleInput);
retirementAgeInput.addEventListener('input', handleInput);
monthlyExpensesInput.addEventListener('input', handleInput);
inflationRateInput.addEventListener('input', handleInput);
returnRateInput.addEventListener('input', handleInput);
currentSavingsInput.addEventListener('input', handleInput);

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
makeEditable(currentAgeBubble, currentAgeInput, 'years');
makeEditable(retirementAgeBubble, retirementAgeInput, 'years');
makeEditable(monthlyExpensesBubble, monthlyExpensesInput, 'money');
makeEditable(inflationRateBubble, inflationRateInput, 'percent');
makeEditable(returnRateBubble, returnRateInput, 'percent');
makeEditable(currentSavingsBubble, currentSavingsInput, 'money');

// Initial render
updateBubbles();
updateSummary(); 