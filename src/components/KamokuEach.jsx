import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './KamokuEach.css';

const KamokuEach = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    smallTestRatio: 30,
    finalExamRatio: 70,
    teacherName: '',
    classroom: '',
  });
  const [newTestScore, setNewTestScore] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const subjectId = parseInt(id);
    if (!subjectId) {
      alert('科目が見つかりません');
      navigate('/');
      return;
    }

    let subjects = [];
    try {
      subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      if (!Array.isArray(subjects)) subjects = [];
      subjects = subjects.filter(s => s && typeof s === 'object');
    } catch (e) {
      subjects = [];
    }
    const foundSubject = subjects.find(s => s.id === subjectId);
    if (!foundSubject) {
      alert('科目が見つかりません');
      navigate('/');
      return;
    }

    setSubject(foundSubject);
    setEditForm({
      smallTestRatio: foundSubject.smallTestRatio || 30,
      finalExamRatio: foundSubject.finalExamRatio || 70,
      teacherName: foundSubject.teacherName || '',
      classroom: foundSubject.classroom || '',
    });
  }, [id, navigate]);

  useEffect(() => {
    if (subject && canvasRef.current) {
      drawGradeChart();
    }
  }, [subject]);

  const drawGradeChart = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    const smallTestRatio = subject.smallTestRatio || 30;
    const finalExamRatio = subject.finalExamRatio || 70;

    const smallTestAngle = (smallTestRatio / 100) * 2 * Math.PI;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Small test (red)
    ctx.fillStyle = '#ff9999';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, smallTestAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Final exam (blue)
    ctx.fillStyle = '#99ccff';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, smallTestAngle, 2 * Math.PI);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const updateSubject = (updatedSubject) => {
    let subjects = [];
    try {
      subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      if (!Array.isArray(subjects)) subjects = [];
      subjects = subjects.filter(s => s && typeof s === 'object');
    } catch (e) {
      subjects = [];
    }
    const index = subjects.findIndex(s => s.id === updatedSubject.id);
    if (index !== -1) {
      subjects[index] = updatedSubject;
      localStorage.setItem('subjects', JSON.stringify(subjects));
      setSubject(updatedSubject);
      // Notify other components that subjects have been updated
      window.dispatchEvent(new Event('subjectsUpdated'));
    }
  };

  const handleAddAttendance = () => {
    const updated = { ...subject, attendanceCount: (subject.attendanceCount || 0) + 1 };
    updateSubject(updated);
  };

  const handleAddAbsence = () => {
    const updated = { ...subject, absenceCount: (subject.absenceCount || 0) + 1 };
    updateSubject(updated);
  };

  const handleAddLate = () => {
    const updated = { ...subject, lateCount: (subject.lateCount || 0) + 1 };
    updateSubject(updated);
  };

  const handleAddTest = () => {
    const score = parseInt(newTestScore);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('0～100の数値を入力してください');
      return;
    }
    const updated = { ...subject, smallTests: [...(subject.smallTests || []), score] };
    updateSubject(updated);
    setNewTestScore('');
  };

  const deleteSmallTest = (idx) => {
    const updated = { ...subject, smallTests: subject.smallTests.filter((_, i) => i !== idx) };
    updateSubject(updated);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updated = {
      ...subject,
      smallTestRatio: parseInt(editForm.smallTestRatio) || 30,
      finalExamRatio: parseInt(editForm.finalExamRatio) || 70,
      teacherName: editForm.teacherName.trim(),
      classroom: editForm.classroom.trim(),
    };
    updateSubject(updated);
    setEditModal(false);
  };

  if (!subject) return <div>Loading...</div>;

  const dayMap = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', other: 'その他' };
  const averageScore = subject.smallTests && subject.smallTests.length > 0
    ? Math.round(subject.smallTests.reduce((a, b) => a + b, 0) / subject.smallTests.length)
    : '-';

  return (
    <div className="container">
      <header>
        <h1>{subject.subjectName}</h1>
        <div className="header-controls">
          <button onClick={() => navigate('/')} className="btn-secondary">戻る</button>
          <button onClick={() => setEditModal(true)} className="btn-secondary">編集</button>
        </div>
      </header>

      <main>
        <section className="subject-info">
          <h2>科目情報</h2>
          <div className="info-grid">
            <div className="info-item"><strong>担当教員:</strong> {subject.teacherName || '-'}</div>
            <div className="info-item"><strong>曜日・時限:</strong> {dayMap[subject.dayOfWeek] || '-'}曜 {subject.period}限</div>
            <div className="info-item"><strong>教室:</strong> {subject.classroom || '-'}</div>
            <div className="info-item"><strong>単位数:</strong> {subject.credits || '-'}</div>
          </div>
        </section>

        <section className="grade-section">
          <h2>成績配分</h2>
          <div className="grade-chart">
            <canvas ref={canvasRef} width="200" height="200"></canvas>
            <div className="grade-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#ff9999' }}></div>
                <span>小テスト {subject.smallTestRatio}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#99ccff' }}></div>
                <span>期末テスト {subject.finalExamRatio}%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="attendance-section">
          <h2>出欠情報</h2>
          <div className="attendance-grid">
            <div className="attendance-item"><strong>出席:</strong> {subject.attendanceCount || 0}</div>
            <div className="attendance-item"><strong>欠席:</strong> {subject.absenceCount || 0}</div>
            <div className="attendance-item"><strong>遅刻:</strong> {subject.lateCount || 0}</div>
          </div>
          <div className="attendance-actions">
            <button onClick={handleAddAttendance} className="btn-small">+1 出席</button>
            <button onClick={handleAddAbsence} className="btn-small">+1 欠席</button>
            <button onClick={handleAddLate} className="btn-small">+1 遅刻</button>
          </div>
        </section>

        <section className="small-tests-section">
          <h2>小テスト管理</h2>
          <div className="small-test-input">
            <input
              type="number"
              value={newTestScore}
              onChange={(e) => setNewTestScore(e.target.value)}
              placeholder="小テストスコア（0-100）"
              min="0"
              max="100"
            />
            <button onClick={handleAddTest} className="btn-small">追加</button>
          </div>
          <div className="small-tests-list">
            {subject.smallTests && subject.smallTests.length > 0 ? (
              subject.smallTests.map((test, idx) => (
                <div key={idx} className="test-item">
                  <span>小テスト {idx + 1}: {test}点</span>
                  <button onClick={() => deleteSmallTest(idx)} className="btn-delete">削除</button>
                </div>
              ))
            ) : (
              <p>小テストはまだ登録されていません</p>
            )}
          </div>
          <div className="small-test-average">
            <strong>平均点:</strong> {averageScore}
          </div>
        </section>

        {editModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>科目情報を編集</h2>
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label htmlFor="edit-small-test-ratio">小テスト配分（%）</label>
                  <input type="number" id="edit-small-test-ratio" name="smallTestRatio" value={editForm.smallTestRatio} onChange={handleEditChange} min="0" max="100" />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-final-exam-ratio">期末テスト配分（%）</label>
                  <input type="number" id="edit-final-exam-ratio" name="finalExamRatio" value={editForm.finalExamRatio} onChange={handleEditChange} min="0" max="100" />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-teacher-name">担当教員</label>
                  <input type="text" id="edit-teacher-name" name="teacherName" value={editForm.teacherName} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-classroom">教室</label>
                  <input type="text" id="edit-classroom" name="classroom" value={editForm.classroom} onChange={handleEditChange} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn">保存</button>
                  <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KamokuEach;