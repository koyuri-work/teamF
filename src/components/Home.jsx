import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './Home.css';
import logo from '../assets/logo.png'; // 画像をインポート（ファイル名は合わせてください）
import unitIcon from '../assets/credit.png'; // ★単位アイコンのファイル名に合わせてください
import todoIcon from '../assets/todo.png'; // ★ToDoアイコンのファイル名に合わせてください
import unionBg from '../assets/logo.png'; // ボトムナビの背景用（もしあれば。なければCSSで描画します）

const Home = () => {
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*');
      
      if (error) throw error;
      console.log('取得した科目データ:', data); // ★ここでデータを確認できます
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error.message);
    }
  };

  // 1限〜5限までの空の行を作成（科目がなくても枠を表示するため）
  const timetableRows = Array.from({ length: 5 }, (_, i) => ({
    period: i + 1,
    cells: Array(5).fill(null), // 月〜金の5列
  }));

  const otherSubjects = [];

  subjects.forEach(sub => {
    if (!sub) return;
    const { weekday, period } = sub;

    // 曜日(1-5)と時限(1-5)が範囲内ならグリッドに配置
    if (weekday >= 1 && weekday <= 5 && period >= 1 && period <= 5) {
      timetableRows[period - 1].cells[weekday - 1] = sub;
    } else {
      otherSubjects.push(sub); // 範囲外はその他へ
    }
  });

  const handleSubjectClick = (id) => {
    navigate(`/kamoku-each/${id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // ダミーの進捗データ生成
  const getProgress = (id) => ((id * 17) % 100); 

  // カテゴリーごとの背景色
  const getCategoryColor = (category) => {
    switch (category) {
      case 'exercise': return '#f2e9ba'; // 演習（黄色）
      case 'experiment': return '#f4cdd4'; // 実験（ピンク）
      case 'lecture': 
      default: return '#bcd9ee'; // 講義（青）
    }
  };

  // 時間割の時刻データ
  const periodTimes = {
    1: { start: '9:00', end: '10:40' },
    2: { start: '10:50', end: '12:30' },
    3: { start: '13:20', end: '15:00' },
    4: { start: '15:10', end: '16:50' },
    5: { start: '17:00', end: '18:40' },
  };

  // 合計単位数の計算
  const totalCredits = subjects.reduce((sum, sub) => sum + (sub.credit || 0), 0);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <img src={logo} alt="Logo" className="header-icon" />
          
        </div>
      </header>

      <main className="home-main">
        <div className="timetable-card">
          {/* 曜日ヘッダー */}
          <div className="timetable-header">
            <div className="th-empty"></div>
            <div className="th-day">月</div>
            <div className="th-day">火</div>
            <div className="th-day">水</div>
            <div className="th-day">木</div>
            <div className="th-day">金</div>
          </div>

          {/* 時間割グリッド */}
          <div className="timetable-body">
            {timetableRows.map((row, idx) => (
              <div key={idx} className="timetable-row">
                {/* 時限・時間カラム */}
                <div className="time-col">
                  <span className="period-num">{row.period}</span>
                  <div className="period-time">
                    <span>{periodTimes[row.period]?.start}</span>
                    <span className="time-divider">|</span>
                    <span>{periodTimes[row.period]?.end}</span>
                  </div>
                </div>

                {/* 科目セル */}
                {row.cells.map((sub, colIdx) => (
                  <div key={colIdx} className="subject-col">
                    {sub ? (
                      <div 
                        className="subject-card" 
                        style={{ backgroundColor: getCategoryColor(sub.category) }}
                        onClick={() => handleSubjectClick(sub.id)}
                      >
                        <div className="subject-name">{sub.name}</div>
                        {/* 進捗バー */}
                        <div className="mini-progress-wrapper">
                          <div className="mini-progress-track">
                            <div className="mini-progress-bar" style={{ width: `${getProgress(sub.id)}%` }}></div>
                          </div>
                          <span className="mini-progress-text">{Math.floor(getProgress(sub.id))}/4</span>
                        </div>
                        {/* 通知バッジ */}
                        {sub.id % 3 === 0 && <div className="notice-dot"></div>}
                      </div>
                    ) : (
                      // 空のセル
                      <div className="subject-card empty-card"></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="credits-info">
          取得予定単位数：{totalCredits}
        </div>
      </main>

      {/* ボトムナビゲーション */}
      <nav className="custom-bottom-nav">
        <div className="nav-bg-shape"></div>
        
        <div className="nav-items-wrapper">
          <button className="nav-btn" onClick={() => console.log('単位確認画面へ（未実装）')}>
            <img src={unitIcon} alt="単位" className="nav-icon" />
            <span className="nav-label">単位</span>
          </button>
          
          <div className="nav-fab-wrapper">
            <button className="nav-fab" onClick={() => navigate('/kamoku-add')}>
              <span className="fab-plus">+</span>
            </button>
          </div>

          <button className="nav-btn" onClick={() => navigate('/todo')}>
            <img src={todoIcon} alt="ToDo" className="nav-icon" />
            <span className="nav-label">todo</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Home;