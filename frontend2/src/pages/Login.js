import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem('');
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.usuario) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          navigate('/paginaInicial');
        } else {
          setMensagem(data.erro || 'Erro desconhecido');
        }
      })
      .catch(() => setMensagem('Erro ao fazer login.'))
      .finally(() => setCarregando(false));
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
        {mensagem && (
          <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{mensagem}</p>
        )}
      </form>

      <p style={{ textAlign: 'center' }}>
        Não tem conta?{' '}
        <Link to="/cadastro" style={{ color: '#007bff', textDecoration: 'none' }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
