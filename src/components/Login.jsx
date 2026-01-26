import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Signupと同じドメインを設定
  const SCHOOL_DOMAIN = '@shibaura-it.ac.jp';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    console.log("Login attempt...");
    e.preventDefault();
    setError('');
    setLoading(true);

    // 学籍番号からメールアドレスを生成してログイン
    const email = formData.studentId + SCHOOL_DOMAIN;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password,
      });

      if (error) throw error;

      navigate('/home'); // ログイン成功したらホームへ
    } catch (error) {
      console.error('Login error:', error);
      setError('ログインに失敗しました。学籍番号かパスワードを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  console.log("Login component rendered"); // 描画確認用ログ

  return (
    <div className="auth-container">
      <h1>ログイン</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="text"
          name="studentId"
          placeholder="学籍番号"
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
        />
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <div className="auth-link">
        アカウントをお持ちでないですか？ <Link to="/signup">新規登録</Link>
      </div>
    </div>
  );
};

export default Login;