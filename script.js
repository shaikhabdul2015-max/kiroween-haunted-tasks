let tasks = JSON.parse(localStorage.getItem("hauntedTasksPro") || "[]");
let xp = parseInt(localStorage.getItem("hauntedXP") || "0", 10);
let activityLog = JSON.parse(localStorage.getItem("hauntedActivity") || "{}");
let themeIdx = 0, currentWorkspace = "all", soundMode = 1, viewMode = "list";
const themes = ["haunted", "toxic", "blood"];

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function recordActivity() { const k = getTodayKey(); activityLog[k] = (activityLog[k] || 0) + 1; localStorage.setItem("hauntedActivity", JSON.stringify(activityLog)); }

function cycleView() {
  viewMode = viewMode === "list" ? "board" : "list";
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

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("Voice API not supported in this browser!");
  const btn = document.getElementById("voiceBtn"), inp = document.getElementById("taskInput"), rec = new SR();
  rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
  btn.classList.add("listening"); inp.placeholder = "🎙️ Listening... Speak now!";
  rec.onresult = e => { inp.value = e.results.item(0).item(0).transcript; btn.classList.remove("listening"); inp.placeholder = "Summon task or tap 🎙️..."; addTask(); };
  rec.onerror = e => { btn.classList.remove("listening"); inp.placeholder = "Summon task or tap 🎙️..."; alert("🎙️ Mic Error: " + e.error); };
  rec.onend = () => { btn.classList.remove("listening"); inp.placeholder = "Summon task or tap 🎙️..."; };
  try { rec.start(); } catch (err) { btn.classList.remove("listening"); }
}

let pomoSeconds = 1500, pomoInterval = null;
function togglePomo() {
  const btn = document.getElementById("pomoStartBtn");
  if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Resume"; }
  else {
    btn.innerText = "⏸ Pause";
    pomoInterval = setInterval(() => {
      pomoSeconds--; updatePomoUI();
      if (pomoSeconds <= 0) {
        clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Start";
        xp += 150; recordActivity(); spawnBurst(window.innerWidth / 2, 200, 50); playSpookySound("exorcise"); saveAndRender();
        pomoSeconds = 1500; updatePomoUI();
      }
    }, 1000);
  }
}
function resetPomo() { clearInterval(pomoInterval); pomoInterval = null; pomoSeconds = 1500; document.getElementById("pomoStartBtn").innerText = "▶ Start"; updatePomoUI(); }
function updatePomoUI() { document.getElementById("pomoDisplay").innerText = String(Math.floor(pomoSeconds/60)).padStart(2,"0") + ":" + String(pomoSeconds%60).padStart(2,"0"); }
function cycleTheme() { themeIdx = (themeIdx + 1) % themes.length; document.body.setAttribute("data-theme", themes[themeIdx]); }
function toggleSound() {
  soundMode = (soundMode + 1) % 3;
  const icons = ["🔇", "🔊", "🛸"];
  document.getElementById("soundToggle").innerText = icons[soundMode];
}
function playSpookySound(type) {
  if (soundMode === 0) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = soundMode === 2 ? "square" : (type === "summon" ? "sawtooth" : "sine");
    osc.frequency.setValueAtTime(soundMode === 2 ? 520 : (type === "summon" ? 140 : 320), ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(soundMode === 2 ? 180 : (type === "summon" ? 55 : 880), ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.14, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

function saveAndRender() { localStorage.setItem("hauntedTasksPro", JSON.stringify(tasks)); localStorage.setItem("hauntedXP", xp.toString()); renderTasks(); }

function addTask() {
  const input = document.getElementById("taskInput"), text = input.value.trim();
  if (!text) return input.focus();
  const mins = parseInt(document.getElementById("timerSelect").value, 10) || 0;
  tasks.unshift({ id: Date.now(), text, workspace: document.getElementById("workspaceSelect").value, priority: document.getElementById("prioritySelect").value, done: false, rewarded: false, subtasks: [], deadline: mins > 0 ? Date.now() + mins * 60000 : null });
  input.value = ""; playSpookySound("summon"); saveAndRender();
}

function smartSplitTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  t.subtasks = t.subtasks || [];
  ["📐 Plan: " + t.text, "⚡ Execute core steps", "✅ Test & finalize"].forEach(s => t.subtasks.push({ text: s, done: false }));
  playSpookySound("exorcise"); saveAndRender();
}

function toggleSubtask(tid, sIdx) { const t = tasks.find(x => x.id === tid); if (t && t.subtasks && t.subtasks[sIdx]) { t.subtasks[sIdx].done = !t.subtasks[sIdx].done; saveAndRender(); } }
function toggleTask(id, e) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  t.done = !t.done;
  if (t.done) {
    if (!t.rewarded) { xp += t.priority === "doom" ? 100 : t.priority === "hex" ? 50 : 25; t.rewarded = true; recordActivity(); }
    const r = e && e.target ? e.target.getBoundingClientRect() : { left: window.innerWidth / 2, top: 200 };
    spawnBurst(r.left, r.top, 35);
  }
  playSpookySound("exorcise"); saveAndRender();
}
function editTask(id) { const t = tasks.find(x => x.id === id), u = t && prompt("Edit task:", t.text); if (u && u.trim()) { t.text = u.trim(); saveAndRender(); } }
function moveTask(i, d) { const n = i + d; if (n >= 0 && n < tasks.length) { [tasks[i], tasks[n]] = [tasks[n], tasks[i]]; saveAndRender(); } }
function deleteTask(id) { tasks = tasks.filter(x => x.id !== id); saveAndRender(); }

function exportCSV() {
  let csv = "Task,Workspace,Priority,Status,Subtasks\n";
  tasks.forEach(t => { csv += `"${t.text.replace(/"/g, '""')}",${t.workspace || "coding"},${t.priority},${t.done ? "Done" : "Active"},${(t.subtasks || []).length}\n`; });
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "kiroween-quantum-v7.csv"; a.click();
}
function copyReport() {
  const done = tasks.filter(t => t.done).length, rank = document.getElementById("rankBadge").innerText;
  let md = "# Kiroween Quantum v7.0 Report\n- Rank: " + rank + " (" + xp + " XP)\n- Done: " + done + "/" + tasks.length + "\n\n";
  tasks.forEach(t => { md += "- [" + (t.done ? "x" : " ") + "] " + t.text + "\n"; });
  navigator.clipboard.writeText(md).then(() => alert("Report copied!"));
}
function exportData() { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ version: "7.0", xp, activityLog, tasks }, null, 2)], { type: "application/json" })); a.download = "kiroween-v7.json"; a.click(); }
function importData(e) { const f = e.target.files; if (!f) return; const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); tasks = Array.isArray(d) ? d : (d.tasks || tasks); xp = d.xp || xp; activityLog = d.activityLog || activityLog; saveAndRender(); alert("Restored!"); } catch { alert("Invalid file!"); } }; r.readAsText(f); }

function drawChart(done, total) {
  const c = document.getElementById("progressChart"); if (!c) return;
  const ctx = c.getContext("2d"), pct = total === 0 ? 0 : done / total;
  ctx.clearRect(0, 0, 76, 76); ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath(); ctx.arc(38, 38, 28, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#38b000"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(38, 38, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(Math.round(pct * 100) + "%", 38, 38);
}

function buildTaskCard(t, idx) {
  const ws = t.workspace || "coding";
  let timerHtml = "", overdue = false;
  if (t.deadline && !t.done) {
    const diff = t.deadline - Date.now();
    if (diff <= 0) { overdue = true; timerHtml = "<span class='timer-badge'>EXPIRED!</span>"; }
    else timerHtml = "<span class='timer-badge'>" + Math.floor(diff/60000) + "m " + Math.floor((diff%60000)/1000) + "s</span>";
  }
  const subs = (t.subtasks || []).map((s, si) => "<div class='sub-item " + (s.done?"sub-done":"") + "' onclick='toggleSubtask(" + t.id + "," + si + ")'>" + (s.done?"[x] ":"[ ] ") + s.text + "</div>").join("");
  const li = document.createElement("li");
  li.className = "task-card " + t.priority + (t.done?" done":"") + (overdue?" overdue":"");
  li.innerHTML = "<div class='task-top'><div class='task-info'><div class='main-text'>" + t.text + "</div><div class='meta-row'><span class='tag-badge'>" + ws + "</span>" + timerHtml + "</div></div><div class='actions'><button class='ai-btn' onclick='smartSplitTask(" + t.id + ")'>✨Split</button><button onclick='moveTask(" + idx + ",-1)'>▲</button><button onclick='moveTask(" + idx + ",1)'>▼</button><button onclick='editTask(" + t.id + ")'>Edit</button><button class='ex-btn' onclick='toggleTask(" + t.id + ",event)'>" + (t.done?"Undo":"✓") + "</button><button class='del-btn' onclick='deleteTask(" + t.id + ")'>✕</button></div></div>" + (subs ? "<div class='subtasks'>" + subs + "</div>" : "");
  return li;
}

function renderTasks() {
  const container = document.getElementById("taskContainer"), q = document.getElementById("searchInput").value.toLowerCase(), f = document.getElementById("filterSelect").value;
  const vis = currentWorkspace === "all" ? tasks : tasks.filter(t => (t.workspace || "coding") === currentWorkspace);
  const doneCount = vis.filter(t => t.done).length;
  document.getElementById("totalCount").innerText = vis.length; document.getElementById("doneCount").innerText = doneCount; document.getElementById("activeCount").innerText = vis.length - doneCount;
  drawChart(doneCount, vis.length); renderHeatmap();
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
