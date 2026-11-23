let tasks = JSON.parse(localStorage.getItem("hauntedTasksPro") || "[]");
let xp = parseInt(localStorage.getItem("hauntedXP") || "0", 10);
let activityLog = JSON.parse(localStorage.getItem("hauntedActivity") || "{}");
let themeIdx = 0, currentWorkspace = "all", soundMode = 1, viewMode = "list", usedBoard = false;
const themes = ["haunted", "toxic", "blood"];

(function loadFromSharedURL() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#share=")) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(hash.slice(7))));
      if (Array.isArray(decoded) && decoded.length > 0 && confirm("🔗 Load " + decoded.length + " shared tasks into your board?")) {
        tasks = decoded;
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch (e) {}
  }
})();

function shareBoard() {
  try {
    const compact = tasks.slice(0, 15).map(t => ({ id: t.id, text: t.text, workspace: t.workspace, priority: t.priority, done: t.done, subtasks: t.subtasks || [] }));
    const encoded = btoa(encodeURIComponent(JSON.stringify(compact)));
    const url = window.location.origin + window.location.pathname + "#share=" + encoded;
    navigator.clipboard.writeText(url).then(() => alert("🔗 Shareable Board Link copied! Send it to any friend or device."));
  } catch (e) { alert("Could not generate share link."); }
}

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function recordActivity() { const k = getTodayKey(); activityLog[k] = (activityLog[k] || 0) + 1; localStorage.setItem("hauntedActivity", JSON.stringify(activityLog)); }

function renderTrophies() {
  const row = document.getElementById("trophyRow"); if (!row) return;
  const doneTotal = tasks.filter(t => t.done).length;
  const list = [
    { name: "🩸 First Exorcism", ok: doneTotal >= 1 },
    { name: "⚡ 100+ XP", ok: xp >= 100 },
    { name: "🗂️ Kanban Master", ok: usedBoard },
    { name: "👑 5+ Completed", ok: doneTotal >= 5 }
  ];
  row.innerHTML = list.map(tr => "<span class='trophy-pill " + (tr.ok ? "unlocked" : "") + "'>" + tr.name + "</span>").join("");
}

function cycleView() {
  viewMode = viewMode === "list" ? "board" : "list";
  usedBoard = true;
  document.getElementById("viewToggleBtn").innerText = viewMode === "list" ? "🗂️ Board" : "📋 List";
  renderTasks();
}

function renderHeatmap() {
  const g = document.getElementById("heatmapGrid"); if (!g) return;
  g.innerHTML = ""; let streak = 0;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10), c = activityLog[k] || 0;
    if (c > 0) streak++;
    const lvl = c >= 5 ? "lvl-3" : c >= 2 ? "lvl-2" : c >= 1 ? "lvl-1" : "";
    g.innerHTML += "<div class='hm-day " + lvl + "'><div>" + days[d.getDay()] + "</div><div>" + c + "</div></div>";
  }
  document.getElementById("streakBadge").innerText = "🔥 " + Math.max(1, streak) + "d";
  document.getElementById("todayCount").innerText = "Today: " + (activityLog[getTodayKey()] || 0);
}

function setWorkspace(ws, btn) { currentWorkspace = ws; document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); if (btn) btn.classList.add("active"); renderTasks(); }
  drawChart(doneCount, vis.length); renderHeatmap(); renderTrophies();
  const lv = Math.floor(xp / 200) + 1, ranks = ["Novice", "Seeker", "Hunter", "Architect", "Overlord"];
  document.getElementById("rankBadge").innerText = "Lv." + lv + " " + ranks[Math.min(lv - 1, 4)];
  document.getElementById("xpText").innerText = (xp % 200) + " / 200 XP";
  document.getElementById("xpFill").style.width = (((xp % 200) / 200) * 100) + "%";

  const filtered = [];
  tasks.forEach((t, idx) => {
    const ws = t.workspace || "coding";
    if (currentWorkspace !== "all" && ws !== currentWorkspace) return;
    if (!t.text.toLowerCase().includes(q)) return;
    if ((f === "active" && t.done) || (f === "done" && !t.done) || (f === "doom" && t.priority !== "doom")) return;
    filtered.push({ t, idx });
  });

  container.innerHTML = "";
  if (viewMode === "board") {
    const grid = document.createElement("div"); grid.className = "board-grid";
    const col1 = document.createElement("div"); col1.className = "board-col"; col1.innerHTML = "<h4>🎃 CURSED</h4><ul></ul>";
    const col2 = document.createElement("div"); col2.className = "board-col"; col2.innerHTML = "<h4>👻 EXORCISED</h4><ul></ul>";
    filtered.forEach(({ t, idx }) => (t.done ? col2 : col1).querySelector("ul").appendChild(buildTaskCard(t, idx)));
    grid.appendChild(col1); grid.appendChild(col2); container.appendChild(grid);
  } else {
    const ul = document.createElement("ul"); ul.id = "taskList";
    filtered.forEach(({ t, idx }) => ul.appendChild(buildTaskCard(t, idx)));
    container.appendChild(ul);
  }
}

const fx = document.getElementById("fxCanvas"), fctx = fx.getContext("2d");
let pts = Array.from({ length: 24 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.5 - 0.1, r: Math.random() * 2 + 1, a: 0.4, b: false }));
function spawnBurst(x, y, n) { const cols = ["#ff6b00", "#38b000", "#9d4edd", "#ffbe0b", "#00f5d4"]; for (let i = 0; i < n; i++) { const ang = Math.random() * 6.28, sp = Math.random() * 4 + 1.5; pts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 3, a: 1, c: cols[i % 5], b: true }); } }
(function loop() {
  if (fx.width !== innerWidth) { fx.width = innerWidth; fx.height = innerHeight; }
  fctx.clearRect(0, 0, fx.width, fx.height);
  pts = pts.filter(p => !p.b || p.a > 0.03);
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.b) { p.vy += 0.08; p.a -= 0.022; } else { if (p.y < 0) p.y = fx.height; if (p.x < 0) p.x = fx.width; if (p.x > fx.width) p.x = 0; }
    fctx.globalAlpha = Math.max(0, p.a); fctx.fillStyle = p.c || "#ff9e00";
    fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.28); fctx.fill();
  });
  requestAnimationFrame(loop);
})();

document.getElementById("taskInput").addEventListener("keypress", e => { if (e.key === "Enter") addTask(); });
renderTasks();
setInterval(renderTasks, 1000);function renderTasks() {
  const container = document.getElementById("taskContainer"), q = document.getElementById("searchInput").value.toLowerCase(), f = document.getElementById("filterSelect").value;
  const vis = currentWorkspace === "all" ? tasks : tasks.filter(t => (t.workspace || "coding") === currentWorkspace);
  const doneCount = vis.filter(t => t.done).length;
  document.getElementById("totalCount").innerText = vis.length; document.getElementById("doneCount").innerText = doneCount; document.getElementById("activeCount").innerText = vis.length - doneCount;
  drawChart(doneCount, vis.length); renderHeatmap(); renderTrophies();
  const lv = Math.floor(xp / 200) + 1, ranks = ["Novice", "Seeker", "Hunter", "Architect", "Overlord"];
  document.getElementById("rankBadge").innerText = "Lv." + lv + " " + ranks[Math.min(lv - 1, 4)];
  document.getElementById("xpText").innerText = (xp % 200) + " / 200 XP";
  document.getElementById("xpFill").style.width = (((xp % 200) / 200) * 100) + "%";

  const filtered = [];
  tasks.forEach((t, idx) => {
    const ws = t.workspace || "coding";
    if (currentWorkspace !== "all" && ws !== currentWorkspace) return;
    if (!t.text.toLowerCase().includes(q)) return;
    if ((f === "active" && t.done) || (f === "done" && !t.done) || (f === "doom" && t.priority !== "doom")) return;
    filtered.push({ t, idx });
  });

  container.innerHTML = "";
  if (viewMode === "board") {
    const grid = document.createElement("div"); grid.className = "board-grid";
    const col1 = document.createElement("div"); col1.className = "board-col"; col1.innerHTML = "<h4>🎃 CURSED</h4><ul></ul>";
    const col2 = document.createElement("div"); col2.className = "board-col"; col2.innerHTML = "<h4>👻 EXORCISED</h4><ul></ul>";
    filtered.forEach(({ t, idx }) => (t.done ? col2 : col1).querySelector("ul").appendChild(buildTaskCard(t, idx)));
    grid.appendChild(col1); grid.appendChild(col2); container.appendChild(grid);
  } else {
    const ul = document.createElement("ul"); ul.id = "taskList";
    filtered.forEach(({ t, idx }) => ul.appendChild(buildTaskCard(t, idx)));
    container.appendChild(ul);
  }
}

const fx = document.getElementById("fxCanvas"), fctx = fx.getContext("2d");
let pts = Array.from({ length: 24 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.5 - 0.1, r: Math.random() * 2 + 1, a: 0.4, b: false }));
function spawnBurst(x, y, n) { const cols = ["#ff6b00", "#38b000", "#9d4edd", "#ffbe0b", "#00f5d4"]; for (let i = 0; i < n; i++) { const ang = Math.random() * 6.28, sp = Math.random() * 4 + 1.5; pts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 3, a: 1, c: cols[i % 5], b: true }); } }
(function loop() {
  if (fx.width !== innerWidth) { fx.width = innerWidth; fx.height = innerHeight; }
  fctx.clearRect(0, 0, fx.width, fx.height);
  pts = pts.filter(p => !p.b || p.a > 0.03);
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.b) { p.vy += 0.08; p.a -= 0.022; } else { if (p.y < 0) p.y = fx.height; if (p.x < 0) p.x = fx.width; if (p.x > fx.width) p.x = 0; }
    fctx.globalAlpha = Math.max(0, p.a); fctx.fillStyle = p.c || "#ff9e00";
    fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.28); fctx.fill();
  });
  requestAnimationFrame(loop);
})();

document.getElementById("taskInput").addEventListener("keypress", e => { if (e.key === "Enter") addTask(); });
renderTasks();
setInterval(renderTasks, 1000);
