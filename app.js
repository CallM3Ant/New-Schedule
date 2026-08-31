/* ==========================================================================
   Scheduly — App logic
   Vanilla JS, no framework. One delegated click handler drives almost
   everything; IndexedDB (db.js) is the source of truth, mirrored into
   `state` in memory for instant re-renders.
   ========================================================================== */

/* ---------------------------------------------------------------- tokens */

const TINTS = [
  { id: 0, name: "Sunrise", top: "#FFB347", bottom: "#FF6F61" },
  { id: 1, name: "Coral", top: "#FF6F91", bottom: "#FF3D6E" },
  { id: 2, name: "Violet", top: "#9B6DFF", bottom: "#6D5DFB" },
  { id: 3, name: "Ocean", top: "#3FA9FF", bottom: "#2D6BFF" },
  { id: 4, name: "Teal", top: "#2FD9C5", bottom: "#12A8A0" },
  { id: 5, name: "Lime", top: "#9BE15D", bottom: "#35B36A" },
  { id: 6, name: "Amber", top: "#FFD15C", bottom: "#F7A325" },
  { id: 7, name: "Rose", top: "#FF8FB1", bottom: "#E85B8A" },
];
function tint(id) { return TINTS[((id % TINTS.length) + TINTS.length) % TINTS.length]; }

const ALERT_MODES = [
  { id: "none", label: "Silent", icon: "bellOff" },
  { id: "alarm", label: "Alarm", icon: "alarm" },
];
function alertMeta(id) { return ALERT_MODES.find((a) => a.id === id) || ALERT_MODES[0]; }

/* ---------------------------------------------------------------- icons */

const ICON_PATHS = {
  sun: `<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3.2v3.6M16 3.2v3.6M3.5 10h17"/>`,
  layers: `<path d="M12 3.5l7.5 4-7.5 4-7.5-4 7.5-4z"/><path d="M4.5 12.5L12 16.5l7.5-4M4.5 16.5L12 20.5l7.5-4"/>`,
  sliders: `<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  chevronRight: `<path d="M9 5l7 7-7 7"/>`,
  chevronLeft: `<path d="M15 5l-7 7 7 7"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v4.7l3 1.8"/>`,
  bellOff: `<path d="M8.7 5.2A4.7 4.7 0 0 1 16.7 8.5c0 3.4 1 5 1.6 5.8H5.3"/><path d="M10.3 17.8a1.7 1.7 0 0 0 3.4 0"/><path d="M3.5 3.5l17 17"/>`,
  bell: `<path d="M6 10a6 6 0 0 1 12 0c0 3.6 1 5.2 1.6 5.8H4.4C5 15.2 6 13.6 6 10z"/><path d="M10.3 18.8a1.7 1.7 0 0 0 3.4 0"/>`,
  alarm: `<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.3 1.4"/><path d="M5.5 4.5L3 7M18.5 4.5L21 7"/><path d="M9.5 3h5"/>`,
  timer: `<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.3 1.4"/><path d="M9.7 3h4.6"/>`,
  trash: `<path d="M4.5 7h15"/><path d="M9.5 7V5.2a1.7 1.7 0 0 1 1.7-1.7h1.6a1.7 1.7 0 0 1 1.7 1.7V7"/><path d="M6.5 7l.9 12.2a2 2 0 0 0 2 1.8h5.2a2 2 0 0 0 2-1.8L17.5 7"/><path d="M10.2 11v6M13.8 11v6"/>`,
  pencil: `<path d="M4 20l.9-4 10.6-10.6a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.3 19.4 4 20z"/><path d="M13.8 6.2l3.5 3.5"/>`,
  tap: `<circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="12" r="5.6" opacity="0.5"/><circle cx="12" cy="12" r="9" opacity="0.28"/>`,
  check: `<path d="M5 13l4.5 4.5L19 8"/>`,
  moonStars: `<path d="M19.5 14.8A8 8 0 1 1 9.7 4.3a6.4 6.4 0 0 0 9.8 10.5z"/><path d="M18 3.2l.6 1.4L20 5.2l-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>`,
  hourglass: `<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M6.5 3.5c0 4.6 4.6 6 5.5 8.5-.9 2.5-5.5 3.9-5.5 8.5M17.5 3.5c0 4.6-4.6 6-5.5 8.5.9 2.5 5.5 3.9 5.5 8.5"/>`,
  wandStars: `<path d="M4.5 19.5L15 9"/><path d="M14.3 3.8l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"/><path d="M19.7 9.3l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z"/>`,
  calendarPlus: `<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3.2v3.6M16 3.2v3.6M3.5 10h17"/><path d="M12 13.2v5M9.5 15.7h5"/>`,
  calendarClock: `<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3.2v3.6M16 3.2v3.6M3.5 10h17"/><circle cx="12" cy="15.2" r="3"/><path d="M12 13.8v1.4l1 .7"/>`,
  x: `<path d="M6 6l12 12M18 6L6 18"/>`,
};
function icon(name, opts) {
  opts = opts || {};
  const size = opts.size || 20;
  const stroke = opts.gradient ? `url(#${opts.gradient})` : "currentColor";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>`;
}

/* ---------------------------------------------------------------- utils */
async function importData(file) {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.templates || !backup.plans) {
      showToast("Invalid backup file");
      return;
    }

    state.templates = backup.templates;
    state.plans = backup.plans;

    await DB.clearAll();

    for (const template of state.templates) {
      await DB.putTemplate(template);
    }

    for (const [key, blocks] of Object.entries(state.plans)) {
      await DB.putPlan(key, blocks);
    }

    refreshAll();
    showToast("Backup imported");

  } catch (err) {
    console.error(err);
    showToast("Import failed");
  }
}

function exportData() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: state.templates,
    plans: state.plans,
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `scheduly-backup-${dateKey(new Date())}.json`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  showToast("Backup exported");
}

function findBlockConflict(block, date) {
  const blocks = state.plans[dateKey(date)] || [];

  return blocks.find((existing) => {
    if (existing.id === block.id) return false;

    return (
      block.startMinutes < existing.endMinutes &&
      block.endMinutes > existing.startMinutes
    );
  });
}
function findTemplateConflict(block) {
  return state.editingTemplate.blocks.find((existing) => {
    if (existing.id === block.id) return false;

    return (
      block.startMinutes < existing.endMinutes &&
      block.endMinutes > existing.startMinutes
    );
  });
}

function pad2(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function keyToDate(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }

/* ---- Alarm export (rolling next-24h window, not "today + tomorrow") ---- */

function blockDateTime(dateKeyStr, minutes) {
  // JS normalizes an out-of-range minutes value (e.g. 1470) by rolling into
  // the next day automatically, so cross-midnight blocks resolve correctly.
  const base = keyToDate(dateKeyStr);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, minutes, 0, 0);
}

function formatAlarmDateTime(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function collectNext24hBlocks() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60000); // exactly +24h, exclusive
  const results = [];
  Object.keys(state.plans).forEach((key) => {
    (state.plans[key] || []).forEach((b) => {
      const startDT = blockDateTime(key, b.startMinutes);
      const endDT = blockDateTime(key, b.endMinutes);
      // inclusive of "now", exclusive of the 24h mark itself —
      // e.g. now = 7:30 PM today -> last eligible start is 7:29 PM tomorrow
      if (startDT >= now && startDT < windowEnd) {
        results.push({ title: b.title, startDT, endDT });
      }
    });
  });
  results.sort((a, b) => a.startDT - b.startDT);
  return results;
}

function generateAlarmText() {
  const blocks = collectNext24hBlocks();
  return blocks.map((b) => `${b.title}|${formatAlarmDateTime(b.startDT)}|${formatAlarmDateTime(b.endDT)}`).join(";;");
}

function sendAlarms24h() {
  const text = generateAlarmText();
  if (!text) {
    showToast("Nothing scheduled in the next 24 hours");
    return;
  }
  const shortcutName = "Set Schedule Alarms";
  const url = "shortcuts://run-shortcut?name=" + encodeURIComponent(shortcutName) + "&input=text&text=" + encodeURIComponent(text);
  window.location.href = url;
}
function addMonths(d, delta) { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }
function nowMinutes(d) { return d.getHours() * 60 + d.getMinutes(); }

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60) % 24, m = ((mins % 60) + 60) % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${pad2(m)} ${ampm}`;
}
function durationLabel(startMin, endMin) {
  const total = Math.max(0, endMin - startMin);
  const h = Math.floor(total / 60), m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
function timeInputValue(mins) { const h = Math.floor(mins / 60) % 24, m = mins % 60; return `${pad2(h)}:${pad2(m)}`; }
function timeInputToMinutes(val) { if (!val) return 0; const [h, m] = val.split(":").map(Number); return h * 60 + m; }

function hexToRgbStr(hex) {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}
function hexToRgba(hex, a) { return `rgba(${hexToRgbStr(hex)}, ${a})`; }
function tintGradientCss(id) { const t = tint(id); return `linear-gradient(135deg, ${t.top}, ${t.bottom})`; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function greetingText(d) { const h = d.getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; }
function longDateLabel(d) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
function dayPlanTitleLabel(d) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}
function monthTitleLabel(d) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function defaultStartMinutes() {
  const raw = nowMinutes(new Date());
  return (Math.floor(raw / 15) + 1) * 15;
}

/* ---------------------------------------------------------------- state */

const state = {
  templates: [],
  plans: {},                 // { "yyyy-MM-dd": Block[] }
  activeTab: "today",
  now: new Date(),
  calendarMonth: new Date(),
  stampingTemplateID: null,
  dayPlanDate: null,
  editingBlockCtx: null,     // { date, id, isNew, draftColorID, draftAlert }
  editingTemplate: null,     // { id, name, colorID, blocks: Block[] }
  editingTBlock: null,       // { id, isNew, draftColorID, draftAlert }
  signedIn: sessionStorage.getItem("scheduly_signed_in") === "1",
  pendingAction: null,       // action name to run automatically after a successful sign-in
};

/* ---------------------------------------------------------------- store */

function blocksOn(date) {
  const arr = state.plans[dateKey(date)] || [];
  return arr.slice().sort((a, b) => a.startMinutes - b.startMinutes);
}
function hasPlanOn(date) { return (state.plans[dateKey(date)] || []).length > 0; }

async function upsertBlockOnDate(block, date) {
  const key = dateKey(date);
  const arr = (state.plans[key] || []).slice();
  const idx = arr.findIndex((b) => b.id === block.id);
  if (idx >= 0) arr[idx] = block; else arr.push(block);
  arr.sort((a, b) => a.startMinutes - b.startMinutes);
  state.plans[key] = arr;
  await DB.putPlan(key, arr);
}
async function deleteBlockOnDate(blockId, date) {
  const key = dateKey(date);
  const arr = (state.plans[key] || []).filter((b) => b.id !== blockId);
  if (arr.length) { state.plans[key] = arr; await DB.putPlan(key, arr); }
  else { delete state.plans[key]; await DB.deletePlan(key); }
}
async function clearDayStore(date) {
  const key = dateKey(date);
  delete state.plans[key];
  await DB.deletePlan(key);
}
async function saveTemplateToStore(template) {
  const idx = state.templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) state.templates[idx] = template; else state.templates.push(template);
  await DB.putTemplate(template);
  autoPushTemplates();
}
async function deleteTemplateFromStore(id) {
  state.templates = state.templates.filter((t) => t.id !== id);
  await DB.deleteTemplate(id);
  if (state.stampingTemplateID === id) state.stampingTemplateID = null;
  autoPushTemplates();
}
async function applyTemplateToDate(template, date) {
  const fresh = template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }));
  const key = dateKey(date);
  state.plans[key] = fresh.sort((a, b) => a.startMinutes - b.startMinutes);
  await DB.putPlan(key, state.plans[key]);
}

function currentBlockToday() {
  const nm = nowMinutes(state.now);
  return blocksOn(state.now).find((b) => nm >= b.startMinutes && nm < b.endMinutes) || null;
}
function nextBlockToday() {
  const nm = nowMinutes(state.now);
  return blocksOn(state.now).find((b) => b.startMinutes > nm) || null;
}
function remainingCountToday() {
  const nm = nowMinutes(state.now);
  return blocksOn(state.now).filter((b) => b.endMinutes > nm).length;
}
function blockProgress(block, now) {
  const total = block.endMinutes - block.startMinutes;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (nowMinutes(now) - block.startMinutes) / total));
}

/* ---------------------------------------------------------------- render: today */

function renderToday() {
  document.getElementById("todayGreeting").textContent = greetingText(state.now);
  document.getElementById("todayDate").textContent = longDateLabel(state.now);
  document.getElementById("remainingCount").textContent = String(remainingCountToday());
  document.getElementById("nowCardSlot").innerHTML = renderNowCard();

  const blocks = blocksOn(state.now);
  const slot = document.getElementById("todayContentSlot");
  if (blocks.length === 0) {
    slot.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="icon-wrap">${icon("calendarPlus", { size: 40, gradient: "gradAccent" })}</div>
          <h3>Nothing planned yet</h3>
          <p>Tap the + button to add your first block, or apply a template from the Templates tab.</p>
        </div>
      </div>`;
  } else {
    slot.innerHTML = `<div class="timeline">${renderTimeline(blocks)}</div>`;
  }
}

function renderNowCard() {
  const current = currentBlockToday();
  if (current) {
    const t = tint(current.colorID);
    const progress = blockProgress(current, state.now);
    const remaining = current.endMinutes - nowMinutes(state.now);
    const endsIn = remaining >= 60 ? `${Math.floor(remaining / 60)}h ${remaining % 60}m left` : `${Math.max(0, remaining)}m left`;
    const am = alertMeta(current.alert);
    return `
      <div class="now-card active" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});box-shadow:0 12px 22px ${hexToRgba(t.bottom, 0.4)};">
        <div class="now-top-row">
          <span class="now-dot"></span>
          <span class="now-label">NOW</span>
          <span class="now-alert-pill">${am.label}</span>
        </div>
        <div>
          <div class="now-title">${escapeHtml(current.title)}</div>
          ${current.details ? `<div class="now-details">${escapeHtml(current.details)}</div>` : ""}
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.round(progress * 100)}%"></div></div>
        <div class="now-bottom-row">
          <span class="now-time-label">${icon("clock", { size: 14 })} ${minutesToLabel(current.startMinutes)} – ${minutesToLabel(current.endMinutes)}</span>
          <span class="now-ends-in">${endsIn}</span>
        </div>
      </div>`;
  }
  const next = nextBlockToday();
  return `
    <div class="now-card idle">
      <div class="card card-inner">
        <div class="icon-circle">${icon(next ? "hourglass" : "moonStars", { size: 22, gradient: "gradAccent" })}</div>
        <div>
          <div class="idle-label">${next ? "Up next" : "Open time"}</div>
          <div class="idle-title">${next ? escapeHtml(next.title) : "Nothing scheduled"}</div>
          ${next ? `<div class="idle-sub">at ${minutesToLabel(next.startMinutes)}</div>` : ""}
        </div>
      </div>
    </div>`;
}

function renderTimeline(blocks) {
  const nm = nowMinutes(state.now);
  const anyActive = blocks.some((b) => nm >= b.startMinutes && nm < b.endMinutes);
  let html = "";
  blocks.forEach((block, i) => {
    const showLineBefore = !anyActive && nm < block.startMinutes && (i === 0 || nm >= blocks[i - 1].endMinutes);
    if (showLineBefore) html += renderNowLine();
    html += renderTimelineRow(block);
  });
  const last = blocks[blocks.length - 1];
  if (last && nm >= last.endMinutes) html += renderNowLine();
  return html;
}
function renderNowLine() {
  return `<div class="now-line"><span class="nl-time">${minutesToLabel(nowMinutes(state.now))}</span><span class="nl-dot"></span><span class="nl-line"></span></div>`;
}
function renderTimelineRow(block) {
  const nm = nowMinutes(state.now);
  let cls = "upcoming";
  if (nm >= block.startMinutes && nm < block.endMinutes) cls = "active";
  else if (nm >= block.endMinutes) cls = "past";
  const t = tint(block.colorID);
  const railStyle = cls === "past" ? "background:var(--text-tertiary);" : `background:linear-gradient(135deg, ${t.top}, ${t.bottom});`;
  const rowStyle = cls === "active" ? `background:${hexToRgba(t.top, 0.12)};border-color:${hexToRgba(t.top, 0.5)};` : "";
  const pillColor = cls === "past" ? "var(--text-tertiary)" : t.bottom;
  const pillBg = cls === "past" ? "rgba(154,160,166,0.12)" : hexToRgba(t.bottom, 0.12);
  const am = alertMeta(block.alert);
  const alertIconHtml = block.alert === "alarm"
    ? `<span style="display:inline-flex;color:var(--accent-bottom);">${icon(am.icon, { size: 11 })}</span>`
    : "";
  return `
    <button class="timeline-row ${cls}" style="${rowStyle}" data-action="openTodayBlock" data-id="${block.id}">
      <div class="tl-time"><span class="start">${minutesToLabel(block.startMinutes)}</span><span class="end">${minutesToLabel(block.endMinutes)}</span></div>
      <div class="tl-rail" style="${railStyle}"></div>
      <div class="tl-content">
        <div class="title">${escapeHtml(block.title)}</div>
        <div class="tl-meta">
          <span class="pill" style="color:${pillColor};background:${pillBg};">${icon("timer", { size: 11 })}&nbsp;${durationLabel(block.startMinutes, block.endMinutes)}</span>
          ${alertIconHtml}
        </div>
        ${block.details ? `<div class="details">${escapeHtml(block.details)}</div>` : ""}
      </div>
      <span class="tl-chevron">${icon("chevronRight", { size: 14 })}</span>
    </button>`;
}

/* ---------------------------------------------------------------- render: calendar */

function renderCalendar() {
  const bannerSlot = document.getElementById("stampBannerSlot");
  if (state.stampingTemplateID) {
    const t = state.templates.find((x) => x.id === state.stampingTemplateID);
    bannerSlot.innerHTML = t ? `
      <div class="stamp-banner">
        ${icon("tap", { size: 18 })}
        <div class="txt"> <div class="t1">STAMP MODE ACTIVE</div> <div class="t2"> Every calendar tap will apply "${escapeHtml(t.name)}" </div> </div>
        <button data-action="stopStamping">Done</button>
      </div>` : "";
  } else {
    bannerSlot.innerHTML = "";
  }

  document.getElementById("monthTitle").textContent = monthTitleLabel(state.calendarMonth);
  document.getElementById("weekdayRow").innerHTML = ["S", "M", "T", "W", "T", "F", "S"].map((s) => `<span>${s}</span>`).join("");
  document.getElementById("monthGrid").innerHTML = renderMonthGrid(state.calendarMonth);
  document.getElementById("prevMonthBtn").innerHTML = icon("chevronLeft", { size: 15 });
  document.getElementById("nextMonthBtn").innerHTML = icon("chevronRight", { size: 15 });
}

function renderMonthGrid(monthDate) {
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells.map((date) => {
    if (!date) return `<div></div>`;
    const key = dateKey(date);
    const blocks = state.plans[key] || [];
    const dots = blocks.slice(0, 4).map((b) => `<span style="background:${tint(b.colorID).bottom}"></span>`).join("");
    const cls = ["day-cell"];
    const isToday = today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate();
    if (isToday) cls.push("today");
    if (blocks.length) cls.push("has-plan");
    if (state.stampingTemplateID) cls.push("stamping");
    return `<button class="${cls.join(" ")}" data-action="dayCellClick" data-date="${key}">
      <span class="num">${date.getDate()}</span>
      <span class="dots">${dots}</span>
    </button>`;
  }).join("");
}

/* ---------------------------------------------------------------- render: templates */

function renderTemplates() {
  const slot = document.getElementById("templatesListSlot");
  if (state.templates.length === 0) {
    slot.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <div class="icon-wrap">${icon("layers", { size: 40, gradient: "gradAccent" })}</div>
          <h3>No templates yet</h3>
          <p>Build a full day once, then stamp it onto any date in the calendar.</p>
        </div>
      </div>`;
    return;
  }
  slot.innerHTML = state.templates.map(renderTemplateCard).join("");
}

function renderTemplateCard(template) {
  const t = tint(template.colorID);
  const sorted = template.blocks.slice().sort((a, b) => a.startMinutes - b.startMinutes);
  const total = sorted.reduce((s, b) => s + Math.max(0, b.endMinutes - b.startMinutes), 0);
  const subtitle = sorted.length
    ? `${sorted.length} block${sorted.length === 1 ? "" : "s"} · ${minutesToLabel(sorted[0].startMinutes)} – ${minutesToLabel(sorted[sorted.length - 1].endMinutes)}`
    : "No blocks yet";
  const isStamping = state.stampingTemplateID === template.id;
  const miniTimeline = sorted.length ? `
    <div class="mini-timeline">
      ${sorted.map((b) => `<span style="width:${total > 0 ? Math.max(4, ((b.endMinutes - b.startMinutes) / total) * 100) : 0}%;background:linear-gradient(135deg, ${tint(b.colorID).top}, ${tint(b.colorID).bottom});"></span>`).join("")}
    </div>` : "";
  return `
    <div class="template-card ${isStamping ? "stamping" : ""}" ${isStamping ? `style="border-color:${hexToRgba(t.top, 0.6)};"` : ""}>
      <div class="top-row">
        <div class="swatch-icon" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});">${icon("calendarClock", { size: 18 })}</div>
        <div class="info">
          <div class="name">${escapeHtml(template.name)}</div>
          <div class="subtitle">${subtitle}</div>
        </div>
        <button class="circle-btn" data-action="openEditTemplate" data-id="${template.id}">${icon("pencil", { size: 14 })}</button>
      </div>
      ${miniTimeline}
      <button class="btn" style="background:${isStamping ? `linear-gradient(135deg, ${t.top}, ${t.bottom})` : "var(--bg-elevated)"};color:${isStamping ? "#fff" : "var(--text-primary)"};" data-action="toggleStamp" data-id="${template.id}">
        ${icon(isStamping ? "check" : "tap", { size: 15 })} ${isStamping ? "Stamping… tap days in Calendar" : "Stamp onto calendar"}
      </button>
    </div>`;
}

/* ---------------------------------------------------------------- render: settings */

function renderSettings() {
  const plannedDays = Object.keys(state.plans).filter((k) => (state.plans[k] || []).length > 0).length;
  document.getElementById("settingsSlot").innerHTML = `
    <div class="card">
      <div class="stat-row"><span class="label">Templates</span><span class="value">${state.templates.length}</span></div>
      <hr class="divider" style="margin:12px 0;">
      <div class="stat-row"><span class="label">Planned days</span><span class="value">${plannedDays}</span></div>
      <hr class="divider" style="margin:12px 0;">
      <div class="stat-row"><span class="label">Storage</span><span class="value">This device only</span></div>
      <hr class="divider" style="margin:12px 0;">
      <div class="stat-row"><span class="label">Version</span><span class="value">1.0 (Web)</span></div>
    </div>
    <div class="card">
      <div class="setting-row">
        <div class="icon-badge">${icon("sliders", { size: 18, gradient: "gradAccent" })}</div>
        <div class="info">
          <div class="title">Account</div>
          <div class="desc">${state.signedIn ? "Signed in — data-changing actions unlocked" : "Sign in to erase, import, or sync data"}</div>
        </div>
      </div>
      ${state.signedIn
        ? `<button class="btn" style="margin-top:14px;" data-action="signOut">Sign Out</button>`
        : `<button class="btn btn-primary" style="margin-top:14px;" data-action="openSignIn">Sign In</button>`}
    </div>
    <div class="card">
      <div class="setting-row">
        <div class="icon-badge">${icon("calendarClock", { size: 18, gradient: "gradAccent" })}</div>
        <div class="info">
          <div class="title">Template Sync</div>
          <div class="desc">${state.signedIn
            ? "Automatic — every template change pushes to the database, and every launch pulls the latest."
            : "Templates pull automatically on launch. Sign in to also push your changes."}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="setting-row">
        <div class="icon-badge">${icon("calendarPlus", { size: 18, gradient: "gradAccent" })}</div>
        <div class="info">
          <div class="title">Import Data</div>
          <div class="desc">Restore templates and plans from a backup file</div>
        </div>
      </div>

      <button class="btn" style="margin-top:14px;" data-action="importData">
        Import Backup
      </button>
    </div>
    <div class="card">
      <div class="setting-row">
        <div class="icon-badge">${icon("layers", { size: 18, gradient: "gradAccent" })}</div>
        <div class="info">
          <div class="title">Export Data</div>
          <div class="desc">Download all templates and plans as a backup file</div>
        </div>
      </div>
      <button class="btn" style="margin-top:14px;" data-action="exportData">
        Export Backup
      </button>
    </div>

    <div class="card">
      <div class="setting-row">
        <div class="icon-badge">${icon("trash", { size: 18, gradient: "gradAccent" })}</div>
        <div class="info">
          <div class="title">Erase all data</div>
          <div class="desc">Delete every template and planned day from this device</div>
        </div>
      </div>
      <button class="btn btn-danger" style="margin-top:14px;" data-action="openClearAllConfirm">
        Erase All Data
      </button>
    </div>
  `;
}

/* ---------------------------------------------------------------- refresh / tabs */

function refreshAll() {
  renderToday();
  renderCalendar();
  renderTemplates();
  renderSettings();
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${tab}`).classList.add("active");
  document.querySelectorAll(".tab-item").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  document.getElementById("fabBtn").style.display = tab === "today" || tab === "templates" ? "flex" : "none";
}
function handleFabClick() {
  if (state.activeTab === "today") openBlockEditor(state.now, null);
  else if (state.activeTab === "templates") openTemplateEditor(null);
}

/* ---------------------------------------------------------------- overlays */

function openOverlay(id) { document.getElementById(id).classList.add("open"); }
function closeOverlay(id) { document.getElementById(id).classList.remove("open"); }

/* ---- Sign-in gate (Erase All / Import / Sync require this) ----
   NOTE: this is a soft lock, not real security — the password lives in
   this client-side file, so anyone who opens DevTools can read it. It's
   meant to prevent accidental destructive taps, not to protect the data
   from someone who's determined to get in. */
const APP_PASSWORD = "Wes253vad";

function requiresSignIn(actionName) {
  if (state.signedIn) return false;
  state.pendingAction = actionName;
  document.getElementById("signInError").style.display = "none";
  document.getElementById("signInPasswordInput").value = "";
  openOverlay("signInOverlay");
  return true;
}

function attemptSignIn() {
  const input = document.getElementById("signInPasswordInput");
  if (input.value !== APP_PASSWORD) {
    document.getElementById("signInError").style.display = "block";
    return;
  }
  state.signedIn = true;
  sessionStorage.setItem("scheduly_signed_in", "1");
  closeOverlay("signInOverlay");
  showToast("Signed in");
  const pending = state.pendingAction;
  state.pendingAction = null;
  if (pending) resumePendingAction(pending);
  refreshAll();
  autoPullTemplates().then(autoPushTemplates); // reconcile both ways
}

function resumePendingAction(action) {
  if (action === "openClearAllConfirm") openOverlay("clearAllOverlay");
  else if (action === "importData") document.getElementById("importFileInput").click();
}

function signOut() {
  state.signedIn = false;
  sessionStorage.removeItem("scheduly_signed_in");
  showToast("Signed out");
  refreshAll();
}

/* ---- Template sync (Supabase, via supabase-sync.js) ----
   Pulling is a read, so it happens automatically for everyone on load —
   no sign-in needed to see the shared templates. Pushing changes the
   shared database, so it only ever happens for signed-in users, and
   happens automatically after every template save/delete (no manual
   "Sync Now" button — see saveTemplateToStore / deleteTemplateFromStore). */

async function autoPullTemplates({ silent = true } = {}) {
  if (!window.ScheduleSync) return;
  try {
    const remote = await window.ScheduleSync.pullTemplates();
    if (Array.isArray(remote)) {
      for (const t of remote) await DB.putTemplate(t);
      state.templates = await DB.getAllTemplates();
      refreshAll();
    }
  } catch (err) {
    console.error("Template pull failed:", err);
    if (!silent) showToast("Couldn't reach the database");
  }
}

async function autoPushTemplates() {
  if (!state.signedIn || !window.ScheduleSync) return;
  try {
    await window.ScheduleSync.pushTemplates(state.templates);
  } catch (err) {
    console.error("Template push failed:", err);
    showToast("Saved locally, but couldn't sync to the database");
  }
}

/* ---- iOS-style drag-to-dismiss for bottom sheets ---- */
function wireSheetDragging() {
  document.querySelectorAll(".sheet-overlay").forEach((overlay) => {
    const sheet = overlay.querySelector(".sheet");
    const handle = overlay.querySelector(".sheet-handle");
    if (!sheet || !handle) return;

    let dragging = false;
    let startY = 0;
    let deltaY = 0;

    const onDown = (e) => {
      if (!overlay.classList.contains("open")) return;
      dragging = true;
      startY = e.clientY;
      deltaY = 0;
      sheet.style.transition = "none";
      handle.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (!dragging) return;
      deltaY = Math.max(0, e.clientY - startY);
      sheet.style.transform = `translateY(${deltaY}px)`;
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = "";
      const closeThreshold = sheet.offsetHeight * 0.22;

      if (deltaY > closeThreshold) {
        // dragged down past the point of no return -> finish closing
        sheet.style.transform = "translateY(100%)";
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          sheet.removeEventListener("transitionend", finish);
          closeOverlay(overlay.id);
          sheet.style.transform = "";
        };
        sheet.addEventListener("transitionend", finish);
        setTimeout(finish, 360); // fallback in case transitionend doesn't fire
      } else {
        // let go early -> snap back into position
        sheet.style.transform = "";
      }
    };

    handle.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  });
}

let toastTimer = null;
function showToast(text) {
  const el = document.getElementById("toast");
  document.getElementById("toastText").textContent = text;
  el.querySelector(".dot-icon").innerHTML = icon("check", { size: 13 });
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
}

/* ---- Block editor (Today tab + Day Plan) ---- */

function openBlockEditor(date, block) {
  state.editingBlockCtx = {
    date,
    id: block ? block.id : crypto.randomUUID(),
    draftColorID: block ? block.colorID : Math.floor(Math.random() * TINTS.length),
    draftAlert: block ? block.alert : "alarm",
  };
  document.getElementById("blockEditorTitle").textContent = block ? "Edit Block" : "New Block";
  document.getElementById("blockTitleInput").value = block ? block.title : "";
  document.getElementById("blockDetailsInput").value = block ? block.details : "";
  document.getElementById("blockDetailsInput").style.height = "auto";
  const startMin = block ? block.startMinutes : defaultStartMinutes();
  const endMin = block ? block.endMinutes : Math.min(23 * 60 + 59, startMin + 60);
  document.getElementById("blockStartInput").value = timeInputValue(startMin);
  document.getElementById("blockEndInput").value = timeInputValue(endMin);
  document.getElementById("blockDeleteBtn").style.display = block ? "flex" : "none";
  renderBlockColorGrid();
  renderBlockAlertPicker();
  updateBlockSaveState();
  openOverlay("blockEditorOverlay");
}
function renderBlockColorGrid() {
  document.getElementById("blockColorGrid").innerHTML = TINTS.map((t) => `
    <button class="swatch ${state.editingBlockCtx.draftColorID === t.id ? "selected" : ""}" data-action="pickBlockColor" data-color="${t.id}" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});">
      <span class="check">${icon("check", { size: 14 })}</span>
    </button>`).join("");
}
function renderBlockAlertPicker() {
  document.getElementById("blockAlertPicker").innerHTML = ALERT_MODES.map((m) => `
    <button class="alert-option ${state.editingBlockCtx.draftAlert === m.id ? "selected" : ""}" data-action="pickBlockAlert" data-alert="${m.id}">
      ${icon(m.icon, { size: 17 })}<span>${m.label}</span>
    </button>`).join("");
}
function updateBlockSaveState() {
  const empty = document.getElementById("blockTitleInput").value.trim().length === 0;
  document.getElementById("blockSaveBtn").toggleAttribute("disabled", empty);
}
async function saveBlockEditor() {
  const ctx = state.editingBlockCtx;
  const title = document.getElementById("blockTitleInput").value.trim();
  if (!title) return;
  const details = document.getElementById("blockDetailsInput").value.trim();
  let startMin = timeInputToMinutes(document.getElementById("blockStartInput").value);
  let endMin = timeInputToMinutes(document.getElementById("blockEndInput").value);
  if (endMin <= startMin) endMin = startMin + 30;
  const tempBlock = {
  id: ctx.id,
  startMinutes: startMin,
  endMinutes: endMin,
  };

  const conflict = findBlockConflict(tempBlock, ctx.date);

  if (conflict) {
    showToast(
      `Conflicts with "${conflict.title}" (${minutesToLabel(conflict.startMinutes)} - ${minutesToLabel(conflict.endMinutes)})`
    );
    return;
  }
  const block = { id: ctx.id, title, details, startMinutes: startMin, endMinutes: endMin, colorID: ctx.draftColorID, alert: ctx.draftAlert };
  await upsertBlockOnDate(block, ctx.date);
  closeOverlay("blockEditorOverlay");
  showToast("Block saved");
  refreshAll();
  if (document.getElementById("dayPlanOverlay").classList.contains("open")) renderDayPlanSheet();
}
async function deleteBlockEditorAction() {
  const ctx = state.editingBlockCtx;
  await deleteBlockOnDate(ctx.id, ctx.date);
  closeOverlay("blockEditorOverlay");
  refreshAll();
  if (document.getElementById("dayPlanOverlay").classList.contains("open")) renderDayPlanSheet();
}

/* ---- Day plan sheet (Calendar tab) ---- */

function openDayPlan(date) {
  state.dayPlanDate = date;
  document.getElementById("dayPlanAddBtn").innerHTML = icon("plus", { size: 18 });
  document.getElementById("dayApplyTemplateBtn").innerHTML = `${icon("layers", { size: 15 })} Apply Template`;
  document.getElementById("dayClearBtn").innerHTML = `${icon("trash", { size: 15 })} Clear`;
  renderDayPlanSheet();
  openOverlay("dayPlanOverlay");
}
function renderDayPlanSheet() {
  const date = state.dayPlanDate;
  const blocks = blocksOn(date);
  document.getElementById("dayPlanTitle").textContent = dayPlanTitleLabel(date);
  document.getElementById("dayClearBtn").style.display = blocks.length ? "flex" : "none";

  const slot = document.getElementById("dayPlanListSlot");
  if (blocks.length === 0) {
    slot.innerHTML = `
      <div class="card" style="margin-top:16px;">
        <div class="empty-state">
          <div class="icon-wrap">${icon("wandStars", { size: 40, gradient: "gradAccent" })}</div>
          <h3>Empty day</h3>
          <p>Apply a template or add blocks to plan this day.</p>
        </div>
      </div>`;
  } else {
    slot.innerHTML = `<div style="margin-top:16px;">${blocks.map((b) => {
      const t = tint(b.colorID);
      const showAlert = b.alert === "alarm";
      return `
        <button class="day-block-row" data-action="openDayBlock" data-id="${b.id}">
          <span class="rail" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});"></span>
          <span class="info">
            <span class="title">${escapeHtml(b.title)}</span>
            <span class="time">${minutesToLabel(b.startMinutes)} – ${minutesToLabel(b.endMinutes)}</span>
          </span>
          ${showAlert ? `<span style="color:var(--accent-bottom);display:inline-flex;">${icon(alertMeta(b.alert).icon, { size: 13 })}</span>` : ""}
        </button>`;
    }).join("")}</div>`;
  }
}

/* ---- Apply-template action sheet ---- */

function openApplyTemplateSheet() {
  if (state.templates.length === 0) return;
  document.getElementById("applyTemplateList").innerHTML = state.templates.map((t) =>
    `<button data-action="pickTemplateForApply" data-id="${t.id}">${escapeHtml(t.name)}</button>`
  ).join("");
  openOverlay("applyTemplateOverlay");
}
async function pickTemplateForApply(id) {
  const t = state.templates.find((x) => x.id === id);
  if (!t) return;
  await applyTemplateToDate(t, state.dayPlanDate);
  closeOverlay("applyTemplateOverlay");
  renderDayPlanSheet();
  showToast("Template applied");
  refreshAll();
}

/* ---- Clear day alert ---- */

function openClearDayConfirm() {
  document.getElementById("clearDayMessage").textContent = `This removes all blocks planned for ${dayPlanTitleLabel(state.dayPlanDate)}.`;
  openOverlay("clearDayOverlay");
}
async function confirmClearDay() {
  await clearDayStore(state.dayPlanDate);
  closeOverlay("clearDayOverlay");
  renderDayPlanSheet();
  refreshAll();
}

/* ---- Template editor (outer sheet) ---- */

function openTemplateEditor(template) {
  state.editingTemplate = template
    ? { id: template.id, name: template.name, colorID: template.colorID, blocks: template.blocks.map((b) => ({ ...b })) }
    : { id: null, name: "", colorID: Math.floor(Math.random() * TINTS.length), blocks: [] };
  document.getElementById("templateEditorTitle").textContent = template ? "Edit Template" : "New Template";
  document.getElementById("templateNameInput").value = state.editingTemplate.name;
  document.getElementById("templateDeleteBtn").style.display = template ? "flex" : "none";
  document.getElementById("addTemplateBlockBtn").innerHTML = `${icon("plus", { size: 16 })} Add Action Block`;
  renderTemplateColorScroll();
  renderTemplateBlocksList();
  updateTemplateSaveState();
  openOverlay("templateEditorOverlay");
}
function renderTemplateColorScroll() {
  document.getElementById("templateColorScroll").innerHTML = TINTS.map((t) => `
    <button class="swatch ${state.editingTemplate.colorID === t.id ? "selected" : ""}" data-action="pickTemplateColor" data-color="${t.id}" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});"></button>`).join("");
}
function renderTemplateBlocksList() {
  const blocks = state.editingTemplate.blocks.slice().sort((a, b) => a.startMinutes - b.startMinutes);
  document.getElementById("templateBlockCount").textContent = String(blocks.length);
  const slot = document.getElementById("templateBlocksListSlot");
  if (blocks.length === 0) {
    slot.innerHTML = `<p style="font-size:13px;color:var(--text-tertiary);padding:8px 0;">Add action blocks to build the day.</p>`;
    return;
  }
  slot.innerHTML = blocks.map((b) => {
    const t = tint(b.colorID);
    return `
      <button class="template-block-row" data-action="openEditTBlock" data-id="${b.id}">
        <span class="rail" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});"></span>
        <span class="info">
          <span class="title">${escapeHtml(b.title)}</span>
          <span class="time">${minutesToLabel(b.startMinutes)} – ${minutesToLabel(b.endMinutes)}</span>
        </span>
        ${b.alert === "alarm" ? `<span class="alert-icon">${icon(alertMeta(b.alert).icon, { size: 12 })}</span>` : ""}
      </button>`;
  }).join("");
}
function updateTemplateSaveState() {
  const name = document.getElementById("templateNameInput").value.trim();
  document.getElementById("templateSaveBtn").toggleAttribute("disabled", name.length === 0 || state.editingTemplate.blocks.length === 0);
}
async function saveTemplateEditor() {
  const name = document.getElementById("templateNameInput").value.trim();
  if (!name || state.editingTemplate.blocks.length === 0) return;
  const template = { id: state.editingTemplate.id || crypto.randomUUID(), name, colorID: state.editingTemplate.colorID, blocks: state.editingTemplate.blocks };
  await saveTemplateToStore(template);
  closeOverlay("templateEditorOverlay");
  showToast("Template saved");
  refreshAll();
}
async function deleteTemplateEditorAction() {
  if (!state.editingTemplate.id) return;
  await deleteTemplateFromStore(state.editingTemplate.id);
  closeOverlay("templateEditorOverlay");
  refreshAll();
}

/* ---- Template block editor (nested sheet) ---- */

function openTBlockEditor(block) {
  state.editingTBlock = {
    id: block ? block.id : crypto.randomUUID(),
    draftColorID: block ? block.colorID : state.editingTemplate.colorID,
    draftAlert: block ? block.alert : "alarm",
  };
  document.getElementById("tBlockEditorTitle").textContent = block ? "Edit Block" : "Add Block";
  document.getElementById("tBlockTitleInput").value = block ? block.title : "";
  document.getElementById("tBlockDetailsInput").value = block ? block.details : "";
  const startMin = block ? block.startMinutes : 9 * 60;
  const endMin = block ? block.endMinutes : 10 * 60;
  document.getElementById("tBlockStartInput").value = timeInputValue(startMin);
  document.getElementById("tBlockEndInput").value = timeInputValue(endMin);
  document.getElementById("tBlockDeleteBtn").style.display = block ? "flex" : "none";
  renderTBlockColorGrid();
  renderTBlockAlertPicker();
  updateTBlockDoneState();
  openOverlay("tBlockEditorOverlay");
}
function renderTBlockColorGrid() {
  document.getElementById("tBlockColorGrid").innerHTML = TINTS.map((t) => `
    <button class="swatch ${state.editingTBlock.draftColorID === t.id ? "selected" : ""}" data-action="pickTBlockColor" data-color="${t.id}" style="background:linear-gradient(135deg, ${t.top}, ${t.bottom});"></button>`).join("");
}
function renderTBlockAlertPicker() {
  document.getElementById("tBlockAlertPicker").innerHTML = ALERT_MODES.map((m) => `
    <button class="alert-option ${state.editingTBlock.draftAlert === m.id ? "selected" : ""}" data-action="pickTBlockAlert" data-alert="${m.id}">
      ${icon(m.icon, { size: 17 })}<span>${m.label}</span>
    </button>`).join("");
}
function updateTBlockDoneState() {
  const empty = document.getElementById("tBlockTitleInput").value.trim().length === 0;
  document.getElementById("tBlockDoneBtn").toggleAttribute("disabled", empty);
}
function commitTBlockEditor() {
  const ctx = state.editingTBlock;
  const title = document.getElementById("tBlockTitleInput").value.trim();
  if (!title) return;
  const details = document.getElementById("tBlockDetailsInput").value.trim();
  let startMin = timeInputToMinutes(document.getElementById("tBlockStartInput").value);
  let endMin = timeInputToMinutes(document.getElementById("tBlockEndInput").value);
  if (endMin <= startMin) endMin = startMin + 30;

  const conflict = findTemplateConflict({
    id: ctx.id,
    startMinutes: startMin,
    endMinutes: endMin,
  });

  if (conflict) {
    showToast(`"${conflict.title}" already uses that time`);
    return;
  }

  const block = { id: ctx.id, title, details, startMinutes: startMin, endMinutes: endMin, colorID: ctx.draftColorID, alert: ctx.draftAlert };
  const idx = state.editingTemplate.blocks.findIndex((b) => b.id === block.id);
  if (idx >= 0) state.editingTemplate.blocks[idx] = block; else state.editingTemplate.blocks.push(block);
  closeOverlay("tBlockEditorOverlay");
  renderTemplateBlocksList();
  updateTemplateSaveState();
}
function deleteTBlockEditorAction() {
  const ctx = state.editingTBlock;
  state.editingTemplate.blocks = state.editingTemplate.blocks.filter((b) => b.id !== ctx.id);
  closeOverlay("tBlockEditorOverlay");
  renderTemplateBlocksList();
  updateTemplateSaveState();
}

/* ---- Clear all data ---- */

async function confirmClearAll() {
  await DB.clearAll();
  state.templates = [];
  state.plans = {};
  state.stampingTemplateID = null;
  closeOverlay("clearAllOverlay");
  showToast("All data erased");
  refreshAll();
}

/* ---------------------------------------------------------------- events */

function wireStaticUI() {
  document.getElementById("importFileInput")
  .addEventListener("change", async (e) => {

      const file = e.target.files?.[0];

      if (!file) return;

      await importData(file);

      e.target.value = "";
  });
  const tabIcons = { today: "sun", calendar: "calendar", templates: "layers", settings: "sliders" };
  document.querySelectorAll(".tab-item").forEach((el) => {
    el.querySelector(".tab-icon").innerHTML = icon(tabIcons[el.dataset.tab], { size: 22 });
    el.dataset.action = "switchTab";
  });
  document.getElementById("fabBtn").innerHTML = icon("plus", { size: 22 });
  document.getElementById("fabBtn").dataset.action = "fabClick";
  document.getElementById("sendAlarmsBtn").innerHTML = icon("alarm", { size: 16 });

  const bind = (id, action) => { document.getElementById(id).dataset.action = action; };
  bind("blockCancelBtn", "cancelBlockEditor");
  bind("blockSaveBtn", "saveBlockEditor");
  bind("blockDeleteBtn", "deleteBlockEditor");
  bind("dayPlanCloseBtn", "closeDayPlan");
  bind("dayPlanAddBtn", "openNewDayBlock");
  bind("dayApplyTemplateBtn", "openApplyTemplateSheet");
  bind("dayClearBtn", "openClearDayConfirm");
  bind("applyTemplateCancelBtn", "cancelApplyTemplate");
  bind("clearDayCancelBtn", "cancelClearDay");
  bind("clearDayConfirmBtn", "confirmClearDay");
  bind("clearAllCancelBtn", "cancelClearAll");
  bind("clearAllConfirmBtn", "confirmClearAll");
  bind("signInCancelBtn", "cancelSignIn");
  bind("signInConfirmBtn", "attemptSignIn");
  bind("templateCancelBtn", "cancelTemplateEditor");
  bind("templateSaveBtn", "saveTemplateEditor");
  bind("templateDeleteBtn", "deleteTemplateEditor");
  bind("addTemplateBlockBtn", "openNewTBlock");
  bind("tBlockCancelBtn", "cancelTBlockEditor");
  bind("tBlockDoneBtn", "doneTBlockEditor");
  bind("tBlockDeleteBtn", "deleteTBlockEditor");
  bind("prevMonthBtn", "prevMonth");
  bind("nextMonthBtn", "nextMonth");

  document.getElementById("blockTitleInput").addEventListener("input", updateBlockSaveState);
  document.getElementById("templateNameInput").addEventListener("input", updateTemplateSaveState);
  document.getElementById("tBlockTitleInput").addEventListener("input", updateTBlockDoneState);

  const bumpEnd = (startId, endId) => {
    const s = timeInputToMinutes(document.getElementById(startId).value);
    const e = timeInputToMinutes(document.getElementById(endId).value);
    if (e <= s) document.getElementById(endId).value = timeInputValue(Math.min(23 * 60 + 59, s + 60));
  };
  document.getElementById("blockStartInput").addEventListener("change", () => bumpEnd("blockStartInput", "blockEndInput"));
  document.getElementById("tBlockStartInput").addEventListener("change", () => bumpEnd("tBlockStartInput", "tBlockEndInput"));

  document.getElementById("blockDetailsInput").addEventListener("input", (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(66, e.target.scrollHeight) + "px";
  });
}

const OVERLAY_IDS = ["blockEditorOverlay", "dayPlanOverlay", "templateEditorOverlay", "tBlockEditorOverlay", "applyTemplateOverlay", "clearDayOverlay", "clearAllOverlay", "signInOverlay"];

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) {
    if (e.target.classList && e.target.classList.contains("overlay")) {
      const id = OVERLAY_IDS.find((oid) => oid === e.target.id);
      if (id) closeOverlay(id);
    }
    return;
  }
  const action = el.dataset.action;
  switch (action) {
    case "switchTab": switchTab(el.dataset.tab); break;
    case "fabClick": handleFabClick(); break;

    case "openTodayBlock": {
      const block = blocksOn(state.now).find((b) => b.id === el.dataset.id);
      if (block) openBlockEditor(state.now, block);
      break;
    }
    case "cancelBlockEditor": closeOverlay("blockEditorOverlay"); break;
    case "saveBlockEditor": await saveBlockEditor(); break;
    case "deleteBlockEditor": await deleteBlockEditorAction(); break;
    case "pickBlockColor": state.editingBlockCtx.draftColorID = Number(el.dataset.color); renderBlockColorGrid(); break;
    case "pickBlockAlert": state.editingBlockCtx.draftAlert = el.dataset.alert; renderBlockAlertPicker(); break;

    case "prevMonth": state.calendarMonth = addMonths(state.calendarMonth, -1); renderCalendar(); break;
    case "nextMonth": state.calendarMonth = addMonths(state.calendarMonth, 1); renderCalendar(); break;
    case "stopStamping": state.stampingTemplateID = null; renderCalendar(); break;
    case "dayCellClick": {
      const date = keyToDate(el.dataset.date);
      if (state.stampingTemplateID) {
        const t = state.templates.find((x) => x.id === state.stampingTemplateID);
        if (t) { await applyTemplateToDate(t, date); showToast("Template applied"); refreshAll(); }
      } else {
        openDayPlan(date);
      }
      break;
    }

    case "closeDayPlan": closeOverlay("dayPlanOverlay"); break;
    case "openNewDayBlock": openBlockEditor(state.dayPlanDate, null); break;
    case "openDayBlock": {
      const block = blocksOn(state.dayPlanDate).find((b) => b.id === el.dataset.id);
      if (block) openBlockEditor(state.dayPlanDate, block);
      break;
    }
    case "openApplyTemplateSheet": openApplyTemplateSheet(); break;
    case "openClearDayConfirm": openClearDayConfirm(); break;

    case "pickTemplateForApply": await pickTemplateForApply(el.dataset.id); break;
    case "cancelApplyTemplate": closeOverlay("applyTemplateOverlay"); break;

    case "confirmClearDay": await confirmClearDay(); break;
    case "cancelClearDay": closeOverlay("clearDayOverlay"); break;

    case "openEditTemplate": {
      const t = state.templates.find((x) => x.id === el.dataset.id);
      if (t) openTemplateEditor(t);
      break;
    }
    case "toggleStamp": {
      const id = el.dataset.id;
      state.stampingTemplateID = state.stampingTemplateID === id ? null : id;
      refreshAll();
      break;
    }

    case "cancelTemplateEditor": closeOverlay("templateEditorOverlay"); break;
    case "saveTemplateEditor": await saveTemplateEditor(); break;
    case "deleteTemplateEditor": await deleteTemplateEditorAction(); break;
    case "pickTemplateColor": state.editingTemplate.colorID = Number(el.dataset.color); renderTemplateColorScroll(); break;
    case "openNewTBlock": openTBlockEditor(null); break;
    case "openEditTBlock": {
      const b = state.editingTemplate.blocks.find((x) => x.id === el.dataset.id);
      if (b) openTBlockEditor(b);
      break;
    }

    case "cancelTBlockEditor": closeOverlay("tBlockEditorOverlay"); break;
    case "doneTBlockEditor": commitTBlockEditor(); break;
    case "deleteTBlockEditor": deleteTBlockEditorAction(); break;
    case "pickTBlockColor": state.editingTBlock.draftColorID = Number(el.dataset.color); renderTBlockColorGrid(); break;
    case "pickTBlockAlert": state.editingTBlock.draftAlert = el.dataset.alert; renderTBlockAlertPicker(); break;
    case "exportData": exportData(); break;
    case "importData":
      if (requiresSignIn("importData")) break;
      document.getElementById("importFileInput").click();
      break;
    case "sendAlarms24h": sendAlarms24h(); break;
    case "openClearAllConfirm":
      if (requiresSignIn("openClearAllConfirm")) break;
      openOverlay("clearAllOverlay");
      break;
    case "confirmClearAll": await confirmClearAll(); break;
    case "openSignIn":
      state.pendingAction = null;
      document.getElementById("signInError").style.display = "none";
      document.getElementById("signInPasswordInput").value = "";
      openOverlay("signInOverlay");
      break;
    case "attemptSignIn": attemptSignIn(); break;
    case "cancelSignIn": closeOverlay("signInOverlay"); break;
    case "signOut": signOut(); break;
    case "cancelClearAll": closeOverlay("clearAllOverlay"); break;
  }
});

/* ---------------------------------------------------------------- boot */

function startTicker() {
  setInterval(() => {
    const oldDay = dateKey(state.now);

    state.now = new Date();

    const newDay = dateKey(state.now);

    if (state.activeTab === "today") {
      renderToday();
    }

    if (oldDay !== newDay) {
      refreshAll();
    }
  }, 10000);
}

async function boot() {
  const todayKey = dateKey(new Date());
  await DB.init(todayKey);
  const [templates, plans] = await Promise.all([DB.getAllTemplates(), DB.getAllPlans()]);
  state.templates = templates;
  state.plans = plans;

  wireStaticUI();
  wireSheetDragging();
  document.getElementById("signInPasswordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptSignIn();
  });
  switchTab("today");
  refreshAll();
  startTicker();
  autoPullTemplates(); // fire-and-forget, refreshes UI again once it resolves
}

boot().catch((err) => {
  console.error("Scheduly failed to start:", err);
  document.getElementById("app").innerHTML = `<div style="padding:60px 24px;text-align:center;color:var(--text-secondary);font-size:14px;line-height:1.5;">Couldn't start Scheduly's local database in this browser.<br><br>${escapeHtml(String((err && err.message) || err))}<br><br>Try an up-to-date Chrome, Safari, Edge, or Firefox.</div>`;
});