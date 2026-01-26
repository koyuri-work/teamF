import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './KamokuEach.css';

const KamokuEach = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    teacher: '',
    room: '',
    kadai: 0,
    target_score: 80, // 目標点の初期値
    shoutest: 0,
    chukan: 0,
    kimatsu: 0,
    custom1Name: '',
    custom1Value: 0,
    custom2Name: '',
    custom2Value: 0,
  });
  const canvasRef = useRef(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  
  // スコア管理用のState（小テスト、カスタム1、カスタム2をまとめて管理）
  // 初期値として今日の日付をセット
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [scoreInputs, setScoreInputs] = useState({
    small: { score: '', date: getTodayStr() },
    custom1: { score: '', date: getTodayStr() },
    custom2: { score: '', date: getTodayStr() }
  });
  const [expandedSections, setExpandedSections] = useState({ small: false, custom1: false, custom2: false });
  const [activeScoreMenus, setActiveScoreMenus] = useState({ small: null, custom1: null, custom2: null });

  const [midtermScore, setMidtermScore] = useState('');
  const [finalScore, setFinalScore] = useState('');

  // 履歴から各回数を自動計算（DBにカウント用のカラムを持たなくて済むようにする）
  const attendanceCount = attendanceHistory.filter(h => h.type === '出席').length;
  const absenceCount = attendanceHistory.filter(h => h.type === '欠席').length;
  const lateCount = attendanceHistory.filter(h => h.type === '遅刻').length;

  useEffect(() => {
    fetchSubjectData();
  }, [id, navigate]);

  // メニュー外をクリックしたら閉じる処理
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuIndex(null);
      setActiveScoreMenus({ small: null, custom1: null, custom2: null });
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSubjectData = async () => {
    try {
      // 科目情報の取得
      const { data: subData, error: subError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (subError) throw subError;
      setSubject(subData);

      // 編集フォームの初期値設定
      const evalData = subData.evaluation || {};
      setEditForm({
        name: subData.name,
        teacher: subData.teacher || '',
        room: subData.room || '',
        target_score: subData.target_score || 80,
        kadai: evalData.kadai || 0,
        shoutest: evalData.shoutest || 0,
        chukan: evalData.chukan || 0,
        kimatsu: evalData.kimatsu || 0,
        custom1Name: evalData.custom1?.name || '',
        custom1Value: evalData.custom1?.value || 0,
        custom2Name: evalData.custom2?.name || '',
        custom2Value: evalData.custom2?.value || 0,
      });

      // 履歴データがあれば設定
      setAttendanceHistory(subData.attendance_history || []);

      // 中間・期末の点数を設定（DBにカラムがある想定）
      setMidtermScore(subData.midterm_score || '');
      setFinalScore(subData.final_score || '');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (subject && canvasRef.current) {
      drawGradeChart();
    }
  }, [subject]);

  // 平均点計算ヘルパー（数値とオブジェクトの両方に対応）
  const getAverageScore = (scores) => {
    if (!scores || scores.length === 0) return null;
    const sum = scores.reduce((acc, item) => {
      const val = typeof item === 'object' ? item.score : item;
      return acc + (Number(val) || 0);
    }, 0);
    return sum / scores.length;
  };

  // 評定（S, A, B...）の判定
  const getGradeLetter = (score) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'F';
  };

  const drawGradeChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- 高解像度ディスプレイ対応（ぼやけ防止） ---
    const dpr = window.devicePixelRatio || 1;
    // CSSで設定されたサイズを取得
    const rect = canvas.getBoundingClientRect();
    // canvasの実際の描画バッファサイズを物理ピクセルに合わせる
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    // 描画コンテキストをスケールして、CSSピクセル単位で描画できるようにする
    ctx.scale(dpr, dpr);
    // --- ここまで ---

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 半径の設定
    // 隙間をなくすために、内側の外縁と外側の内縁を合わせる
    const outerWidth = 20;
    const outerRadius = 80; // 描画範囲: 70px ~ 90px
    const innerWidth = 20;
    const innerRadius = 60; // 描画範囲: 50px ~ 70px

    const evalData = subject.evaluation || {};
    // --- 予想点の計算 ---
    // 各項目の「平均点」と「配分(weight)」を取得
    // データがない項目は計算から除外する（分母に含めない）ことで「現時点での実力」を出す
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const categories = [
      { key: 'shoutest', weight: Number(evalData.shoutest) || 0, scores: subject.small_tests, color: '#a5c2cc' },
      { key: 'chukan', weight: Number(evalData.chukan) || 0, score: subject.midterm_score, color: '#f4cdd4' },
      { key: 'kimatsu', weight: Number(evalData.kimatsu) || 0, score: subject.final_score, color: '#f2e9ba' },
      { key: 'custom1', weight: Number(evalData.custom1?.value) || 0, scores: subject.custom_results?.custom1, color: '#d3d3d3' },
      { key: 'custom2', weight: Number(evalData.custom2?.value) || 0, scores: subject.custom_results?.custom2, color: '#e0e0e0' },
      // 課題(kadai)は点数データがないため、計算からは除外（配分のみ表示用に使用する場合は別途検討）
    ];

    // 計算に使用するカテゴリ（データがあるもの）を抽出
    const activeCategories = [];
    categories.forEach(cat => {
      let avg = null;
      if (cat.scores !== undefined) avg = getAverageScore(cat.scores); // 配列の場合
      else if (cat.score !== undefined && cat.score !== null) avg = Number(cat.score); // 単一値の場合

      if (avg !== null && cat.weight > 0) {
        totalWeightedScore += avg * cat.weight;
        totalWeight += cat.weight;
        activeCategories.push({ ...cat, contribution: cat.weight }); // グラフ描画用にweightを保存
      }
    });

    // 予想点 (データがない場合は0)
    const predictedScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
    const targetScore = subject.target_score || 80;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // クリア

    // --- 1. 外側：予想点 (Predicted) ---
    // 背景（グレー）
    drawArc(ctx, centerX, centerY, outerRadius, outerWidth, 100, '#ffffff');
    
    // 予想点バー（構成比率で色分け）
    // 予想点が80点なら、円の80%までを描画。その中身を「中間」「期末」などの比率で分割。
    let currentAngle = -0.5 * Math.PI;
    const totalAngle = (predictedScore / 100) * 2 * Math.PI;
    
    activeCategories.forEach(cat => {
      // このカテゴリが予想点全体に占める割合（重みの比率）
      const sliceAngle = (cat.weight / totalWeight) * totalAngle;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.strokeStyle = cat.color;
      ctx.lineWidth = outerWidth;
      ctx.stroke();
      currentAngle += sliceAngle;
    });

    // --- 2. 内側：目標点 (Target) ---
    // 背景（グレー）
    drawArc(ctx, centerX, centerY, innerRadius, innerWidth, 100, '#ffffff');
    // 目標点バー（メインカラー）
    drawArc(ctx, centerX, centerY, innerRadius, innerWidth, targetScore, '#56828e');
    
    // --- 3. 中心の白い背景を描画 ---
    ctx.beginPath();
    // 内側の円より少し小さい円を描画
    ctx.arc(centerX, centerY, innerRadius - innerWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // --- 4. 中心テキスト ---
    ctx.fillStyle = '#333'; // テキストを黒色に
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${getGradeLetter(predictedScore)} ${predictedScore}`, centerX, centerY - 10);
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#555'; // 目標テキストも少し濃いめの黒に
    ctx.fillText(`目標 ${targetScore}`, centerX, centerY + 15);
  };

  // 円弧を描画するヘルパー関数
  const drawArc = (ctx, x, y, radius, width, percentage, color) => {
    const startAngle = -0.5 * Math.PI;
    const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const handleAddStatus = async (type) => {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
    const newEntry = { date: dateStr, type };
    const newHistory = [newEntry, ...attendanceHistory];
    setAttendanceHistory(newHistory);

    // Supabase更新（履歴配列のみを保存し、回数は自動計算に任せる）
    try {
      await supabase.from('subjects').update({
        attendance_history: newHistory
      }).eq('id', id);
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleUpdateHistory = async (index, newType) => {
    const oldType = attendanceHistory[index].type;
    if (oldType === newType) {
      setActiveMenuIndex(null);
      return;
    }

    const newHistory = [...attendanceHistory];
    newHistory[index] = { ...newHistory[index], type: newType };
    setAttendanceHistory(newHistory);
    setActiveMenuIndex(null);

    // DB更新
    await supabase.from('subjects').update({
      attendance_history: newHistory
    }).eq('id', id);
  };

  const handleDeleteHistory = async (index) => {
    const newHistory = attendanceHistory.filter((_, i) => i !== index);
    setAttendanceHistory(newHistory);
    setActiveMenuIndex(null);

    // DB更新
    await supabase.from('subjects').update({
      attendance_history: newHistory
    }).eq('id', id);
  };

  // --- スコア管理（小テスト・カスタム項目共通） ---

  // スコア追加
  const handleAddScore = async (key) => {
    const { score: scoreVal, date: dateVal } = scoreInputs[key];
    if (!scoreVal) return;
    const score = parseInt(scoreVal, 10);
    if (isNaN(score)) return;

    // 日付のフォーマット整形 (YYYY-MM-DD -> M/D)
    const dateObj = new Date(dateVal || Date.now());
    const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    const newEntry = { score, date: formattedDate, id: Date.now() };

    let updateData = {};
    let newSubjectData = { ...subject };

    if (key === 'small') {
      const current = subject.small_tests || [];
      const updated = [...current, newEntry];
      updateData = { small_tests: updated };
      newSubjectData.small_tests = updated;
    } else {
      // custom1 or custom2
      const currentCustom = subject.custom_results || {};
      const currentList = currentCustom[key] || [];
      const updatedList = [...currentList, newEntry];
      const updatedCustom = { ...currentCustom, [key]: updatedList };
      updateData = { custom_results: updatedCustom };
      newSubjectData.custom_results = updatedCustom;
    }

    setSubject(newSubjectData);
    // 入力欄をリセット（日付はそのまま残すか、今日に戻す）
    setScoreInputs({ ...scoreInputs, [key]: { ...scoreInputs[key], score: '' } });

    try {
      await supabase.from('subjects').update(updateData).eq('id', id);
    } catch (error) {
      console.error(`Error adding score to ${key}:`, error);
    }
  };

  // スコア編集・削除
  const handleUpdateScore = async (key, index, action, newValue = null) => {
    let list = [];
    if (key === 'small') {
      list = [...(subject.small_tests || [])];
    } else {
      list = [...((subject.custom_results && subject.custom_results[key]) || [])];
    }

    if (action === 'delete') {
      list.splice(index, 1);
    } else if (action === 'edit') {
      const currentItem = list[index];
      // 古いデータ（数値のみ）の場合は点数だけ表示、新しいデータ（オブジェクト）の場合は点数を取得
      const currentScore = typeof currentItem === 'object' ? currentItem.score : currentItem;
      
      // 簡易プロンプト
      const newScoreStr = window.prompt('新しい点数を入力してください', currentScore);
      if (newScoreStr === null) return;
      const newScore = parseInt(newScoreStr, 10);
      if (isNaN(newScore) || newScore < 0 || newScore > 100) {
        alert('0〜100の有効な数値を入力してください');
        return;
      }
      
      // データ構造を維持して更新
      if (typeof currentItem === 'object') {
        list[index] = { ...currentItem, score: newScore };
      } else {
        // 古いデータ形式だった場合、このタイミングでオブジェクト化してしまう
        list[index] = { score: newScore, date: '記録なし', id: Date.now() };
      }
    }

    let updateData = {};
    let newSubjectData = { ...subject };

    if (key === 'small') {
      updateData = { small_tests: list };
      newSubjectData.small_tests = list;
    } else {
      const currentCustom = subject.custom_results || {};
      const updatedCustom = { ...currentCustom, [key]: list };
      updateData = { custom_results: updatedCustom };
      newSubjectData.custom_results = updatedCustom;
    }

    setSubject(newSubjectData);
    setActiveScoreMenus({ ...activeScoreMenus, [key]: null });

    try {
      await supabase.from('subjects').update(updateData).eq('id', id);
    } catch (error) {
      console.error(`Error updating score in ${key}:`, error);
    }
  };

  // スコアセクションのレンダリング関数
  const renderScoreSection = (key, title) => {
    const scores = key === 'small' 
      ? (subject.small_tests || []) 
      : ((subject.custom_results && subject.custom_results[key]) || []);
    
    const isExpanded = expandedSections[key];
    const activeMenu = activeScoreMenus[key];

    return (
      <section className="small-tests-section card" key={key}>
        <h2>{title}</h2>
        <div className="small-test-input">
          {/* 日付入力 */}
          <input
            type="date"
            value={scoreInputs[key].date}
            onChange={(e) => setScoreInputs({ ...scoreInputs, [key]: { ...scoreInputs[key], date: e.target.value } })}
            style={{ flex: '0 0 130px' }} /* 日付欄の幅を固定 */
          />
          <input
            type="number"
            value={scoreInputs[key].score}
            onChange={(e) => setScoreInputs({ ...scoreInputs, [key]: { ...scoreInputs[key], score: e.target.value } })}
            placeholder="点数（0-100）"
            min="0"
            max="100"
          />
          <button onClick={() => handleAddScore(key)} className="btn-small">追加</button>
        </div>
        <div className="small-tests-list">
          {scores.length > 0 ? (
            <div className={`history-container ${isExpanded ? 'expanded' : ''}`}>
              <div className="history-list">
                {scores.map((item, idx) => {
                  // 古いデータ（数値のみ）と新しいデータ（オブジェクト）の両方に対応
                  const isObj = typeof item === 'object';
                  const displayDate = isObj ? item.date : `第${idx + 1}回`;
                  const displayScore = isObj ? item.score : item;

                  return (
                  <div key={isObj ? item.id : idx} className="test-item">
                    <span>{displayDate} : {displayScore}点</span>
                    
                    <button className="history-menu-btn" onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveScoreMenus({ ...activeScoreMenus, [key]: activeMenu === idx ? null : idx }); 
                    }}>
                      ⋮
                    </button>

                    {activeMenu === idx && (
                      <div className="history-menu-dropdown">
                        <button className="history-menu-item" onClick={() => handleUpdateScore(key, idx, 'edit')}>点数を編集</button>
                        <button className="history-menu-item delete" onClick={() => handleUpdateScore(key, idx, 'delete')}>削除</button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              {!isExpanded && scores.length > 2 && <div className="history-fade-overlay"></div>}
              
              {scores.length > 2 && (
                <button className="expand-button" onClick={() => setExpandedSections({ ...expandedSections, [key]: !isExpanded })}>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}><path d="M1 1L7 7L13 1" stroke="#518394" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', padding: '10px' }}>記録はまだありません</p>
          )}
        </div>
        <div className="small-test-average">
          <strong>平均点:</strong> {getAverageScore(scores) ? (Math.round(getAverageScore(scores) * 10) / 10) : '-'}
        </div>
      </section>
    );
  };

  const handleSaveExamScores = async () => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({
          midterm_score: midtermScore === '' ? null : Number(midtermScore),
          final_score: finalScore === '' ? null : Number(finalScore)
        })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving exam scores:', error);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const updatedEval = {
        kadai: Number(editForm.kadai),
        shoutest: Number(editForm.shoutest),
        chukan: Number(editForm.chukan),
        kimatsu: Number(editForm.kimatsu),
        custom1: { name: editForm.custom1Name, value: Number(editForm.custom1Value) },
        custom2: { name: editForm.custom2Name, value: Number(editForm.custom2Value) },
      };

      const { error } = await supabase
        .from('subjects')
        .update({
          name: editForm.name,
          teacher: editForm.teacher,
          room: editForm.room,
          target_score: Number(editForm.target_score),
          evaluation: updatedEval
        })
        .eq('id', id);

      if (error) throw error;
      
      setSubject({ ...subject, ...editForm, evaluation: updatedEval });
      setEditModal(false);
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('更新に失敗しました');
    }
  };

  const handleDeleteSubject = async () => {
    if (!window.confirm(`「${subject.name}」を本当に削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      navigate('/home');
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('削除に失敗しました');
    }
  };

  if (!subject) return <div>Loading...</div>;

  const evalData = subject.evaluation || {};
  return (
    <div className="kamoku-each-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/home')} className="header-btn">〈</button>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{subject.name}</h1>
        <button onClick={() => setEditModal(true)} className="header-btn">✎</button>
      </header>

      <main>
        <section className="grade-section">
          <div className="grade-chart">
            <canvas ref={canvasRef}></canvas>
            <div className="grade-legend">
              {/* 凡例：グラフの色と合わせる */}
              <div className="legend-item"><div className="legend-color" style={{ background: '#56828e' }}></div><span>目標</span></div>
              
              {Number(evalData.shoutest) > 0 && (
                <div className="legend-item"><div className="legend-color" style={{ background: '#a5c2cc' }}></div><span>小テスト {evalData.shoutest}%</span></div>
              )}
              {Number(evalData.chukan) > 0 && (
                <div className="legend-item"><div className="legend-color" style={{ background: '#f4cdd4' }}></div><span>中間 {evalData.chukan}%</span></div>
              )}
              {Number(evalData.kimatsu) > 0 && (
                <div className="legend-item"><div className="legend-color" style={{ background: '#f2e9ba' }}></div><span>期末 {evalData.kimatsu}%</span></div>
              )}
              {Number(evalData.custom1?.value) > 0 && (
                <div className="legend-item"><div className="legend-color" style={{ background: '#d3d3d3' }}></div><span>{evalData.custom1.name} {evalData.custom1.value}%</span></div>
              )}
              {Number(evalData.custom2?.value) > 0 && (
                <div className="legend-item"><div className="legend-color" style={{ background: '#e0e0e0' }}></div><span>{evalData.custom2.name} {evalData.custom2.value}%</span></div>
              )}
            </div>
          </div>
        </section>

        <section className="attendance-section card">
          <h2>出欠情報</h2>
          <div className="attendance-grid">
            <div className="attendance-item" onClick={() => handleAddStatus('出席')}><strong>出席:</strong> {attendanceCount}</div>
            <div className="attendance-item" onClick={() => handleAddStatus('欠席')}><strong>欠席:</strong> {absenceCount}</div>
            <div className="attendance-item" onClick={() => handleAddStatus('遅刻')}><strong>遅刻:</strong> {lateCount}</div>
          </div>

          {/* 出欠履歴リスト */}
          {attendanceHistory.length > 0 && (
            <div className={`history-container ${isHistoryExpanded ? 'expanded' : ''}`}>
              <div className="history-list">
                {attendanceHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <span className="history-date">{item.date}</span>
                    <span className="history-type">{item.type}</span>
                    
                    <button className="history-menu-btn" onClick={(e) => { e.stopPropagation(); setActiveMenuIndex(activeMenuIndex === index ? null : index); }}>
                      ⋮
                    </button>
                    
                    {activeMenuIndex === index && (
                      <div className="history-menu-dropdown">
                        {item.type !== '出席' && <button className="history-menu-item" onClick={() => handleUpdateHistory(index, '出席')}>出席に変更</button>}
                        {item.type !== '欠席' && <button className="history-menu-item" onClick={() => handleUpdateHistory(index, '欠席')}>欠席に変更</button>}
                        {item.type !== '遅刻' && <button className="history-menu-item" onClick={() => handleUpdateHistory(index, '遅刻')}>遅刻に変更</button>}
                        <button className="history-menu-item delete" onClick={() => handleDeleteHistory(index)}>削除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!isHistoryExpanded && attendanceHistory.length > 2 && <div className="history-fade-overlay"></div>}
              
              <button className="expand-button" onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                  <path d="M1 1L7 7L13 1" stroke="#518394" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* 小テスト管理（割合が0より大きい場合のみ表示） */}
        {Number(evalData.shoutest) > 0 && renderScoreSection('small', '小テスト管理')}

        {/* カスタム項目1管理 */}
        {Number(evalData.custom1?.value) > 0 && renderScoreSection('custom1', `${evalData.custom1.name}管理`)}

        {/* カスタム項目2管理 */}
        {Number(evalData.custom2?.value) > 0 && renderScoreSection('custom2', `${evalData.custom2.name}管理`)}

        {/* 定期試験結果（中間または期末のどちらかが0より大きい場合のみ表示） */}
        {(Number(evalData.chukan) > 0 || Number(evalData.kimatsu) > 0) && (
          <section className="exam-section card">
            <h2>定期試験結果</h2>
            <div className="exam-inputs">
              {Number(evalData.chukan) > 0 && (
                <div className="exam-input-group">
                  <label>中間テスト</label>
                  <input
                    type="number"
                    value={midtermScore}
                    onChange={(e) => setMidtermScore(e.target.value)}
                    onBlur={handleSaveExamScores}
                    placeholder="点数"
                    min="0"
                    max="100"
                  />
                </div>
              )}
              {Number(evalData.kimatsu) > 0 && (
                <div className="exam-input-group">
                  <label>期末テスト</label>
                  <input
                    type="number"
                    value={finalScore}
                    onChange={(e) => setFinalScore(e.target.value)}
                    onBlur={handleSaveExamScores}
                    placeholder="点数"
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {editModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>科目情報を編集</h2>
              <form onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label>科目名</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>目標点数</label>
                  <input type="number" name="target_score" value={editForm.target_score} onChange={handleEditChange} min="0" max="100" />
                </div>
                <div className="form-group">
                  <label>課題 (%)</label>
                  <input type="number" name="kadai" value={editForm.kadai} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>小テスト (%)</label>
                  <input type="number" name="shoutest" value={editForm.shoutest} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>期末テスト (%)</label>
                  <input type="number" name="kimatsu" value={editForm.kimatsu} onChange={handleEditChange} />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={handleDeleteSubject} className="btn-danger">削除</button>
                  <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">キャンセル</button>
                  <button type="submit" className="btn">保存</button>
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