let tasks = JSON.parse(localStorage.getItem("hauntedTasksPro") || "[]");
let xp = parseInt(localStorage.getItem("hauntedXP") || "0", 10);
let activityLog = JSON.parse(localStorage.getItem("hauntedActivity") || "{}");
let themeIdx = 0, currentWorkspace = "all", soundMode = 1, viewMode = "list", usedBoard = false;
const themes = ["haunted", "toxic", "blood"];

function shareBoard() {
  const c = tasks.slice(0, 15).map(t => ({ id: t.id, text: t.text, workspace: t.workspace, priority: t.priority, done: t.done, subtasks: t.subtasks || [] }));
  const url = location.origin + location.pathname + "#share=" + btoa(encodeURIComponent(JSON.stringify(c)));
  navigator.clipboard.writeText(url).then(() => alert("🔗 Shareable Link Copied!"));
}
if (location.hash.startsWith("#share=")) { try { const d = JSON.parse(decodeURIComponent(atob(location.hash.slice(7)))); if (Array.isArray(d) && confirm("Load " + d.length + " shared tasks?")) tasks = d; history.replaceState(null, "", location.pathname + location.search); } catch {} }
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function recordActivity() { const k = getTodayKey(); activityLog[k] = (activityLog[k] || 0) + 1; localStorage.setItem("hauntedActivity", JSON.stringify(activityLog)); }
function cycleView() { viewMode = viewMode === "list" ? "board" : "list"; usedBoard = true; document.getElementById("viewToggleBtn").innerText = viewMode === "list" ? "🗂️ Board" : "📋 List"; renderTasks(); }
function setWorkspace(ws, btn) { currentWorkspace = ws; document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); if (btn) btn.classList.add("active"); renderTasks(); }
function cycleTheme() { themeIdx = (themeIdx + 1) % themes.length; document.body.setAttribute("data-theme", themes[themeIdx]); }
function toggleSound() { soundMode = (soundMode + 1) % 3; document.getElementById("soundToggle").innerText = ["🔇", "🔊", "🛸"][soundMode]; }
function renderTrophies() {
  const row = document.getElementById("trophyRow"); if (!row) return;
  const doneTotal = tasks.filter(t => t.done).length;
  const list = [{ name: "🩸 First Exorcism", ok: doneTotal >= 1 }, { name: "⚡ 100+ XP", ok: xp >= 100 }, { name: "🗂️ Kanban Master", ok: usedBoard }, { name: "👑 5+ Completed", ok: doneTotal >= 5 }];
  row.innerHTML = list.map(tr => "<span class='trophy-pill " + (tr.ok ? "unlocked" : "") + "'>" + tr.name + "</span>").join("");
}
function renderHeatmap() {
  const g = document.getElementById("heatmapGrid"); if (!g) return;
  g.innerHTML = ""; let streak = 0; const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const k = d.toISOString().slice(0, 10), c = activityLog[k] || 0;
    if (c > 0) streak++; const lvl = c >= 5 ? "lvl-3" : c >= 2 ? "lvl-2" : c >= 1 ? "lvl-1" : "";
    g.innerHTML += "<div class='hm-day " + lvl + "'><div>" + days[d.getDay()] + "</div><div>" + c + "</div></div>";
  }
  document.getElementById("streakBadge").innerText = "🔥 " + Math.max(1, streak) + "d";
  document.getElementById("todayCount").innerText = "Today: " + (activityLog[getTodayKey()] || 0);
}
function playSpookySound(type) { if (soundMode === 0) return; try { const ctx = new (window.AudioContext || window.webkitAudioContext)(), osc = ctx.createOscillator(), gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = soundMode === 2 ? "square" : (type === "summon" ? "sawtooth" : "sine"); osc.frequency.setValueAtTime(soundMode === 2 ? 520 : (type === "summon" ? 140 : 320), ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(soundMode === 2 ? 180 : (type === "summon" ? 55 : 880), ctx.currentTime + 0.25); gain.gain.setValueAtTime(0.14, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); osc.start(); osc.stop(ctx.currentTime + 0.25); } catch {} }
function startVoiceInput() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return alert("Voice API not supported!"); const btn = document.getElementById("voiceBtn"), inp = document.getElementById("taskInput"), rec = new SR(); rec.lang = "en-US"; btn.classList.add("listening"); inp.placeholder = "🎙️ Listening..."; rec.onresult = e => { inp.value = e.results.item(0).item(0).transcript; btn.classList.remove("listening"); inp.placeholder = "Try: 'Fix bug 15m !doom #coding' or 🎙️"; addTask(); }; rec.onerror = rec.onend = () => { btn.classList.remove("listening"); inp.placeholder = "Try: 'Fix bug 15m !doom #coding' or 🎙️"; }; try { rec.start(); } catch { btn.classList.remove("listening"); } }
let pomoSeconds = 1500, pomoInterval = null;
function togglePomo() { const btn = document.getElementById("pomoStartBtn"); if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Resume"; } else { btn.innerText = "⏸ Pause"; pomoInterval = setInterval(() => { pomoSeconds--; updatePomoUI(); if (pomoSeconds <= 0) { clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Start"; xp += 150; recordActivity(); playSpookySound("exorcise"); saveAndRender(); pomoSeconds = 1500; updatePomoUI(); } }, 1000); } }
function resetPomo() { clearInterval(pomoInterval); pomoInterval = null; pomoSeconds = 1500; document.getElementById("pomoStartBtn").innerText = "▶ Start"; updatePomoUI(); }
function updatePomoUI() { document.getElementById("pomoDisplay").innerText = String(Math.floor(pomoSeconds/60)).padStart(2,"0") + ":" + String(pomoSeconds%60).padStart(2,"0"); }
function saveAndRender() { localStorage.setItem("hauntedTasksPro", JSON.stringify(tasks)); localStorage.setItem("hauntedXP", xp.toString()); renderTasks(); }
function addTask() {
  const input = document.getElementById("taskInput"); let text = input.value.trim(); if (!text) return input.focus();
  let workspace = document.getElementById("workspaceSelect").value, priority = document.getElementById("prioritySelect").value, mins = parseInt(document.getElementById("timerSelect").value, 10) || 0;
  if (/#coding\b/i.test(text)) { workspace = "coding"; text = text.replace(/#coding\b/ig, ""); }
  if (/#study\b/i.test(text)) { workspace = "study"; text = text.replace(/#study\b/ig, ""); }
  if (/#personal\b/i.test(text)) { workspace = "personal"; text = text.replace(/#personal\b/ig, ""); }
  if (/!doom\b/i.test(text)) { priority = "doom"; text = text.replace(/!doom\b/ig, ""); }
  if (/!hex\b/i.test(text)) { priority = "hex"; text = text.replace(/!hex\b/ig, ""); }
  const tm = text.match(/\b(\d+)m\b/i); if (tm) { mins = parseInt(tm, 10); text = text.replace(tm, ""); }
  text = text.replace(/\s+/g, " ").trim() || "Mystery Ritual";
  tasks.unshift({ id: Date.now(), text, workspace, priority, done: false, rewarded: false, subtasks: [], deadline: mins > 0 ? Date.now() + mins * 60000 : null });
  input.value = ""; playSpookySound("summon"); saveAndRender();
}
function smartSplitTask(id) { const t = tasks.find(x => x.id === id); if (!t) return; t.subtasks = t.subtasks || []; ["📐 Plan: " + t.text, "⚡ Execute core steps", "✅ Test & finalize"].forEach(s => t.subtasks.push({ text: s, done: false })); playSpookySound("exorcise"); saveAndRender(); }
function toggleSubtask(tid, sIdx) { const t = tasks.find(x => x.id === tid); if (t && t.subtasks && t.subtasks[sIdx]) { t.subtasks[sIdx].done = !t.subtasks[sIdx].done; saveAndRender(); } }
function toggleTask(id) { const t = tasks.find(x => x.id === id); if (!t) return; t.done = !t.done; if (t.done && !t.rewarded) { xp += t.priority === "doom" ? 100 : t.priority === "hex" ? 50 : 25; t.rewarded = true; recordActivity(); } playSpookySound("exorcise"); saveAndRender(); }
function moveTask(i, d) { const n = i + d; if (n >= 0 && n < tasks.length) { [tasks[i], tasks[n]] = [tasks[n], tasks[i]]; saveAndRender(); } }
function deleteTask(id) { tasks = tasks.filter(x => x.id !== id); saveAndRender(); }
function exportCSV() { let csv = "Task,Workspace,Priority,Status\n"; tasks.forEach(t => { csv += `"${t.text.replace(/"/g, '""')}",${t.workspace || "coding"},${t.priority},${t.done ? "Done" : "Active"}\n`; }); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "kiroween-apex-v8.csv"; a.click(); }
function copyReport() { let md = "# Kiroween Apex Report (" + xp + " XP)\n\n"; tasks.forEach(t => { md += "- [" + (t.done ? "x" : " ") + "] " + t.text + "\n"; }); navigator.clipboard.writeText(md).then(() => alert("Report copied!")); }
function exportData() { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ xp, activityLog, tasks }, null, 2)], { type: "application/json" })); a.download = "kiroween-v8.json"; a.click(); }
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
  if (t.deadline && !t.done) { const diff = t.deadline - Date.now(); if (diff <= 0) { overdue = true; timerHtml = "<span class='timer-badge'>EXPIRED!</span>"; } else timerHtml = "<span class='timer-badge'>" + Math.floor(diff/60000) + "m " + Math.floor((diff%60000)/1000) + "s</span>"; }
  const subs = (t.subtasks || []).map((s, si) => "<div class='sub-item " + (s.done?"sub-done":"") + "' onclick='toggleSubtask(" + t.id + "," + si + ")'>" + (s.done?"[x] ":"[ ] ") + s.text + "</div>").join("");
  const li = document.createElement("li"); li.className = "task-card " + t.priority + (t.done?" done":"") + (overdue?" overdue":"");
  li.innerHTML = "<div class='task-top'><div class='task-info'><div class='main-text'>" + t.text + "</div><div class='meta-row'><span class='tag-badge'>" + ws + "</span>" + timerHtml + "</div></div><div class='actions'><button class='ai-btn' onclick='smartSplitTask(" + t.id + ")'>✨Split</button><button onclick='moveTask(" + idx + ",-1)'>▲</button><button onclick='moveTask(" + idx + ",1)'>▼</button><button class='ex-btn' onclick='toggleTask(" + t.id + ")'>" + (t.done?"Undo":"✓") + "</button><button class='del-btn' onclick='deleteTask(" + t.id + ")'>✕</button></div></div>" + (subs ? "<div class='subtasks'>" + subs + "</div>" : "");
  return li;
}
function renderTasks() {
  const c = document.getElementById("taskContainer"), q = document.getElementById("searchInput").value.toLowerCase(), f = document.getElementById("filterSelect").value;
  const vis = currentWorkspace === "all" ? tasks : tasks.filter(t => (t.workspace || "coding") === currentWorkspace);
  const done = vis.filter(t => t.done).length;
  document.getElementById("totalCount").innerText = vis.length; document.getElementById("doneCount").innerText = done; document.getElementById("activeCount").innerText = vis.length - done;
  drawChart(done, vis.length); renderHeatmap(); renderTrophies();
  const lv = Math.floor(xp / 200) + 1, ranks = ["Novice", "Seeker", "Hunter", "Architect", "Overlord"];
  document.getElementById("rankBadge").innerText = "Lv." + lv + " " + ranks[Math.min(lv - 1, 4)];
  document.getElementById("xpText").innerText = (xp % 200) + " / 200 XP";
  document.getElementById("xpFill").style.width = (((xp % 200) / 200) * 100) + "%";
  const flt = []; tasks.forEach((t, idx) => { const ws = t.workspace || "coding"; if ((currentWorkspace === "all" || ws === currentWorkspace) && t.text.toLowerCase().includes(q) && !((f === "active" && t.done) || (f === "done" && !t.done) || (f === "doom" && t.priority !== "doom"))) flt.push({ t, idx }); });
  c.innerHTML = "";
  if (viewMode === "board") {
    const g = document.createElement("div"); g.className = "board-grid";
    const c1 = document.createElement("div"); c1.className = "board-col"; c1.innerHTML = "<h4>🎃 CURSED</h4><ul></ul>";
    const c2 = document.createElement("div"); c2.className = "board-col"; c2.innerHTML = "<h4>👻 EXORCISED</h4><ul></ul>";
    flt.forEach(({ t, idx }) => (t.done ? c2 : c1).querySelector("ul").appendChild(buildTaskCard(t, idx)));
    g.appendChild(c1); g.appendChild(c2); c.appendChild(g);
  } else {
    const ul = document.createElement("ul"); ul.id = "taskList"; flt.forEach(({ t, idx }) => ul.appendChild(buildTaskCard(t, idx))); c.appendChild(ul);
  }
}
document.getElementById("taskInput").addEventListener("keypress", e => { if (e.key === "Enter") addTask(); });
renderTasks(); setInterval(renderTasks, 1000);
function toggleCmd() {
  const m = document.getElementById("cmdModal");
  if (m) m.style.display = m.style.display === "flex" ? "none" : "flex";
}
function loadDemo() {
  tasks.unshift(
    { id: Date.now()+1, text: "Deploy Production API", workspace: "coding", priority: "doom", done: false, rewarded: false, subtasks: [{text:"📐 Check env keys",done:true},{text:"🚀 Push build",done:false}], deadline: Date.now()+900000 },
    { id: Date.now()+2, text: "System Design Revision", workspace: "study", priority: "hex", done: false, rewarded: false, subtasks: [], deadline: null }
  );
  saveAndRender();
}
function clearDone() { tasks = tasks.filter(t => !t.done); saveAndRender(); }
setInterval(() => {
  const coach = document.getElementById("aiCoach"); if (!coach) return;
  const active = tasks.filter(t => !t.done), doom = active.filter(t => t.priority === "doom");
  coach.innerText = doom.length > 0
    ? "🤖 AI Coach: 🔥 " + doom.length + " Deadly Doom task(s) pending — tackle them first for +100 XP!"
    : active.length > 0
    ? "🤖 AI Coach: ⚡ " + active.length + " active task(s) left. Tap ✨Split or start a 25m Focus Ritual!"
    : "🤖 AI Coach: 🏆 Zero backlog! Tap ⚡Cmd to load demo tasks or summon a new goal.";
}, 1000);
renderTasks();
function autoPrioritize() {
  const rank = { doom: 3, hex: 2, minor: 1 };
  tasks.sort((a, b) => (a.done - b.done) || ((rank[b.priority] || 1) - (rank[a.priority] || 1)));
  playSpookySound("exorcise");
  saveAndRender();
}
function drawWsBars() {
  const c = document.getElementById("wsBarChart"); if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 84, 36);
  const cols = ["#00f5d4", "#ffbe0b", "#ff6b00"];
  ["coding", "study", "personal"].forEach((ws, i) => {
    const cnt = tasks.filter(t => (t.workspace || "coding") === ws).length;
    const h = Math.min(28, cnt * 5 + 4);
    ctx.fillStyle = cols[i];
    ctx.fillRect(10 + i * 24, 34 - h, 16, h);
  });
}
setInterval(drawWsBars, 1000);
drawWsBars();
