// ===============================
// GLOBAL USER ID
// ===============================
let user_id = localStorage.getItem("user_id");
let currentEditId = null;
let expenseChart = null;


// ===============================
// LOGIN
// ===============================
function login() {
    const login_id = document.getElementById("login_id").value;
    const password = document.getElementById("password").value;

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("user_id", data.user.id);
            window.location = "dashboard.html";
        } else {
            document.getElementById("msg").innerText = "Invalid Login";
        }
    });
}


// ===============================
// REGISTER
// ===============================
function register() {
    const login_id = document.getElementById("reg_login").value;
    const name = document.getElementById("reg_name").value;
    const password = document.getElementById("reg_password").value;

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id, name, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Registered Successfully");
            window.location = "login.html";
        } else {
            alert("Registration Failed");
        }
    });
}


// ===============================
// ADD EXPENSE
// ===============================
function addExpense() {

    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!amount || !category || !date) {
        alert("Please fill all fields");
        return;
    }

    fetch("/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, amount, category, date })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {

            document.getElementById("amount").value = "";
            document.getElementById("category").value = "";
            document.getElementById("date").value = "";

            loadExpenses();
        }
    });
}


// ===============================
// LOAD EXPENSES
// ===============================
function loadExpenses() {

    if (!user_id) return;

    const monthInput = document.getElementById("monthFilter");
    let url = `/expenses/${user_id}`;

    if (monthInput && monthInput.value) {
        url = `/expenses/${user_id}/${monthInput.value}`;
    }

    fetch(url)
    .then(res => res.json())
    .then(data => {

        let total = 0;
        data.forEach(exp => total += Number(exp.amount));

        // ✅ Update totals with ₹
        document.getElementById("total").innerText = "₹ " + total.toFixed(2);
        document.getElementById("monthlyTotal").innerText = "₹ " + total.toFixed(2);
        document.getElementById("entryCount").innerText = data.length;

        // ===== Expense List =====
        let list = document.getElementById("expenseList");
        list.innerHTML = "";

        data.forEach(exp => {
            list.innerHTML += `
                <li class="expense-row">
                    <span>${exp.category} - ₹${exp.amount}</span>

                    <div class="btn-group">
                        <button onclick="editExpense(${exp.id}, '${exp.amount}', '${exp.category}', '${exp.date}')">
                            Edit
                        </button>

                        <button onclick="deleteExpense(${exp.id})">
                            Delete
                        </button>
                    </div>
                </li>
            `;
        });

        loadChart(data);
        calculateMonthlyComparison(data);
    });
}


// ===============================
// EDIT EXPENSE (OPEN MODAL)
// ===============================
function editExpense(id, amount, category, date) {

    currentEditId = id;

    document.getElementById("editAmount").value = amount;
    document.getElementById("editCategory").value = category;
    document.getElementById("editDate").value = date;

    document.getElementById("editModal").style.display = "flex";
}


// ===============================
// CLOSE MODAL
// ===============================
function closeModal() {
    document.getElementById("editModal").style.display = "none";
}


// ===============================
// UPDATE EXPENSE
// ===============================
function updateExpense() {

    const newAmount = document.getElementById("editAmount").value;
    const newCategory = document.getElementById("editCategory").value;
    const newDate = document.getElementById("editDate").value;

    if (!newAmount || !newCategory || !newDate) {
        alert("All fields are required");
        return;
    }

    fetch(`/update-expense/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            amount: newAmount,
            category: newCategory,
            date: newDate
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal();
            loadExpenses();
        } else {
            alert("Update failed");
        }
    });
}


// ===============================
// DELETE EXPENSE
// ===============================
function deleteExpense(id) {

    if (!confirm("Delete this expense?")) return;

    fetch(`/delete-expense/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadExpenses();
        }
    });
}


// ===============================
// CHART FUNCTION
// ===============================
function loadChart(data) {

    const ctx = document.getElementById("expenseChart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    const categories = {};

    data.forEach(exp => {
        categories[exp.category] =
            (categories[exp.category] || 0) + parseFloat(exp.amount);
    });

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories)
            }]
        }
    });
}


// ===============================
// LOGOUT
// ===============================
function logout() {
    localStorage.removeItem("user_id");
    window.location = "login.html";
}


// ===============================
// AUTO LOAD
// ===============================
if (window.location.pathname.includes("dashboard.html")) {
    loadExpenses();
}

function calculateMonthlyComparison(data) {

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentTotal = 0;
    let lastTotal = 0;

    data.forEach(exp => {

        const expDate = new Date(exp.date);
        const expMonth = expDate.getMonth();
        const expYear = expDate.getFullYear();

        if (expMonth === currentMonth && expYear === currentYear) {
            currentTotal += Number(exp.amount);
        }

        if (
            expMonth === currentMonth - 1 &&
            expYear === currentYear
        ) {
            lastTotal += Number(exp.amount);
        }
    });

    // Update UI
    document.getElementById("currentMonthTotal").innerText =
        "₹ " + currentTotal.toFixed(2);

    document.getElementById("lastMonthTotal").innerText =
        "₹ " + lastTotal.toFixed(2);

    let percent = 0;

    if (lastTotal > 0) {
        percent = ((currentTotal - lastTotal) / lastTotal) * 100;
    }

    const percentElement = document.getElementById("percentageChange");

    percentElement.innerText = percent.toFixed(1) + "%";

    if (percent > 0) {
        percentElement.className = "positive";
        percentElement.innerText = "↑ " + percent.toFixed(1) + "%";
    } else if (percent < 0) {
        percentElement.className = "negative";
        percentElement.innerText = "↓ " + Math.abs(percent).toFixed(1) + "%";
    } else {
        percentElement.className = "";
    }
    loadComparisonChart(currentTotal, lastTotal);
}

function loadComparisonChart(currentTotal, lastTotal) {

    const ctx = document.getElementById("comparisonChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Last Month", "This Month"],
            datasets: [{
                data: [lastTotal, currentTotal]
            }]
        }
    });
}