let tasks = JSON.parse(localStorage.getItem("hauntedTasksPro") || "[]");
let xp = parseInt(localStorage.getItem("hauntedXP") || "0", 10);
let activityLog = JSON.parse(localStorage.getItem("hauntedActivity") || "{}");
let themeIdx = 0, currentWorkspace = "all", soundEnabled = true;
const themes = ["haunted", "toxic", "blood"];

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function recordActivity() { const k = getTodayKey(); activityLog[k] = (activityLog[k] || 0) + 1; localStorage.setItem("hauntedActivity", JSON.stringify(activityLog)); }

function renderHeatmap() {
  const g = document.getElementById("heatmapGrid"); if (!g) return;
  g.innerHTML = ""; let streak = 0;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10), c = activityLog[k] || 0;
    if (c > 0) streak++;
    const lvl = c >= 5 ? "lvl-3" : c >= 2 ? "lvl-2" : c >= 1 ? "lvl-1" : "";
    g.innerHTML += "<div class=\"hm-day " + lvl + "\"><div>" + days[d.getDay()] + "</div><div>" + c + "</div></div>";
  }
  document.getElementById("streakBadge").innerText = "🔥 " + Math.max(1, streak) + "d";
  document.getElementById("todayCount").innerText = "Today: " + (activityLog[getTodayKey()] || 0);
}

function setWorkspace(ws, btn) { currentWorkspace = ws; document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); if (btn) btn.classList.add("active"); renderTasks(); }

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("Voice API not supported in this browser!");
  const btn = document.getElementById("voiceBtn"), inp = document.getElementById("taskInput"), rec = new SR();
  rec.lang = "en-US"; btn.classList.add("listening"); inp.placeholder = "🎙️ Listening...";
  rec.onresult = e => { inp.value = e.results.item(0).item(0).transcript; btn.classList.remove("listening"); inp.placeholder = "Summon task or tap 🎙️..."; addTask(); };
  rec.onerror = rec.onend = () => { btn.classList.remove("listening"); inp.placeholder = "Summon task or tap 🎙️..."; };
  try { rec.start(); } catch (err) { btn.classList.remove("listening"); }
}

let pomoSeconds = 1500, pomoInterval = null;
function togglePomo() {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  const btn = document.getElementById("pomoStartBtn");
  if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Resume"; }
  else {
    btn.innerText = "⏸ Pause";
    pomoInterval = setInterval(() => {
      pomoSeconds--; updatePomoUI();
      if (pomoSeconds <= 0) {
        clearInterval(pomoInterval); pomoInterval = null; btn.innerText = "▶ Start";
        xp += 150; recordActivity(); spawnBurst(window.innerWidth / 2, 200, 50); playSpookySound("exorcise"); saveAndRender();
        if ("Notification" in window && Notification.permission === "granted") new Notification("🎃 Focus Ritual Complete!", { body: "+150 XP Awarded!" });
        pomoSeconds = 1500; updatePomoUI();
      }
    }, 1000);
  }
}
function resetPomo() { clearInterval(pomoInterval); pomoInterval = null; pomoSeconds = 1500; document.getElementById("pomoStartBtn").innerText = "▶ Start"; updatePomoUI(); }
function updatePomoUI() { document.getElementById("pomoDisplay").innerText = String(Math.floor(pomoSeconds/60)).padStart(2,"0") + ":" + String(pomoSeconds%60).padStart(2,"0"); }
function cycleTheme() { themeIdx = (themeIdx + 1) % themes.length; document.body.setAttribute("data-theme", themes[themeIdx]); }
function toggleSound() { soundEnabled = !soundEnabled; document.getElementById("soundToggle").innerText = soundEnabled ? "🔊" : "🔇"; }
renderTasks();
