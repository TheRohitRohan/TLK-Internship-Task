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
const hraReceivedInput = document.getElementById('hraReceived');
const rentPaidInput = document.getElementById('rentPaid');
const metroCitySelect = document.getElementById('metroCity');

const basicSalaryBubble = document.getElementById('basicSalaryValue');
const hraReceivedBubble = document.getElementById('hraReceivedValue');
const rentPaidBubble = document.getElementById('rentPaidValue');

const hraExemptionEl = document.getElementById('hraExemption');
const taxableHraEl = document.getElementById('taxableHra');
const annualTaxSavingEl = document.getElementById('annualTaxSaving');

const hraTableBody = document.querySelector('#hraTable tbody');

function updateBubbles() {
    basicSalaryBubble.className = 'value-bubble';
    basicSalaryBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(basicSalaryInput.value).toLocaleString('en-IN')}</span>`;
    
    hraReceivedBubble.className = 'value-bubble';
    hraReceivedBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(hraReceivedInput.value).toLocaleString('en-IN')}</span>`;
    
    rentPaidBubble.className = 'value-bubble';
    rentPaidBubble.innerHTML = `<span class='bubble-prefix'>₹</span><span class='bubble-number'>${parseInt(rentPaidInput.value).toLocaleString('en-IN')}</span>`;
}

function calculateHRA() {
    const basicSalary = parseFloat(basicSalaryInput.value);
    const hraReceived = parseFloat(hraReceivedInput.value);
    const rentPaid = parseFloat(rentPaidInput.value);
    const isMetroCity = metroCitySelect.value === 'yes';
    
    // Calculate HRA exemption based on three conditions
    const condition1 = hraReceived; // Actual HRA received
    const condition2 = rentPaid - (0.1 * basicSalary); // Rent paid - 10% of basic salary
    const condition3 = isMetroCity ? 0.5 * basicSalary : 0.4 * basicSalary; // 50% or 40% of basic salary
    
    const hraExemption = Math.min(condition1, Math.max(condition2, 0), condition3);
    const taxableHra = hraReceived - hraExemption;
    const annualTaxSaving = hraExemption * 0.3; // Assuming 30% tax bracket
    
    return {
        hraExemption,
        taxableHra,
        annualTaxSaving,
        details: [
            {
                component: 'Actual HRA received',
                amount: hraReceived,
                description: 'HRA component in your salary'
            },
            {
                component: 'Rent paid - 10% of basic',
                amount: condition2,
                description: 'Rent paid minus 10% of basic salary'
            },
            {
                component: isMetroCity ? '50% of basic salary' : '40% of basic salary',
                amount: condition3,
                description: isMetroCity ? '50% of basic salary for metro cities' : '40% of basic salary for non-metro cities'
            },
            {
                component: 'HRA exemption',
                amount: hraExemption,
                description: 'Least of the above three conditions'
            },
            {
                component: 'Taxable HRA',
                amount: taxableHra,
                description: 'HRA received minus HRA exemption'
            }
        ]
    };
}

function updateHRATable(details) {
    hraTableBody.innerHTML = '';
    details.forEach(detail => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${detail.component}</td>
            <td>${formatINR(detail.amount)}</td>
            <td>${detail.description}</td>
        `;
        hraTableBody.appendChild(row);
    });
}

function updateSummary() {
    const { hraExemption, taxableHra, annualTaxSaving, details } = calculateHRA();
    
    hraExemptionEl.textContent = formatINR(hraExemption);
    taxableHraEl.textContent = formatINR(taxableHra);
    annualTaxSavingEl.textContent = formatINR(annualTaxSaving);
    
    updateHRATable(details);
}

function handleInput() {
    updateBubbles();
    updateSummary();
}

// Event Listeners
basicSalaryInput.addEventListener('input', handleInput);
hraReceivedInput.addEventListener('input', handleInput);
rentPaidInput.addEventListener('input', handleInput);
metroCitySelect.addEventListener('change', handleInput);

// Editable value bubbles
function makeEditable(bubble, input, type) {
    bubble.addEventListener('click', function () {
        if (bubble.classList.contains('editing')) return;
        bubble.classList.add('editing');
        let min = input.min, max = input.max, step = input.step;
        let valueStr = input.value;
        let prefix = '', suffix = '', bubbleClass = 'value-bubble editing';
        if (type === 'money') { valueStr = parseInt(valueStr); prefix = '<span class="bubble-prefix">₹</span>'; }
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
makeEditable(basicSalaryBubble, basicSalaryInput, 'money');
makeEditable(hraReceivedBubble, hraReceivedInput, 'money');
makeEditable(rentPaidBubble, rentPaidInput, 'money');

// Initial render
updateBubbles();
updateSummary(); 