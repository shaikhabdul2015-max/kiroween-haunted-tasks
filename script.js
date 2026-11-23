let tasks = JSON.parse(localStorage.getItem('hauntedTasksPro')) || [];
let soundEnabled = true;

function playSpookySound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'summon') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.25);
    }
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('soundToggle').innerText = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
}

function saveAndRender() {
  localStorage.setItem('hauntedTasksPro', JSON.stringify(tasks));
  renderTasks();
}

function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('prioritySelect').value;
  const mins = parseInt(document.getElementById('timerSelect').value);
  if (!input.value.trim()) return;
  tasks.unshift({
    id: Date.now(),
    text: input.value.trim(),
    priority,
    done: false,
    deadline: mins > 0 ? Date.now() + mins * 60000 : null
  });
  input.value = '';
  playSpookySound('summon');
  saveAndRender();
}

function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; playSpookySound('exorcise'); saveAndRender(); }
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveAndRender();
}

function clearCompleted() {
  tasks = tasks.filter(x => !x.done);
  saveAndRender();
}

function exportData() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kiroween-tasks-backup.json';
  a.click();
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterSelect').value;
  
  document.getElementById('totalCount').innerText = tasks.length;
  document.getElementById('doneCount').innerText = tasks.filter(t => t.done).length;
  document.getElementById('activeCount').innerText = tasks.filter(t => !t.done).length;

  list.innerHTML = '';
  tasks.filter(t => {
    const matchText = t.text.toLowerCase().includes(query);
    if (filter === 'active') return matchText && !t.done;
    if (filter === 'done') return matchText && t.done;
    if (filter === 'doom') return matchText && t.priority === 'doom';
    return matchText;
  }).forEach(t => {
    let timerHtml = '';
    let isOverdue = false;
    if (t.deadline && !t.done) {
      const diff = t.deadline - Date.now();
      if (diff <= 0) { isOverdue = true; timerHtml = '<span class="timer-badge">💀 CURSE UNLEASHED!</span>'; }
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerHtml = `<span class="timer-badge">⏱️ ${m}m ${s}s left</span>`;
      }
    }
    const li = document.createElement('li');
    li.className = `${t.priority} ${t.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`;
    li.innerHTML = `<div class="task-info"><div>${t.done ? '👻' : '🎃'} ${t.text}</div>${timerHtml}</div>
      <div class="actions">
        <button class="ex-btn" onclick="toggleTask(${t.id})">${t.done ? '↩️' : '✓'}</button>
        <button class="del-btn" onclick="deleteTask(${t.id})">✕</button>
      </div>`;
    list.appendChild(li);
  });
}

setInterval(renderTasks, 1000);
renderTasks();
