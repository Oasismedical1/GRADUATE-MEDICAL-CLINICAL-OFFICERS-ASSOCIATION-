document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("status-form").addEventListener("submit", checkStatus);
  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });
});

async function checkStatus(e) {
  e.preventDefault();
  const form = e.target;
  const resultBox = document.getElementById("status-result");
  const trackingNumber = form.tracking_number.value.trim();
  const email = form.email.value.trim();

  resultBox.innerHTML = `<p class="verify-empty">Checking…</p>`;

  const { data, error } = await supabaseClient.rpc("check_application_status", {
    p_tracking_number: trackingNumber,
    p_email: email,
  });

  if (error) {
    console.error("Status check failed:", error);
    resultBox.innerHTML = `<p class="verify-empty">Something went wrong. Please try again or contact us directly.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    resultBox.innerHTML = `<p class="verify-empty">No application found with that tracking number and email. Double-check both and try again.</p>`;
    return;
  }

  const app = data[0];
  const statusClass = app.status.toLowerCase();
  const submitted = new Date(app.submitted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  resultBox.innerHTML = `
    <div class="verify-card">
      <div class="verify-badge ${statusClass === "approved" ? "active" : statusClass === "rejected" ? "expired" : "suspended"}">
        ${statusClass === "approved" ? "✓" : statusClass === "rejected" ? "!" : "•"}
      </div>
      <div>
        <span class="verify-status ${statusClass === "approved" ? "active" : statusClass === "rejected" ? "expired" : "suspended"}">${app.status}</span>
        <div class="verify-meta"><span>Submitted: ${submitted}</span></div>
      </div>
    </div>`;
}
