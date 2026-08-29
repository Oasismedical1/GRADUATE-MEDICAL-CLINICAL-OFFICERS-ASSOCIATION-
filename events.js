let allEvents = [];
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let countdownTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  wireEventsControls();
  loadAllEvents();
  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });
});

function wireEventsControls() {
  document.getElementById("view-list-btn").addEventListener("click", () => switchView("list"));
  document.getElementById("view-cal-btn").addEventListener("click", () => switchView("calendar"));
  document.getElementById("event-type-filter").addEventListener("change", renderList);
  document.getElementById("cal-prev").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("cal-next").addEventListener("click", () => shiftMonth(1));
}

function switchView(view) {
  document.getElementById("view-list-btn").classList.toggle("active", view === "list");
  document.getElementById("view-cal-btn").classList.toggle("active", view === "calendar");
  document.getElementById("event-list-view").classList.toggle("hidden", view !== "list");
  document.getElementById("calendar-view").classList.toggle("active", view === "calendar");
  if (view === "calendar") renderCalendar();
}

async function loadAllEvents() {
  const { data, error } = await supabaseClient
    .from("events")
    .select("title,description,event_type,start_time,end_time,location,is_virtual,registration_url,image_url")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Events load failed:", error);
    document.getElementById("event-list-view").innerHTML = `<p class="card-empty">Something went wrong loading events.</p>`;
    return;
  }

  allEvents = data || [];
  populateTypeFilter();
  renderCountdown();
  renderList();
}

function populateTypeFilter() {
  const select = document.getElementById("event-type-filter");
  const types = [...new Set(allEvents.map((e) => e.event_type).filter(Boolean))];
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function renderCountdown() {
  const banner = document.getElementById("countdown-banner");
  const now = new Date();
  const next = allEvents.find((e) => new Date(e.start_time) > now);

  if (!next) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "flex";
  document.getElementById("cd-title").textContent = next.title;

  if (countdownTimer) clearInterval(countdownTimer);
  const tick = () => {
    const diff = new Date(next.start_time) - new Date();
    if (diff <= 0) {
      clearInterval(countdownTimer);
      document.getElementById("countdown-timer").innerHTML = `<div class="cd-unit"><span class="num">Now</span></div>`;
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById("countdown-timer").innerHTML = `
      <div class="cd-unit"><span class="num">${d}</span><span class="lbl">Days</span></div>
      <div class="cd-unit"><span class="num">${h}</span><span class="lbl">Hrs</span></div>
      <div class="cd-unit"><span class="num">${m}</span><span class="lbl">Min</span></div>
      <div class="cd-unit"><span class="num">${s}</span><span class="lbl">Sec</span></div>`;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function renderList() {
  const container = document.getElementById("event-list-view");
  const filterVal = document.getElementById("event-type-filter").value;
  const filtered = filterVal ? allEvents.filter((e) => e.event_type === filterVal) : allEvents;

  if (filtered.length === 0) {
    container.innerHTML = `<p class="card-empty">No events match this filter yet — add rows to the "events" table in Supabase.</p>`;
    return;
  }

  container.innerHTML = filtered.map(eventCard).join("");
}

function eventCard(e) {
  const d = new Date(e.start_time);
  const day = d.getDate();
  const mon = d.toLocaleString("en-US", { month: "short" });
  const timeStr = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  const where = e.is_virtual ? "Virtual Event" : (e.location || "Location TBA");
  const mapLink = !e.is_virtual && e.location
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}" target="_blank" rel="noopener">View Map</a>`
    : "";
  const regBtn = e.registration_url
    ? `<a class="btn btn-primary" href="${e.registration_url}" target="_blank" rel="noopener">Register</a>`
    : "";

  return `
    <div class="event-card">
      <div class="event-date"><span class="day">${day}</span><span class="mon">${mon}</span></div>
      <div>
        ${e.event_type ? `<div class="event-type">${escapeHtmlE(e.event_type)}</div>` : ""}
        <h3>${escapeHtmlE(e.title)}</h3>
        <p>${escapeHtmlE(e.description || "")}</p>
        <p style="margin-top:6px;">📍 ${escapeHtmlE(where)} &nbsp;·&nbsp; 🕐 ${timeStr}</p>
        <div class="event-actions">
          ${regBtn}
          ${mapLink}
        </div>
      </div>
    </div>`;
}

function shiftMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("cal-grid");
  const label = document.getElementById("cal-month-label");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  label.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const eventDays = new Set(
    allEvents
      .filter((e) => {
        const d = new Date(e.start_time);
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
      .map((e) => new Date(e.start_time).getDate())
  );

  let html = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
    .map((d) => `<div class="cal-day-label">${d}</div>`).join("");

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell empty"></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const hasEvent = eventDays.has(day);
    html += `<div class="cal-cell ${hasEvent ? "has-event" : ""}">${day}${hasEvent ? '<span class="dot"></span>' : ""}</div>`;
  }

  grid.innerHTML = html;
}

function escapeHtmlE(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
