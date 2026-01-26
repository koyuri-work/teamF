import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './Login.css'; // ログイン画面と同じCSSを使用

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    studentId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 学校のメールドメイン
  const SCHOOL_DOMAIN = '@shibaura-it.ac.jp';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // メールアドレスのバリデーション
    if (!formData.email.endsWith(SCHOOL_DOMAIN)) {
      setError(`メールアドレスは ${SCHOOL_DOMAIN} のものを使用してください。`);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            student_id: formData.studentId,
          },
        },
      });

      if (error) throw error;

      alert('登録が完了しました！メールアドレスの確認をしてからログインしてください。');
      navigate('/'); // ホームへ移動
    } catch (error) {
      console.error('Signup error:', error);
      setError('登録に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>新規登録</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSignup} className="auth-form">
        <input
          type="email"
          name="email"
          placeholder="メールアドレス (例: AA12345@shibaura-it.ac.jp)"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="studentId"
          placeholder="学籍番号 (例: AA12345)"
          value={formData.studentId}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="パスワード"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
        />
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>
      <div className="auth-link">
        すでにアカウントをお持ちですか？ <Link to="/login">ログインはこちら</Link>
      </div>
    </div>
  );
};

export default Signup;