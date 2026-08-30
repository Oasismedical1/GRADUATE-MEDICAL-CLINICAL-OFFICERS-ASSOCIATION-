document.addEventListener("DOMContentLoaded", () => {
  checkSession();
  document.getElementById("admin-login-form").addEventListener("submit", login);
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("income-form").addEventListener("submit", (e) => addTransaction(e, "Income"));
  document.getElementById("expenditure-form").addEventListener("submit", (e) => addTransaction(e, "Expenditure"));
});

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) showDashboard();
}

async function login(e) {
  e.preventDefault();
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  const note = document.getElementById("login-note");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    note.textContent = "Login failed — check your email and password.";
    note.style.color = "#B3261E";
    return;
  }
  showDashboard();
}

async function logout() {
  await supabaseClient.auth.signOut();
  document.getElementById("admin-dashboard").style.display = "none";
  document.getElementById("admin-login").style.display = "block";
}

function showDashboard() {
  document.getElementById("admin-login").style.display = "none";
  document.getElementById("admin-dashboard").style.display = "block";
  loadFinanceData();
}

async function addTransaction(e, type) {
  e.preventDefault();
  const form = e.target;
  const { data: { session } } = await supabaseClient.auth.getSession();

  const payload = {
    type,
    category: form.category.value,
    description: form.description.value.trim() || null,
    amount: parseFloat(form.amount.value),
    payment_method: form.payment_method.value,
    transaction_date: form.transaction_date.value || new Date().toISOString().slice(0, 10),
    membership_number: form.membership_number ? form.membership_number.value.trim() || null : null,
    recorded_by: session?.user?.email || null,
  };

  const { error } = await supabaseClient.from("finance_transactions").insert(payload);

  if (error) {
    alert("Failed to save: " + error.message);
    return;
  }
  form.reset();
  loadFinanceData();
}

async function loadFinanceData() {
  const { data, error } = await supabaseClient
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Failed to load finance data:", error);
    document.getElementById("tx-list").innerHTML = `<p class="card-empty">Something went wrong loading transactions.</p>`;
    return;
  }

  renderSummary(data || []);
  renderTransactions(data || []);
}

function renderSummary(transactions) {
  const income = transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenditure = transactions.filter((t) => t.type === "Expenditure").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expenditure;

  document.getElementById("total-income").textContent = formatUGX(income);
  document.getElementById("total-expenditure").textContent = formatUGX(expenditure);
  document.getElementById("total-balance").textContent = formatUGX(balance);
}

function renderTransactions(transactions) {
  const list = document.getElementById("tx-list");

  if (transactions.length === 0) {
    list.innerHTML = `<p class="card-empty">No transactions recorded yet.</p>`;
    return;
  }

  const rows = transactions.slice(0, 50).map((t) => `
    <tr>
      <td>${new Date(t.transaction_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
      <td>${escapeHtmlF(t.category)}</td>
      <td>${escapeHtmlF(t.description || "—")}</td>
      <td>${escapeHtmlF(t.payment_method || "—")}</td>
      <td class="amt-${t.type.toLowerCase()}">${t.type === "Income" ? "+" : "−"}${formatUGX(t.amount)}</td>
    </tr>`).join("");

  list.innerHTML = `
    <div class="tx-table-wrap">
      <table class="tx-table">
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Method</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function formatUGX(n) {
  return "UGX " + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function escapeHtmlF(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
