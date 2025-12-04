let todos = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  populateSubjectSelect();
  attachEventListeners();
  displayTodos();
});

function loadTodos() {
  todos = JSON.parse(localStorage.getItem('todos') || '[]');
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function populateSubjectSelect() {
  const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  const select = document.getElementById('todo-subject');
  
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.subjectName;
    select.appendChild(option);
  });
}

function attachEventListeners() {
  document.getElementById('add-todo-form').addEventListener('submit', addTodo);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      displayTodos();
    });
  });
}

function addTodo(e) {
  e.preventDefault();
  
  const title = document.getElementById('todo-title').value.trim();
  const category = document.getElementById('todo-category').value;
  const subjectId = document.getElementById('todo-subject').value || null;
  const dueDate = document.getElementById('todo-due-date').value || null;

  if (!title) {
    alert('ToDoのタイトルを入力してください');
    return;
  }

  const todo = {
    id: Date.now(),
    title,
    category,
    subjectId: subjectId ? parseInt(subjectId) : null,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  saveTodos();

  // Reset form
  document.getElementById('add-todo-form').reset();
  displayTodos();
}

function displayTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  let filtered = todos;

  if (currentFilter === 'assignment') {
    filtered = todos.filter(t => t.category === 'assignment');
  } else if (currentFilter === 'small-test') {
    filtered = todos.filter(t => t.category === 'small-test');
  } else if (currentFilter === 'pending') {
    filtered = todos.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = todos.filter(t => t.completed);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">ToDoはありません</p>';
    return;
  }

  filtered.forEach(todo => {
    const todoEl = createTodoElement(todo);
    list.appendChild(todoEl);
  });
}

function createTodoElement(todo) {
  const div = document.createElement('div');
  div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  
  const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  const subject = subjects.find(s => s.id === todo.subjectId);
  const subjectName = subject ? subject.subjectName : '';

  const categoryLabel = {
    'assignment': '課題',
    'small-test': '小テスト',
    'other': 'その他'
  }[todo.category];

  let dueDateText = '';
  if (todo.dueDate) {
    const date = new Date(todo.dueDate);
    dueDateText = `期限: ${date.toLocaleDateString('ja-JP')}`;
  }

  div.innerHTML = `
    <div class="todo-content">
      <div class="todo-header">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
        <span class="todo-title">${escapeHtml(todo.title)}</span>
        <span class="category-badge category-${todo.category}">${categoryLabel}</span>
      </div>
      <div class="todo-meta">
        ${subjectName ? `<span class="subject-badge">${escapeHtml(subjectName)}</span>` : ''}
        ${dueDateText ? `<span class="due-date">${dueDateText}</span>` : ''}
      </div>
    </div>
    <button class="btn-delete" onclick="deleteTodo(${todo.id})">削除</button>
  `;

  return div;
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    displayTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  displayTodos();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>",']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}
