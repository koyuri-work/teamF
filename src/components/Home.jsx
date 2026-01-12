import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSubjects = () => {
      const stored = JSON.parse(localStorage.getItem('subjects') || '[]');
      setSubjects(stored);
    };

    loadSubjects();

    // Listen for custom event when subjects are updated
    const handleSubjectsUpdated = () => {
      loadSubjects();
    };

    window.addEventListener('subjectsUpdated', handleSubjectsUpdated);

    return () => {
      window.removeEventListener('subjectsUpdated', handleSubjectsUpdated);
    };
  }, []);

  const dayToIndex = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
  const cols = 5;

  const ensureRow = (rows, index) => {
    while (rows.length <= index) {
      const newRow = { period: rows.length + 1, cells: Array(cols).fill(null) };
      rows.push(newRow);
    }
    return rows[index];
  };

  const timetableRows = [];
  const otherSubjects = [];

  subjects.forEach(sub => {
    if (!sub) return;
    const { id, subjectName, classroom, teacherName, dayOfWeek, period } = sub;
    if (!subjectName) return;

    if (dayOfWeek === 'other') {
      otherSubjects.push(sub);
      return;
    }

    const colIdx = dayToIndex[dayOfWeek];
    const periodIdx = Number(period) - 1;
    if (isNaN(colIdx) || isNaN(periodIdx) || colIdx < 0) return;

    const row = ensureRow(timetableRows, periodIdx);
    row.cells[colIdx] = sub;
  });

  const handleSubjectClick = (id) => {
    navigate(`/kamoku-each/${id}`);
  };

  return (
    <div className="container">
      <header>
        <h1>時間割</h1>
        <div className="header-controls">
          <select name="term" id="term-select">
            <option value="2025-first">2025年度 前期</option>
            <option value="2025-second">2025年度 後期</option>
          </select>
          <button onClick={() => navigate('/kamoku-add')} className="btn">科目追加</button>
          <button onClick={() => navigate('/todo')} className="btn">ToDoリスト</button>
        </div>
      </header>

      <main>
        <div className="timetable-wrapper">
          <table className="timetable">
            <thead>
              <tr>
                <th></th>
                <th>月</th>
                <th>火</th>
                <th>水</th>
                <th>木</th>
                <th>金</th>
              </tr>
            </thead>
            <tbody>
              {timetableRows.map((row, idx) => (
                <tr key={idx}>
                  <th>{row.period}限</th>
                  {row.cells.map((sub, colIdx) => (
                    <td key={colIdx}>
                      {sub && (
                        <div className="subject-cell" onClick={() => handleSubjectClick(sub.id)}>
                          <div className="subject-name">{sub.subjectName}</div>
                          <div className="subject-room">{sub.classroom || ''}</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="summary">
          <h2>出欠状況サマリー</h2>
          <p>出席: 10回, 欠席: 1回, 遅刻: 2回</p>
        </section>

        <section className="other-subjects">
          <h2>その他の科目</h2>
          <div className="other-list">
            {otherSubjects.map(sub => (
              <div key={sub.id} className="subject-cell" onClick={() => handleSubjectClick(sub.id)}>
                <div className="subject-name">{sub.subjectName}</div>
                <div className="subject-room">{sub.classroom || ''} {sub.teacherName ? `(${sub.teacherName})` : ''}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;