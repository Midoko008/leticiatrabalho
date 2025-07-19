import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

export default function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    cep: '',
    cpf: '',
    data_nascimento: '',
    senha: '',
  });

  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => {
        setMensagem(data.mensagem || data.erro || 'Erro desconhecido');
        if (data.mensagem) {
          setForm({
            nome: '',
            email: '',
            cep: '',
            cpf: '',
            data_nascimento: '',
            senha: '',
          });
        }
      })
      .catch(() => setMensagem('Erro ao cadastrar.'));
  };

  return (
    <div className="container">
      <h2>Cadastro de Booker</h2>
      <form onSubmit={handleSubmit} className="formulario">
        {['nome', 'email', 'cep', 'cpf', 'data_nascimento', 'senha'].map((campo) => (
          <input
            key={campo}
            type={campo === 'senha' ? 'password' : campo === 'data_nascimento' ? 'date' : 'text'}
            name={campo}
            placeholder={campo.replace('_', ' ').toUpperCase()}
            value={form[campo]}
            onChange={handleChange}
            required
          />
        ))}
        <button type="submit">Cadastrar</button>
        {mensagem && <p style={{ marginTop: '10px', color: 'blue' }}>{mensagem}</p>}
      </form>

      {/* Link para login */}
      <p style={{ marginTop: '15px' }}>
        Já é um Booker? <Link to="/login">Faça login</Link>
      </p>
    </div>
  );
}
