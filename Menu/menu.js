const API_BASE = "https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello";

// --- Funções de requisição para a API ---
async function getBoards() {
  const res = await fetch(`${API_BASE}/GetBoards`);
  return res.json();
}
async function getBoardFull(id) {
  const res = await fetch(`${API_BASE}/GetCompleteBoard?BoardId=${id}`);
  return res.json();
}
async function createOrUpdateBoard(board) {
  const res = await fetch(`${API_BASE}/CreateOrUpdateBoard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board)
  });
  return res.json();
}
async function createOrUpdateColumn(column) {
  const res = await fetch(`${API_BASE}/CreateOrUpdateColumn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(column)
  });
  return res.json();
}
async function createOrUpdateTask(task) {
  const res = await fetch(`${API_BASE}/CreateOrUpdateTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  return res.json();
}
async function deleteTaskAPI(id) {
  const res = await fetch(`${API_BASE}/DeleteTask?id=${id}`, { method: "DELETE" });
  return res.ok;
}

// --- Variáveis globais ---
let currentProject = null;

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadProjetos();
  loadMembros();
  await loadFromAPI();
  initializeDragAndDrop();
});

// --- Boards (Projetos) ---
async function loadProjetos() {
  const container = document.getElementById('projetos-list');
  container.innerHTML = '';
  // Filtra apenas boards criados pelo sistema (com Name e prefixo)
  const boards = (await getBoards())
    .filter(b => b.Name && b.Name.startsWith("cliente-bolsotrello"));
  if (boards.length > 0 && !currentProject) currentProject = boards[0].Id;
  boards.forEach(board => {
    const div = document.createElement('div');
    div.className = 'project-button';
    div.innerHTML = `<span onclick="selectProjeto(${board.Id})">${board.Name.replace("cliente-bolsotrello-", "")}</span>`;
    if (board.Id === currentProject) div.classList.add('active');
    container.appendChild(div);
  });
}

async function addProjeto() {
  const input = document.getElementById('newProjectInput');
  const name = input.value.trim();
  if (!name) return;
  // Prefixo para identificar boards do usuário
  const boardName = `cliente-bolsotrello-${name}`;
  await createOrUpdateBoard({ Name: boardName }); 
  input.value = '';
  setTimeout(loadProjetos, 500);
}

async function selectProjeto(boardId) {
  currentProject = boardId;
  await loadProjetos();
  await loadFromAPI();
}

// --- Colunas (Listas) ---
async function addNewColumn() {
  const name = prompt("Nome da nova lista:");
  if (!name) return;
  await createOrUpdateColumn({ Title: name, BoardId: currentProject });
  await loadFromAPI();
}

async function updateColumnTitle(columnId, newTitle) {
  await createOrUpdateColumn({ Id: columnId, Title: newTitle, BoardId: currentProject });
  await loadFromAPI();
}

// --- Quadro (Board) e Tarefas ---
async function loadFromAPI() {
  clearBoard();
  if (!currentProject) return;
  const board = await getBoardFull(currentProject);
  console.log("Board retornado:", board); // Adicione isso para debug
  if (board.ColumnStrs) {
    board.ColumnStrs.forEach(colStr => {
      const col = colStr.Column;
      createColumn(col.Id, col.Title ?? "Sem nome", col.Tasks ?? []);
    });
  }
}

function createColumn(id, title = "Nova Lista", tasks = []) {
  console.log("Renderizando coluna:", id, title);
  const container = document.getElementById('columns-container');
  const column = document.createElement('div');
  column.className = 'column';
  column.id = id;
  column.ondrop = drop;
  column.ondragover = allowDrop;
  column.innerHTML = `
    <h3 contenteditable="true" onblur="updateColumnTitle('${id}', this.innerText)">${title}</h3>
    <button class="add-task-button" onclick="addTask('${id}')">+</button>
  `;
  container.appendChild(column);

  // Adiciona tarefas à coluna
  tasks.forEach(task => {
    addTask(id, task.Name, task.Done, task.Id);
  });
}

function clearBoard() {
  document.getElementById('columns-container').innerHTML = '';
}

// --- Tarefas ---
async function addTask(columnId, text = "Nova tarefa", completed = false, taskId = null) {
  if (!taskId) {
    // Cria nova tarefa na API
    await createOrUpdateTask({ Name: text, ColumnId: columnId, Done: completed });
    await loadFromAPI();
    return;
  }
  // Renderiza tarefa na coluna
  const column = document.getElementById(columnId);
  const task = document.createElement('div');
  task.className = 'task';
  if (completed) task.classList.add('completed');
  task.setAttribute('draggable', 'true');
  task.innerHTML = `
    <span contenteditable="true" onblur="updateTask('${taskId}', '${columnId}', this.innerText, ${completed})">${text}</span>
    <button class="check-task-button" style="background:#27ae60;" title="Concluir" onclick="toggleTaskDone('${taskId}', '${columnId}', this)">${completed ? '&#10003;' : '&#10003;'}</button>
    <button onclick="deleteTaskAPI('${taskId}')" style="background:#d32f2f;">X</button>
  `;
  addDragEvents(task);
  column.insertBefore(task, column.lastElementChild);
}

async function updateTask(taskId, columnId, newText, done) {
  await createOrUpdateTask({ Id: taskId, Name: newText, ColumnId: columnId, Done: done });
  await loadFromAPI();
}

async function toggleTaskDone(taskId, columnId, btn) {
  const taskDiv = btn.parentElement;
  const text = taskDiv.querySelector('span').innerText;
  const done = !taskDiv.classList.contains('completed');
  await createOrUpdateTask({ Id: taskId, Name: text, ColumnId: columnId, Done: done });
  await loadFromAPI();
}

async function deleteTaskAPI(taskId) {
  await fetch(`${API_BASE}/DeleteTask?id=${taskId}`, { method: "DELETE" });
  await loadFromAPI();
}

// --- Drag and Drop ---
function allowDrop(ev) { ev.preventDefault(); }
function drop(ev) {
  ev.preventDefault();
  const dragging = document.querySelector('.dragging');
  ev.currentTarget.insertBefore(dragging, ev.currentTarget.lastElementChild);
}
function addDragEvents(task) {
  task.addEventListener('dragstart', ev => ev.target.classList.add('dragging'));
  task.addEventListener('dragend', ev => ev.target.classList.remove('dragging'));
}
function initializeDragAndDrop() {
  document.querySelectorAll('.task').forEach(addDragEvents);
}

// --- Membros (local, pois a API não tem endpoint) ---
function addMember() {
  const input = document.getElementById('newMemberInput');
  const name = input.value.trim();
  if (!name) return;
  const members = JSON.parse(localStorage.getItem('membros')) || [];
  members.push(name);
  localStorage.setItem('membros', JSON.stringify(members));
  input.value = '';
  loadMembros();
}
function removeMember(name) {
  let members = JSON.parse(localStorage.getItem('membros')) || [];
  members = members.filter(m => m !== name);
  localStorage.setItem('membros', JSON.stringify(members));
  loadMembros();
}
function loadMembros() {
  const list = document.getElementById('integrantes-list');
  list.innerHTML = '';
  const members = JSON.parse(localStorage.getItem('membros')) || [];
  members.forEach(name => {
    const div = document.createElement('div');
    div.className = 'member-item';
    div.innerHTML = `
      <span>${name}</span>
      <button onclick="removeMember('${name}')">X</button>
    `;
    list.appendChild(div);
  });
}

// --- Sidebar e perfil ---
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  sidebar.classList.toggle('hidden');
  main.classList.toggle('full-width');
}
function toggleProjetos() {
  document.getElementById('projetos-list').classList.toggle('hidden');
}
function toggleIntegrantes() {
  document.getElementById('integrantes-list').classList.toggle('hidden');
}
function toggleProfileDropdown() {
  document.getElementById('profileMenu').classList.toggle('hidden');
}