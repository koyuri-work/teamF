import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Todo.css';

const Todo = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('課題');
  const [newDeadline, setNewDeadline] = useState('');

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      title: newTask,
      tag: newCategory,
      deadline: newDeadline || '未定',
      completed: false
    };
    setTasks([task, ...tasks]);
    setNewTask('');
    setNewCategory('課題');
    setNewDeadline('');
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'incomplete') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="todo-container">
      <header className="todo-header">
        <button onClick={() => navigate('/home')} className="btn-back">〈</button>
        <h1>TODOリスト</h1>
        <div className="btn-placeholder"></div>
      </header>

      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>すべて</button>
        <button className={`filter-btn ${filter === 'incomplete' ? 'active' : ''}`} onClick={() => setFilter('incomplete')}>未完了</button>
        <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>完了済</button>
      </div>

      <div className="task-input-area">
        <input 
          type="text" 
          className="task-input" 
          placeholder="新しいタスクを追加..." 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <div className="input-controls">
          <select 
            className="category-select"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="課題">課題</option>
            <option value="テスト">テスト</option>
            <option value="その他">その他</option>
          </select>
          <input 
            type="date" 
            className="date-input"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
          <button className="add-task-btn" onClick={handleAddTask}>+</button>
        </div>
      </div>

      <div className="task-list">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-item" style={{ opacity: task.completed ? 0.6 : 1 }}>
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={() => toggleComplete(task.id)} 
            />
            <div className="task-content">
              <div className="task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
              <div className="task-meta">
                <span className="task-tag">{task.tag}</span>
                <span>期限: {task.deadline}</span>
              </div>
            </div>
            <button className="delete-btn" onClick={() => deleteTask(task.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Todo;