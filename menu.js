let currentProject = 'Projeto 1';
let columnCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadProjetos();
  loadMembros();
  loadFromStorage();
  initializeDragAndDrop();
});

function toggleProjetos() {
  document.getElementById('projetos-list').classList.toggle('hidden');
}

function toggleIntegrantes() {
  document.getElementById('integrantes-list').classList.toggle('hidden');
}

function toggleProfileDropdown() {
  document.getElementById('profileMenu').classList.toggle('hidden');
}

function addTask(columnId, text = "Nova tarefa") {
  const column = document.getElementById(columnId);
  const task = document.createElement('div');
  task.className = 'task';
  task.setAttribute('draggable', 'true');
  task.innerHTML = `
    <span contenteditable="true" oninput="saveToStorage()">${text}</span>
    <button onclick="this.parentElement.remove(); saveToStorage();">X</button>
  `;
  addDragEvents(task);
  column.insertBefore(task, column.lastElementChild);
  saveToStorage();
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  const dragging = document.querySelector('.dragging');
  ev.currentTarget.insertBefore(dragging, ev.currentTarget.lastElementChild);
  dragging.classList.remove('dragging');
  saveToStorage();
}

function addDragEvents(task) {
  task.addEventListener('dragstart', ev => ev.target.classList.add('dragging'));
  task.addEventListener('dragend', ev => ev.target.classList.remove('dragging'));
}

function initializeDragAndDrop() {
  document.querySelectorAll('.task').forEach(addDragEvents);
}

function saveToStorage() {
  const data = {};
  document.querySelectorAll('.column').forEach(column => {
    const tasks = [...column.querySelectorAll('.task span')].map(span => span.innerText);
    const title = column.querySelector('h3').innerText;
    data[column.id] = { title, tasks };
  });

  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  allData[currentProject] = data;
  localStorage.setItem('bolsotrelloData', JSON.stringify(allData));
}

function loadFromStorage() {
  clearBoard();
  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  const data = allData[currentProject] || {};
  Object.keys(data).forEach(colId => {
    createColumn(colId, data[colId].title, data[colId].tasks);
  });
  document.getElementById('project-title').textContent = currentProject;
}

function clearBoard() {
  document.getElementById('columns-container').innerHTML = '';
}

function createColumn(id, title = "Novo Quadro", tasks = []) {
  const container = document.getElementById('columns-container');
  const column = document.createElement('div');
  column.className = 'column';
  column.id = id;
  column.ondrop = drop;
  column.ondragover = allowDrop;
  column.innerHTML = `
    <h3 contenteditable="true" oninput="saveToStorage()">${title}</h3>
    <button class="add-task-button" onclick="addTask('${id}')">+</button>
  `;
  container.appendChild(column);

  tasks.forEach(text => addTask(id, text));
}

function addNewColumn() {
  const id = `col-extra-${++columnCounter}`;
  createColumn(id);
  saveToStorage();
}

function addProjeto() {
  const input = document.getElementById('newProjectInput');
  const name = input.value.trim();
  if (!name) return;
  const projetos = JSON.parse(localStorage.getItem('projetos')) || [];
  if (!projetos.includes(name)) projetos.push(name);
  localStorage.setItem('projetos', JSON.stringify(projetos));
  input.value = '';
  loadProjetos();
}

function removeProjeto(name) {
  let projetos = JSON.parse(localStorage.getItem('projetos')) || [];
  projetos = projetos.filter(p => p !== name);
  localStorage.setItem('projetos', JSON.stringify(projetos));

  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  delete allData[name];
  localStorage.setItem('bolsotrelloData', JSON.stringify(allData));

  if (currentProject === name) {
    currentProject = projetos[0] || 'Projeto 1';
  }

  loadProjetos();
  loadFromStorage();
}

function loadProjetos() {
  const container = document.getElementById('projetos-list');
  container.innerHTML = '';
  const projetos = JSON.parse(localStorage.getItem('projetos')) || ['Projeto 1'];
  projetos.forEach(name => {
    const div = document.createElement('div');
    div.className = 'project-button';
    div.innerHTML = `
      <span onclick="selectProjeto('${name}')">${name}</span>
      <button onclick="removeProjeto('${name}')">X</button>
    `;
    if (name === currentProject) div.classList.add('active');
    container.appendChild(div);
  });
}

function selectProjeto(name) {
  currentProject = name;
  loadProjetos();
  loadFromStorage();
}

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
