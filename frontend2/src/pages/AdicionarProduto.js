import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function AdicionarLivro() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [estoque, setEstoque] = useState(1);
  const [filtroId, setFiltroId] = useState('');
  const [filtros, setFiltros] = useState([]);
  const [novoFiltro, setNovoFiltro] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [sinopse, setSinopse] = useState('');
  const navigate = useNavigate();
  const filtroBoxRef = useRef(null);

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    fetch('http://localhost:5000/filtros')
      .then(res => res.json())
      .then(data => setFiltros(data))
      .catch(err => console.error('Erro ao buscar filtros:', err));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filtroBoxRef.current && !filtroBoxRef.current.contains(e.target)) {
        setMostrarFiltros(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const criarFiltro = () => {
    if (!novoFiltro.trim()) return;
    if (filtros.find(f => f.nome.toLowerCase() === novoFiltro.toLowerCase())) {
      alert('Gênero já existe');
      return;
    }

    fetch('http://localhost:5000/filtros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoFiltro })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao criar gênero');
        return res.json();
      })
      .then(data => {
        const novo = { id: data.id, nome: novoFiltro };
        setFiltros([...filtros, novo]);
        setFiltroId(data.id);
        setNovoFiltro('');
      })
      .catch(err => alert(err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !preco || !imagemUrl || !filtroId || !usuario?.id) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    fetch('http://localhost:5000/livro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        preco: parseFloat(preco),
        imagem_url: imagemUrl,
        estoque: parseInt(estoque),
        filtro_id: parseInt(filtroId),
        sinopse: sinopse.trim(),
        usuario_id: usuario.id
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao publicar livro');
        return data;
      })
      .then(() => {
        alert('Livro publicado com sucesso!');
        navigate('/paginaInicial');
      })
      .catch(err => {
        console.error("Erro na requisição:", err);
        alert(err.message);
      });
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Publicar Livro</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <input
          type="text"
          placeholder="Título do Livro"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <textarea
          placeholder="Sinopse do Livro (opcional)"
          value={sinopse}
          onChange={e => setSinopse(e.target.value)}
          rows={4}
          style={{ resize: 'vertical' }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Preço (R$)"
          value={preco}
          onChange={e => setPreco(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="URL da Capa do Livro"
          value={imagemUrl}
          onChange={e => setImagemUrl(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Quantidade em Estoque"
          value={estoque}
          min={1}
          onChange={e => setEstoque(parseInt(e.target.value) || 1)}
          required
        />

        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{ padding: '8px 12px', borderRadius: 6 }}
          >
            {filtroId
              ? `Gênero Selecionado: ${filtros.find(f => f.id === parseInt(filtroId))?.nome}`
              : 'Selecionar Gênero'}
          </button>

          {mostrarFiltros && (
            <div
              ref={filtroBoxRef}
              style={{
                marginTop: 10,
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: 10,
                backgroundColor: '#f9f9f9',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              {filtros.map(f => (
                <div
                  key={f.id}
                  onClick={() => {
                    setFiltroId(f.id);
                    setMostrarFiltros(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    backgroundColor: filtroId === f.id ? '#a8e6a1' : '#eee',
                    border: '1px solid #bbb',
                    cursor: 'pointer'
                  }}
                >
                  {f.nome}
                </div>
              ))}
              <input
                type="text"
                value={novoFiltro}
                onChange={e => setNovoFiltro(e.target.value)}
                placeholder="+ Novo Gênero"
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: '1px solid #ccc',
                  width: 120
                }}
              />
              <button
                type="button"
                onClick={criarFiltro}
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        <button type="submit" style={{ marginTop: 20 }}>
          Publicar Livro
        </button>
      </form>

      <button
        onClick={() => navigate('/paginaInicial')}
        style={{
          marginTop: 20,
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer'
        }}
      >
        Voltar para Página Inicial
      </button>
    </div>
  );
}
