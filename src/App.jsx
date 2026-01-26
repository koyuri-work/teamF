import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import KamokuAdd from './components/KamokuAdd';
import KamokuEach from './components/KamokuEach';
import Todo from './components/Todo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/kamoku-add" element={<KamokuAdd />} />
        <Route path="/kamoku-each/:id" element={<KamokuEach />} />
        <Route path="/todo" element={<Todo />} />
      </Routes>
    </Router>
  );
}

export default App;