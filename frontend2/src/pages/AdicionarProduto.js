import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function AdicionarProduto() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [estoque, setEstoque] = useState(1);
  const [filtroId, setFiltroId] = useState('');
  const [filtros, setFiltros] = useState([]);
  const [novoFiltro, setNovoFiltro] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
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
      alert('Filtro já existe');
      return;
    }

    fetch('http://localhost:5000/filtros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoFiltro })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao criar filtro');
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
    if (!nome || !preco || !imagemUrl || !filtroId) {
      alert('Preencha todos os campos');
      return;
    }

    fetch('http://localhost:5000/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': usuario?.id  // envio do id do usuário no header customizado
      },
      body: JSON.stringify({
        nome,
        preco: parseFloat(preco),
        imagem_url: imagemUrl,
        estoque: parseInt(estoque),
        filtro_id: parseInt(filtroId)
      })
    })
      .then(async (res) => {
        console.log("Status da resposta:", res.status);
        const data = await res.json();
        console.log("Corpo da resposta:", data);
        if (!res.ok) throw new Error(data.erro || 'Erro ao adicionar produto');
        return data;
      })
      .then(() => {
        alert('Produto adicionado!');
        navigate('/paginaInicial');
      })
      .catch(err => {
        console.error("Erro na requisição:", err);
        alert(err.message);
      });
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Adicionar Produto</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <input
          type="text"
          placeholder="Nome do Produto"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Preço"
          value={preco}
          onChange={e => setPreco(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="URL da Imagem"
          value={imagemUrl}
          onChange={e => setImagemUrl(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Estoque"
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
              ? `Filtro Selecionado: ${filtros.find(f => f.id === parseInt(filtroId))?.nome}`
              : 'Selecionar Filtro'}
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
                placeholder="+ Novo"
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: '1px solid #ccc',
                  width: 100
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
          Salvar Produto
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
        Voltar
      </button>
    </div>
  );
}
