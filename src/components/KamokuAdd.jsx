import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './KamokuAdd.css';

const KamokuAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    weekday: '1', // 最初から数値（文字列型）で管理
    period: '1',
    credit: '2',
    category: 'lecture',
  });

  // 成績評価割合のState
  const [weights, setWeights] = useState({
    kadai: '',
    shoutest: '',
    chukan: '',
    kimatsu: '',
  });

  // カスタム項目のState
  const [custom1, setCustom1] = useState({ name: '', value: '' });
  const [custom2, setCustom2] = useState({ name: '', value: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!formData.name) {
      setErrorMsg('科目名を入力してください');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('ログイン有効期限が切れました。ログイン画面に戻ります。');
        navigate('/login');
        return;
      }

      // 送信データを作成（数値変換を確実に行う）
      const submitData = {
        user_id: user.id,
        name: formData.name,
        weekday: parseInt(formData.weekday, 10),
        period: parseInt(formData.period, 10),
        credit: parseInt(formData.credit, 10),
        category: formData.category,
        // 成績割合データをまとめる
        evaluation: {
          kadai: Number(weights.kadai) || 0,
          shoutest: Number(weights.shoutest) || 0,
          chukan: Number(weights.chukan) || 0,
          kimatsu: Number(weights.kimatsu) || 0,
          custom1: { name: custom1.name, value: Number(custom1.value) || 0 },
          custom2: { name: custom2.name, value: Number(custom2.value) || 0 },
        }
      };

      console.log('送信データ:', submitData);

      const { error } = await supabase
        .from('subjects')
        .insert([submitData]);

      if (error) throw error;

      navigate('/home');
    } catch (error) {
      console.error('登録エラー詳細:', error);
      setErrorMsg(`登録に失敗しました: ${error.message} ${error.details || ''} ${error.hint || ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="add-card">
        <header>
          <button className="btn-back" onClick={() => navigate('/home')}>〈</button>
          <h1>科目追加</h1>
          <div className="btn-placeholder"></div>
        </header>

        {errorMsg && (
          <div className="error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="subject-form">
          <div className="section-title">基本情報</div>

          <div className="form-group">
            <label>科目名 <span className="required">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例: 離散数学"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>曜日</label>
              <select name="weekday" value={formData.weekday} onChange={handleChange}>
                <option value="1">月曜</option>
                <option value="2">火曜</option>
                <option value="3">水曜</option>
                <option value="4">木曜</option>
                <option value="5">金曜</option>
                <option value="6">その他</option>
              </select>
            </div>
            <div className="form-group">
              <label>時限</label>
              <select name="period" value={formData.period} onChange={handleChange}>
                <option value="1">1限</option>
                <option value="2">2限</option>
                <option value="3">3限</option>
                <option value="4">4限</option>
                <option value="5">5限</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>区分</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="lecture">講義</option>
                <option value="exercise">演習</option>
                <option value="experiment">実験</option>
              </select>
            </div>
            <div className="form-group">
              <label>単位数</label>
              <select name="credit" value={formData.credit} onChange={handleChange}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>

          {/* 成績評価割合セクション */}
          <div className="section-title">成績の割合</div>
          
          <div className="weight-list">
            {/* デフォルト項目 */}
            <div className="weight-item">
              <span className="weight-label">課題</span>
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={weights.kadai}
                  onChange={(e) => setWeights({ ...weights, kadai: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>

            <div className="weight-item">
              <span className="weight-label">小テスト</span>
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={weights.shoutest}
                  onChange={(e) => setWeights({ ...weights, shoutest: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>

            <div className="weight-item">
              <span className="weight-label">中間テスト</span>
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={weights.chukan}
                  onChange={(e) => setWeights({ ...weights, chukan: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>

            <div className="weight-item">
              <span className="weight-label">期末テスト</span>
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={weights.kimatsu}
                  onChange={(e) => setWeights({ ...weights, kimatsu: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>

            {/* カスタム項目1 */}
            <div className="weight-item">
              <input
                type="text"
                className="custom-name-input"
                placeholder="その他1 (例: レポート)"
                value={custom1.name}
                onChange={(e) => setCustom1({ ...custom1, name: e.target.value })}
              />
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={custom1.value}
                  onChange={(e) => setCustom1({ ...custom1, value: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>

            {/* カスタム項目2 */}
            <div className="weight-item">
              <input
                type="text"
                className="custom-name-input"
                placeholder="その他2 (例: 出席)"
                value={custom2.name}
                onChange={(e) => setCustom2({ ...custom2, name: e.target.value })}
              />
              <div className="weight-input-wrapper">
                <input
                  type="number"
                  className="weight-input"
                  value={custom2.value}
                  onChange={(e) => setCustom2({ ...custom2, value: e.target.value })}
                  placeholder="0"
                />
                <span className="weight-unit">%</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KamokuAdd;