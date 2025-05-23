// Utility for Indian currency formatting
function formatINR(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// DOM Elements
const basicSalaryInput = document.getElementById('basicSalary');
const interestRateInput = document.getElementById('interestRate');
const timePeriodInput = document.getElementById('timePeriod');

const basicSalaryBubble = document.getElementById('basicSalaryValue');
const interestRateBubble = document.getElementById('interestRateValue');
const timePeriodBubble = document.getElementById('timePeriodValue');

const employeeContributionEl = document.getElementById('employeeContribution');
const employerContributionEl = document.getElementById('employerContribution');
const interestEarnedEl = document.getElementById('interestEarned');
const totalCorpusEl = document.getElementById('totalCorpus');

let chart;

function updateBubbles() {
    basicSalaryBubble.className = 'sip-value-bubble money';
    basicSalaryBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(basicSalaryInput.value).toLocaleString('en-IN')}</span>`;
    
    interestRateBubble.className = 'sip-value-bubble percent';
    interestRateBubble.innerHTML = `<span class='bubble-number'>${parseFloat(interestRateInput.value).toFixed(1)}</span><span class='bubble-suffix'>%</span>`;
    
    timePeriodBubble.className = 'sip-value-bubble years';
    timePeriodBubble.innerHTML = `<span class='bubble-number'>${parseInt(timePeriodInput.value)}</span><span class='bubble-suffix'>Yr</span>`;
}

function calculateEPF() {
    const basicSalary = parseFloat(basicSalaryInput.value);
    const interestRate = parseFloat(interestRateInput.value) / 100;
    const years = parseInt(timePeriodInput.value);
    
    // EPF contribution rates
    const employeeRate = 0.12; // 12% of basic salary
    const employerRate = 0.12; // 12% of basic salary
    
    const monthlyEmployeeContribution = basicSalary * employeeRate;
    const monthlyEmployerContribution = basicSalary * employerRate;
    
    // Calculate total contributions and interest
    let employeeTotal = 0;
    let employerTotal = 0;
    let interestEarned = 0;
    
    for (let year = 0; year < years; year++) {
        // Employee contribution
        employeeTotal += monthlyEmployeeContribution * 12;
        // Employer contribution
        employerTotal += monthlyEmployerContribution * 12;
        
        // Calculate interest on total corpus
        const totalCorpus = employeeTotal + employerTotal + interestEarned;
        interestEarned += totalCorpus * interestRate;
    }
    
    const totalCorpus = employeeTotal + employerTotal + interestEarned;
    
    return {
        employeeTotal,
        employerTotal,
        interestEarned,
        totalCorpus
    };
}

function updateSummaryAndChart() {
    const { employeeTotal, employerTotal, interestEarned, totalCorpus } = calculateEPF();
    
    employeeContributionEl.textContent = formatINR(employeeTotal);
    employerContributionEl.textContent = formatINR(employerTotal);
    interestEarnedEl.textContent = formatINR(interestEarned);
    totalCorpusEl.textContent = formatINR(totalCorpus);

    // Chart.js donut
    const ctx = document.getElementById('epfChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Employee contribution', 'Employer contribution', 'Interest earned'],
            datasets: [{
                data: [employeeTotal, employerTotal, interestEarned],
                backgroundColor: ['#e6fff7', '#3b82f6', '#f59e0b'],
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
basicSalaryInput.addEventListener('input', handleInput);
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
makeEditable(basicSalaryBubble, basicSalaryInput, 'money');
makeEditable(interestRateBubble, interestRateInput, 'percent');
makeEditable(timePeriodBubble, timePeriodInput, 'years');

// Initial render
updateBubbles();
updateSummaryAndChart(); 