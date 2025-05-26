let budget = 0;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let filteredExpenses = [];

document.getElementById('date').valueAsDate = new Date();

const categoryIcons = {
  food: '🍔',
  transportation: '🚗',
  entertainment: '🎬',
  shopping: '🛍️',
  utilities: '⚡',
  healthcare: '🏥',
  education: '📚',
  other: '📦'
};

document.getElementById('expense-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!description || !category || !date || isNaN(amount) || amount <= 0) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const expense = {
    id: Date.now(),
    description,
    amount,
    category,
    date,
    timestamp: new Date(date).getTime()
  };

  expenses.push(expense);
  localStorage.setItem('expenses', JSON.stringify(expenses));

  updateDisplay();

  this.reset();
  document.getElementById('date').valueAsDate = new Date();
});

document.getElementById('filter-category').addEventListener('change', applyFilters);
document.getElementById('filter-date-from').addEventListener('change', applyFilters);
document.getElementById('filter-date-to').addEventListener('change', applyFilters);

function applyFilters() {
  const categoryFilter = document.getElementById('filter-category').value;
  const dateFromFilter = document.getElementById('filter-date-from').value;
  const dateToFilter = document.getElementById('filter-date-to').value;

  filteredExpenses = expenses.filter(expense => {
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesDateFrom = !dateFromFilter || expense.date >= dateFromFilter;
    const matchesDateTo = !dateToFilter || expense.date <= dateToFilter;
    return matchesCategory && matchesDateFrom && matchesDateTo;
  });

  displayExpenses();
}

function clearFilters() {
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  filteredExpenses = [...expenses];
  displayExpenses();
}

function deleteExpense(id) {
  expenses = expenses.filter(expense => expense.id !== id);
  localStorage.setItem('expenses', JSON.stringify(expenses));
  updateDisplay();
}

function updateDisplay() {
  filteredExpenses = [...expenses];
  displayExpenses();
  updateSummary();
  renderPieChart();
  updateBudgetStatus();
}

function displayExpenses() {
  const container = document.getElementById('expenses-container');
  if (filteredExpenses.length === 0) {
    container.innerHTML = '<div>No expenses found.</div>';
    return;
  }

  const sortedExpenses = filteredExpenses.sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = sortedExpenses.map(expense => `
    <div class="expense-item">
      <div>
        <div class="expense-description">${categoryIcons[expense.category]} ${expense.description}</div>
        <div>${formatDate(expense.date)} • ${getCategoryName(expense.category)}</div>
      </div>
      <div>₹${expense.amount.toFixed(2)}</div>
      <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
    </div>
  `).join('');
}

function updateSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todayTotal = expenses
    .filter(expense => expense.date === todayStr)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthTotal = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  document.getElementById('total-amount').textContent = `₹${total.toFixed(2)}`;
  document.getElementById('today-amount').textContent = `₹${todayTotal.toFixed(2)}`;
  document.getElementById('month-amount').textContent = `₹${monthTotal.toFixed(2)}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getCategoryName(category) {
  const names = {
    food: 'Food & Dining',
    transportation: 'Transportation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    utilities: 'Utilities',
    healthcare: 'Healthcare',
    education: 'Education',
    other: 'Other'
  };
  return names[category] || category;
}

let pieChart;
function renderPieChart() {
  const ctx = document.getElementById('category-pie-chart').getContext('2d');
  const categoryTotals = {};

  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += expense.amount;
  });

  const labels = Object.keys(categoryTotals).map(cat => getCategoryName(cat));
  const data = Object.values(categoryTotals);
  const backgroundColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
    '#F44336', '#3F51B5', '#00BCD4', '#795548'
  ];

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}
function clearLocalStorage() {
  localStorage.removeItem('expenses');
  localStorage.removeItem('budget');
  // Reset variables & UI
  expenses = [];
  budget = 0;
  document.getElementById('budget-input').value = '';
  updateDisplay();
  updateBudgetStatus();
  alert('Data Reseted!');
}


function setBudget() {
  const budgetValue = parseFloat(document.getElementById("budget-input").value);
  if (!isNaN(budgetValue) && budgetValue >= 0) {
    budget = budgetValue;
    localStorage.setItem("budget", budgetValue);
    updateBudgetStatus();
  } else {
    alert("Please enter a valid budget value");
  }
}

function updateBudgetStatus() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget - total;

  document.getElementById('total-spent').textContent = total.toFixed(2);
  document.getElementById('remaining-budget').textContent = remaining.toFixed(2);

  const messageEl = document.getElementById('budget-message');
  if (budget === 0) {
    messageEl.textContent = "No budget set.";
    messageEl.style.color = "gray";
  } else if (remaining < 0) {
    messageEl.textContent = "Over budget!";
    messageEl.style.color = "red";
  } else {
    messageEl.textContent = "Within budget";
    messageEl.style.color = "green";
  }
}

const savedBudget = localStorage.getItem('budget');
if (savedBudget) {
  budget = parseFloat(savedBudget);
  document.getElementById('budget-input').value = budget;
}

updateDisplay();
updateBudgetStatus();