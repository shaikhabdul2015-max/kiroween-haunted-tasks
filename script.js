let tasks = JSON.parse(localStorage.getItem('hauntedTasks')) || [];
function saveAndRender() {
  localStorage.setItem('hauntedTasks', JSON.stringify(tasks));
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = `${t.priority} ${t.done ? 'done' : ''}`;
    li.innerHTML = `<span>${t.done ? '👻 Exorcised: ' : '🎃 '}${t.text}</span>
      <div class="actions">
        <button onclick="toggleTask(${i})">${t.done ? 'Undo' : 'Exorcise'}</button>
        <button class="del-btn" onclick="deleteTask(${i})">🔥</button>
      </div>`;
    list.appendChild(li);
  });
}
function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('prioritySelect').value;
  if (!input.value.trim()) return;
  tasks.push({ text: input.value.trim(), priority, done: false });
  input.value = '';
  saveAndRender();
}
function toggleTask(i) { tasks[i].done = !tasks[i].done; saveAndRender(); }
function deleteTask(i) { tasks.splice(i, 1); saveAndRender(); }
saveAndRender();
