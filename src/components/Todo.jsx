import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Todo.css';

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    category: 'assignment',
    subjectId: '',
    dueDate: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const loadedTodos = JSON.parse(localStorage.getItem('todos') || '[]');
      setTodos(Array.isArray(loadedTodos) ? loadedTodos.filter(t => t && typeof t === 'object') : []);
    } catch (e) {
      setTodos([]);
    }
    try {
      const loadedSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      setSubjects(Array.isArray(loadedSubjects) ? loadedSubjects.filter(s => s && typeof s === 'object') : []);
    } catch (e) {
      setSubjects([]);
    }
  }, []);

  const saveTodos = (newTodos) => {
    localStorage.setItem('todos', JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('ToDoのタイトルを入力してください');
      return;
    }

    const newTodo = {
      id: Date.now(),
      title: formData.title.trim(),
      category: formData.category,
      subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
      dueDate: formData.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...todos, newTodo];
    saveTodos(updatedTodos);
    setFormData({ title: '', category: 'assignment', subjectId: '', dueDate: '' });
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    saveTodos(updatedTodos);
  };

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'assignment') return todo.category === 'assignment';
    if (currentFilter === 'small-test') return todo.category === 'small-test';
    if (currentFilter === 'pending') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  const categoryLabel = {
    'assignment': '課題',
    'small-test': '小テスト',
    'other': 'その他'
  };

  return (
    <div className="container">
      <header>
        <h1>ToDoリスト</h1>
        <div className="header-controls">
          <button onClick={() => navigate('/')} className="btn-secondary">戻る</button>
        </div>
      </header>

      <main>
        <section className="add-todo-section">
          <h2>新しいToDoを追加</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="title"
                placeholder="ToDoのタイトルを入力"
                value={formData.title}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">カテゴリ</label>
                <select name="category" value={formData.category} onChange={handleFormChange}>
                  <option value="assignment">課題</option>
                  <option value="small-test">小テスト</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="subjectId">科目（選択可）</label>
                <select name="subjectId" value={formData.subjectId} onChange={handleFormChange}>
                  <option value="">全科目</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.subjectName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">期限（選択可）</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleFormChange}
              />
            </div>
            <button type="submit" className="btn">追加</button>
          </form>
        </section>

        <section className="filters-section">
          <h2>フィルタ</h2>
          <div className="filter-buttons">
            {['all', 'assignment', 'small-test', 'pending', 'completed'].map(filter => (
              <button
                key={filter}
                className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
                onClick={() => setCurrentFilter(filter)}
              >
                {filter === 'all' ? 'すべて' :
                 filter === 'assignment' ? '課題' :
                 filter === 'small-test' ? '小テスト' :
                 filter === 'pending' ? '未完了' :
                 '完了'}
              </button>
            ))}
          </div>
        </section>

        <section className="todo-list-section">
          <h2>ToDoリスト</h2>
          <div className="todo-list">
            {filteredTodos.length === 0 ? (
              <p className="empty-state">ToDoはありません</p>
            ) : (
              filteredTodos.map(todo => {
                const subject = subjects.find(s => s.id === todo.subjectId);
                const subjectName = subject ? subject.subjectName : '';
                const dueDateText = todo.dueDate ? `期限: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}` : '';

                return (
                  <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                    <div className="todo-content">
                      <div className="todo-header">
                        <input
                          type="checkbox"
                          className="todo-checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                        />
                        <span className="todo-title">{todo.title}</span>
                        <span className={`category-badge category-${todo.category}`}>{categoryLabel[todo.category]}</span>
                      </div>
                      <div className="todo-meta">
                        {subjectName && <span className="subject-badge">{subjectName}</span>}
                        {dueDateText && <span className="due-date">{dueDateText}</span>}
                      </div>
                    </div>
                    <button className="btn-delete" onClick={() => deleteTodo(todo.id)}>削除</button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Todo;