import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const LoginForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.img`
  display: block;
  margin: 0 auto 2rem auto;
  max-width: 200px;
  height: auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 認証情報を直置き
  const credentials = {
    admin: {
      id: 'admin',
      password: 'admin123'
    },
    user: {
      id: 'user',
      password: 'user123'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 管理者認証
    if (email === credentials.admin.id && password === credentials.admin.password) {
      // 管理者としてログイン
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userId', email);
      navigate('/data-entry');
      return;
    }

    // ユーザー認証
    if (email === credentials.user.id && password === credentials.user.password) {
      // ユーザーとしてログイン
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('userId', email);
      navigate('/simulation-form');
      return;
    }

    // 認証失敗
    setError('IDまたはパスワードが正しくありません');
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Logo src="/denki_text_logo.png" alt="電気シミュレーター" />
        <Input
          type="text"
          placeholder="ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <Button type="submit">ログイン</Button>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 