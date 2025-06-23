let currentProject = null; 
let boards = [];

document.addEventListener('DOMContentLoaded', () => {
  loadBoards();
  initializeDragAndDrop();
});

async function loadBoards() {
  const container = document.getElementById('projetos-list');
  container.innerHTML = '';
  try {
    const response = await fetch('https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/GetBoards');
    const boards = await response.json();

    const palavraChave = "cliente_bolsotrello";

    const meusBoards = boards.filter(board => 
      board.Description && board.Description.includes(palavraChave) && board.Name
    );

    meusBoards.forEach(board => {
      const div = document.createElement('div');
      div.className = 'project-button';
      div.innerHTML = `
        <span onclick="selectBoard('${board.Id}')">${board.Name}</span>
        <button onclick="deleteBoard('${board.Id}')">X</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = '<p>Erro ao carregar boards.</p>';
  }
}

async function addBoard() {
  const input = document.getElementById('newProjectInput');
  if (!input) {
    alert('Campo de novo projeto não encontrado!');
    return;
  }
  const name = input.value.trim();
  console.log('Tentando criar board com nome:', name);
  if (!name) {
    alert('Digite um nome para o projeto!');
    return;
  }
  try {
    const response = await fetch('https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/CreateOrUpdateBoard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Name: name,
        Description: "cliente_bolsotrello"
      })
    });
    const newBoard = await response.json();
    input.value = '';
    await loadBoards();
    if (newBoard && newBoard.Id) {
      await selectBoard(newBoard.Id);
    }
  } catch (err) {
    console.error('Erro ao criar board:', err);
    alert('Erro ao criar board!');
  }
}

function deleteBoard(boardId) {
  alert('A API não possui endpoint para deletar board. Apenas removendo da tela.');
  // Remove visualmente
  const boardDiv = document.querySelector(`.project-button span[onclick="selectBoard('${boardId}')"]`).parentElement;
  if (boardDiv) boardDiv.remove();
}

async function selectBoard(boardId) {
  currentProject = boardId;
  loadBoards();
  await loadBoardFull(boardId);
}

async function loadBoardFull(boardId) {
  const response = await fetch(`https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/GetCompleteBoard?BoardId=${boardId}`);
  const boardData = await response.json();
  document.getElementById('project-title').textContent = boardData.Board.Name || '(sem nome)';
  renderColumns(boardData.ColumnStrs || []);
}

function renderColumns(columnStrs) {
  const container = document.getElementById('columns-container');
  container.innerHTML = '';
  columnStrs.forEach(colStr => {
    const col = colStr.Column;
    container.innerHTML += `
      <div class="column">
        <h3>Coluna ${col.Id}</h3>
        <button onclick="addTaskToColumn('${col.Id}')">+ Tarefa</button>
      </div>
    `;
  });
}

async function addColumn() {
  if (!currentProject) {
    alert('Selecione um board antes de adicionar uma lista!');
    return;
  }
  const name = prompt('Nome da coluna:');
  if (!name) return;
  console.log('Criando coluna:', { Name: name, BoardId: Number(currentProject) });
  const response = await fetch('https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/CreateOrUpdateColumn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Name: name,
      BoardId: Number(currentProject)
    })
  });
  const data = await response.json();
  console.log('Resposta da API ao criar coluna:', data);
  await loadBoardFull(currentProject);
}

async function addTaskToColumn(columnId) {
  const name = prompt('Nome da tarefa:');
  if (!name) return;
  await fetch('https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/CreateOrUpdateTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Name: 'Nome da Tarefa',
      ColumnId: columnId 
    })
  });
  await loadBoardFull(currentProject);
}

async function deleteTask(taskId) {
  await fetch(`https://personal-ga2xwx9j.outsystemscloud.com/Trellospl/rest/Trello/DeleteTask?TaskId=${taskId}`, {
    method: 'DELETE'
  });
  await loadBoardFull(currentProject); 
}

function removeColumn(columnId) {
  alert('A API não possui endpoint para deletar coluna. Apenas removendo da tela.');
  const columnDiv = document.getElementById(columnId);
  if (columnDiv) columnDiv.remove();
}


function initializeDragAndDrop() {
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  sidebar.classList.toggle('hidden');
  main.classList.toggle('full-width');
}