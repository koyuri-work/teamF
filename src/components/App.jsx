import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// コンポーネントのインポート
import Home from './Home';
import KamokuAdd from './KamokuAdd';
import KamokuEach from './KamokuEach';
import Todo from './Todo';
import Login from './Login';
import Signup from './Signup';

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // まずセッションがあるか確認
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // セッションがあっても、トークンが有効かサーバーに問い合わせる
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // 無効ならログアウト処理をしてセッションをクリア
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(session);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    };

    checkUser();

    // ログイン状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '10px', fontSize: '14px', letterSpacing: '1px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ログインしていない場合はログイン画面へリダイレクト */}
        <Route path="/" element={session ? <Home /> : <Navigate to="/login" />} />
        
        {/* 認証ページ */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />

        {/* その他の保護されたページ */}
        <Route path="/kamoku-add" element={session ? <KamokuAdd /> : <Navigate to="/login" />} />
        <Route path="/kamoku-each/:id" element={session ? <KamokuEach /> : <Navigate to="/login" />} />
        <Route path="/todo" element={session ? <Todo /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;