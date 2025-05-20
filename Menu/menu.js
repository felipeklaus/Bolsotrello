/*
  Script principal do menu do Bolsotrello.
  Gerencia projetos, membros, colunas, tarefas, drag-and-drop, e persistência no localStorage.
*/

// Projeto atual selecionado
let currentProject = 'Projeto 1';
// Contador para criar IDs únicos para novas colunas
let columnCounter = 0;

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  loadProjetos();      // Carrega lista de projetos
  loadMembros();       // Carrega lista de membros
  loadFromStorage();   // Carrega quadro do projeto atual
  initializeDragAndDrop(); // Inicializa drag-and-drop nas tarefas
});

/* Alterna a exibição da lista de projetos */
function toggleProjetos() {
  document.getElementById('projetos-list').classList.toggle('hidden');
}

/* Alterna a exibição da lista de integrantes */
function toggleIntegrantes() {
  document.getElementById('integrantes-list').classList.toggle('hidden');
}

/* Alterna o menu suspenso do perfil */
function toggleProfileDropdown() {
  document.getElementById('profileMenu').classList.toggle('hidden');
}

/* Adiciona uma nova tarefa a uma coluna */
function addTask(columnId, text = "Nova tarefa", completed = false) {
  const column = document.getElementById(columnId);
  const task = document.createElement('div');
  task.className = 'task';
  if (completed) task.classList.add('completed');
  task.setAttribute('draggable', 'true');
  task.innerHTML = `
    <span contenteditable="true" oninput="saveToStorage()">${text}</span>
    <button class="check-task-button" style="background:#27ae60;" title="Concluir">&#10003;</button>
    <button onclick="this.parentElement.remove(); saveToStorage();" style="background:#d32f2f;">X</button>
  `;
  // Botão de concluir tarefa
  task.querySelector('.check-task-button').onclick = function() {
    task.classList.toggle('completed');
    saveToStorage();
  };
  addDragEvents(task);
  // Insere a tarefa antes do último elemento da coluna (normalmente o botão de adicionar)
  column.insertBefore(task, column.lastElementChild);
  saveToStorage();
}

/* Permite soltar elementos na coluna (drag-and-drop) */
function allowDrop(ev) {
  ev.preventDefault();
}

/* Lida com o drop de tarefas entre colunas */
function drop(ev) {
  ev.preventDefault();
  const dragging = document.querySelector('.dragging');
  ev.currentTarget.insertBefore(dragging, ev.currentTarget.lastElementChild);
  dragging.classList.remove('dragging');
  saveToStorage();
}

/* Adiciona eventos de drag nas tarefas */
function addDragEvents(task) {
  task.addEventListener('dragstart', ev => ev.target.classList.add('dragging'));
  task.addEventListener('dragend', ev => ev.target.classList.remove('dragging'));
}

/* Inicializa drag-and-drop para todas as tarefas existentes */
function initializeDragAndDrop() {
  document.querySelectorAll('.task').forEach(addDragEvents);
}

/* Salva o estado atual do quadro no localStorage */
function saveToStorage() {
  const data = {};
  document.querySelectorAll('.column').forEach(column => {
    const tasks = [...column.querySelectorAll('.task')].map(task => ({
      text: task.querySelector('span').innerText,
      completed: task.classList.contains('completed')
    }));
    const title = column.querySelector('h3').innerText;
    data[column.id] = { title, tasks };
  });

  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  allData[currentProject] = data;
  localStorage.setItem('bolsotrelloData', JSON.stringify(allData));
}

/* Carrega o quadro do projeto atual do localStorage */
function loadFromStorage() {
  clearBoard();
  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  const data = allData[currentProject] || {};
  Object.keys(data).forEach(colId => {
    createColumn(colId, data[colId].title, data[colId].tasks);
  });
  document.getElementById('project-title').textContent = currentProject;
}

/* Cria uma nova coluna no quadro */
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
    <button class="remover-lista" onclick="this.parentElement.remove(); saveToStorage();">X</button>
  `;
  container.appendChild(column);

  // Adiciona tarefas à coluna (compatível com versões antigas e novas)
  tasks.forEach(task => {
    if (typeof task === 'string') {
      addTask(id, task, false);
    } else {
      addTask(id, task.text, task.completed);
    }
  });
}

/* Limpa todas as colunas do quadro */
function clearBoard() {
  document.getElementById('columns-container').innerHTML = '';
}

/* Cria uma nova coluna extra (usado ao clicar em "+ Adicionar Lista") */
function addNewColumn() {
  const id = `col-extra-${++columnCounter}`;
  createColumn(id);
  saveToStorage();
}

/* Adiciona um novo projeto à lista */
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

/* Remove um projeto da lista */
function removeProjeto(name) {
  let projetos = JSON.parse(localStorage.getItem('projetos')) || [];
  projetos = projetos.filter(p => p !== name);
  localStorage.setItem('projetos', JSON.stringify(projetos));

  // Remove dados do quadro do projeto excluído
  const allData = JSON.parse(localStorage.getItem('bolsotrelloData')) || {};
  delete allData[name];
  localStorage.setItem('bolsotrelloData', JSON.stringify(allData));

  // Seleciona outro projeto se o atual for removido
  if (currentProject === name) {
    currentProject = projetos[0] || 'Projeto 1';
  }

  loadProjetos();
  loadFromStorage();
}

/* Carrega a lista de projetos na sidebar */
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

/* Seleciona um projeto para exibir */
function selectProjeto(name) {
  currentProject = name;
  loadProjetos();
  loadFromStorage();
}

/* Adiciona um novo membro à lista */
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

/* Remove um membro da lista */
function removeMember(name) {
  let members = JSON.parse(localStorage.getItem('membros')) || [];
  members = members.filter(m => m !== name);
  localStorage.setItem('membros', JSON.stringify(members));
  loadMembros();
}

/* Carrega a lista de membros na sidebar */
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

/* Alterna a exibição da sidebar */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');

  sidebar.classList.toggle('hidden');
  main.classList.toggle('full-width');
}