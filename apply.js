document.addEventListener("DOMContentLoaded", () => {
  wireApplicationForm();
  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });
});

function wireApplicationForm() {
  const form = document.getElementById("apply-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    const status = document.getElementById("apply-form-note");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    // Drop empty-string optional fields so they store as null, not "".
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });

    const { error } = await supabaseClient
      .from("membership_applications")
      .insert(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";

    if (error) {
      console.error("Application submit failed:", error);
      status.textContent = "Something went wrong submitting your application. Please try again or email us directly.";
      status.style.color = "#B3261E";
    } else {
      status.textContent = "Application submitted! The Membership Committee will review it and notify you within 30 days, per the Constitution.";
      status.style.color = "var(--green)";
      form.reset();
      form.scrollIntoView({ behavior: "smooth" });
    }
  });
}
