// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const monthlyContributionInput = document.getElementById('monthlyContribution');
const expectedReturnInput = document.getElementById('expectedReturn');
const currentAgeInput = document.getElementById('currentAge');
const retirementAgeInput = document.getElementById('retirementAge');

const monthlyContributionBubble = document.getElementById('monthlyContributionValue');
const expectedReturnBubble = document.getElementById('expectedReturnValue');
const currentAgeBubble = document.getElementById('currentAgeValue');
const retirementAgeBubble = document.getElementById('retirementAgeValue');

const totalContributionEl = document.getElementById('totalContribution');
const totalReturnsEl = document.getElementById('totalReturns');
const corpusAtRetirementEl = document.getElementById('corpusAtRetirement');

const yearlyTableBody = document.querySelector('#yearlyTable tbody');

function updateBubbles() {
    monthlyContributionBubble.className = 'value-bubble';
    monthlyContributionBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(monthlyContributionInput.value).toLocaleString('en-IN')}</span>`;
    
    expectedReturnBubble.className = 'value-bubble';
    expectedReturnBubble.innerHTML = `<span class='bubble-number'>${parseFloat(expectedReturnInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    currentAgeBubble.className = 'value-bubble';
    currentAgeBubble.innerHTML = `<span class='bubble-number'>${parseInt(currentAgeInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
    
    retirementAgeBubble.className = 'value-bubble';
    retirementAgeBubble.innerHTML = `<span class='bubble-number'>${parseInt(retirementAgeInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateNPS() {
    const monthlyContribution = parseFloat(monthlyContributionInput.value);
    const annualReturn = parseFloat(expectedReturnInput.value) / 100;
    const currentAge = parseInt(currentAgeInput.value);
    const retirementAge = parseInt(retirementAgeInput.value);
    const years = retirementAge - currentAge;
    
    let totalContribution = 0;
    let totalValue = 0;
    let yearlyBreakdown = [];
    
    for (let year = 1; year <= years; year++) {
        const yearlyContribution = monthlyContribution * 12;
        totalContribution += yearlyContribution;
        
        const openingBalance = totalValue;
        const interestEarned = (openingBalance + yearlyContribution) * annualReturn;
        totalValue = openingBalance + yearlyContribution + interestEarned;
        
        yearlyBreakdown.push({
            year,
            age: currentAge + year,
            contribution: yearlyContribution,
            interestEarned,
            totalValue
        });
    }
    
    return {
        totalContribution,
        totalReturns: totalValue - totalContribution,
        corpusAtRetirement: totalValue,
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
            <td>${formatINR(year.contribution)}</td>
            <td>${formatINR(year.interestEarned)}</td>
            <td>${formatINR(year.totalValue)}</td>
        `;
        yearlyTableBody.appendChild(row);
    });
}

function updateSummary() {
    const { totalContribution, totalReturns, corpusAtRetirement, yearlyBreakdown } = calculateNPS();
    
    totalContributionEl.textContent = formatINR(totalContribution);
    totalReturnsEl.textContent = formatINR(totalReturns);
    corpusAtRetirementEl.textContent = formatINR(corpusAtRetirement);
    
    updateYearlyTable(yearlyBreakdown);
}

function handleInput() {
    updateBubbles();
    updateSummary();
}

// Event Listeners
monthlyContributionInput.addEventListener('input', handleInput);
expectedReturnInput.addEventListener('input', handleInput);
currentAgeInput.addEventListener('input', handleInput);
retirementAgeInput.addEventListener('input', handleInput);

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
makeEditable(monthlyContributionBubble, monthlyContributionInput, 'money');
makeEditable(expectedReturnBubble, expectedReturnInput, 'percent');
makeEditable(currentAgeBubble, currentAgeInput, 'years');
makeEditable(retirementAgeBubble, retirementAgeInput, 'years');

// Initial render
updateBubbles();
updateSummary(); 