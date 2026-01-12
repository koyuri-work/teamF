import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KamokuAdd.css';

const KamokuAdd = () => {
  const [formData, setFormData] = useState({
    subjectName: '',
    teacherName: '',
    dayOfWeek: 'mon',
    period: '1',
    classroom: '',
    credits: '',
    smallTestRatio: 30,
    finalExamRatio: 70,
    currentSmallTestScore: '',
    attendanceCount: 0,
    absenceCount: 0,
    lateCount: 0,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim()) {
      alert('科目名を入力してください');
      return;
    }

    const item = {
      id: Date.now(),
      subjectName: formData.subjectName.trim(),
      teacherName: formData.teacherName.trim(),
      dayOfWeek: formData.dayOfWeek,
      period: formData.period,
      classroom: formData.classroom.trim(),
      credits: formData.credits ? Number(formData.credits) : null,
      smallTestRatio: Number(formData.smallTestRatio) || 30,
      finalExamRatio: Number(formData.finalExamRatio) || 70,
      currentSmallTestScore: Number(formData.currentSmallTestScore) || 0,
      attendanceCount: Number(formData.attendanceCount) || 0,
      absenceCount: Number(formData.absenceCount) || 0,
      lateCount: Number(formData.lateCount) || 0,
      smallTests: [],
      createdAt: new Date().toISOString(),
    };

    let existing;
    try {
      existing = JSON.parse(localStorage.getItem('subjects') || '[]');
      if (!Array.isArray(existing)) existing = [];
      // 既存データから壊れたものを除去
      existing = existing.filter(s => s && typeof s === 'object');
    } catch (e) {
      existing = [];
    }
    existing.push(item);
    localStorage.setItem('subjects', JSON.stringify(existing));

    // Notify other components that subjects have been updated
    window.dispatchEvent(new Event('subjectsUpdated'));

    navigate('/');
  };

  return (
    <div className="container">
      <header>
        <h1>科目追加</h1>
        <div className="header-controls">
          <button onClick={() => navigate('/')} className="btn-secondary">戻る</button>
        </div>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-group">
            <label htmlFor="subjectName">科目名</label>
            <input type="text" id="subjectName" name="subjectName" value={formData.subjectName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="teacherName">担当教員</label>
            <input type="text" id="teacherName" name="teacherName" value={formData.teacherName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="dayOfWeek">曜日</label>
            <select id="dayOfWeek" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange}>
              <option value="mon">月曜日</option>
              <option value="tue">火曜日</option>
              <option value="wed">水曜日</option>
              <option value="thu">木曜日</option>
              <option value="fri">金曜日</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="period">時限</label>
            <select id="period" name="period" value={formData.period} onChange={handleChange}>
              <option value="1">1限</option>
              <option value="2">2限</option>
              <option value="3">3限</option>
              <option value="4">4限</option>
              <option value="5">5限</option>
              <option value="6">6限</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="classroom">教室</label>
            <input type="text" id="classroom" name="classroom" value={formData.classroom} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="credits">単位数</label>
            <input type="number" id="credits" name="credits" value={formData.credits} onChange={handleChange} min="0" max="10" />
          </div>

          <h3>成績配分</h3>
          <div className="form-group">
            <label htmlFor="smallTestRatio">小テスト（%）</label>
            <input type="number" id="smallTestRatio" name="smallTestRatio" value={formData.smallTestRatio} onChange={handleChange} min="0" max="100" />
          </div>
          <div className="form-group">
            <label htmlFor="finalExamRatio">期末テスト（%）</label>
            <input type="number" id="finalExamRatio" name="finalExamRatio" value={formData.finalExamRatio} onChange={handleChange} min="0" max="100" />
          </div>

          <h3>初期成績設定</h3>
          <div className="form-group">
            <label htmlFor="currentSmallTestScore">現在の小テスト平均点</label>
            <input type="number" id="currentSmallTestScore" name="currentSmallTestScore" value={formData.currentSmallTestScore} onChange={handleChange} min="0" max="100" placeholder="0" />
          </div>

          <h3>出欠情報</h3>
          <div className="form-group">
            <label htmlFor="attendanceCount">出席回数</label>
            <input type="number" id="attendanceCount" name="attendanceCount" value={formData.attendanceCount} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label htmlFor="absenceCount">欠席回数</label>
            <input type="number" id="absenceCount" name="absenceCount" value={formData.absenceCount} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label htmlFor="lateCount">遅刻回数</label>
            <input type="number" id="lateCount" name="lateCount" value={formData.lateCount} onChange={handleChange} min="0" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn">追加</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default KamokuAdd;