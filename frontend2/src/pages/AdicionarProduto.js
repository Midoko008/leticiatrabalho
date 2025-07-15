import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function AdicionarProduto() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [estoque, setEstoque] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const navigate = useNavigate();
  const categoriaBoxRef = useRef(null);

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    fetch('http://localhost:5000/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Erro ao buscar categorias:', err));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (categoriaBoxRef.current && !categoriaBoxRef.current.contains(e.target)) {
        setMostrarCategorias(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const criarCategoria = () => {
    if (!novaCategoria.trim()) return;
    if (categorias.find(cat => cat.nome.toLowerCase() === novaCategoria.toLowerCase())) {
      alert('Categoria já existe');
      return;
    }

    fetch('http://localhost:5000/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaCategoria })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao criar categoria');
        return res.json();
      })
      .then(data => {
        const nova = { id: data.id, nome: novaCategoria };
        setCategorias([...categorias, nova]);
        setCategoriaId(data.id);
        setNovaCategoria('');
      })
      .catch(err => alert(err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !preco || !imagemUrl || !categoriaId) {
      alert('Preencha todos os campos');
      return;
    }

    fetch('http://localhost:5000/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario?.id}`
      },
      body: JSON.stringify({
        nome,
        preco: parseFloat(preco),
        imagem_url: imagemUrl,
        estoque: parseInt(estoque),
        categoria_id: parseInt(categoriaId)
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao adicionar produto');
        return res.json();
      })
      .then(() => {
        alert('Produto adicionado!');
        navigate('/paginaInicial');
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Adicionar Produto</h2>
      <form onSubmit={handleSubmit} className="formulario">
        <input type="text" placeholder="Nome do Produto" value={nome} onChange={e => setNome(e.target.value)} required />
        <input type="number" step="0.01" placeholder="Preço" value={preco} onChange={e => setPreco(e.target.value)} required />
        <input type="url" placeholder="URL da Imagem" value={imagemUrl} onChange={e => setImagemUrl(e.target.value)} required />
        <input type="number" placeholder="Estoque" value={estoque} min={1} onChange={e => setEstoque(parseInt(e.target.value) || 1)} required />

        <div style={{ marginTop: 20 }}>
          <button type="button" onClick={() => setMostrarCategorias(!mostrarCategorias)} style={{ padding: '8px 12px', borderRadius: 6 }}>
            {categoriaId
              ? `Categoria Selecionada: ${categorias.find(cat => cat.id === parseInt(categoriaId))?.nome}`
              : 'Selecionar Categoria'}
          </button>

          {mostrarCategorias && (
            <div ref={categoriaBoxRef} style={{
              marginTop: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              padding: 10,
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {categorias.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setCategoriaId(cat.id);
                    setMostrarCategorias(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    backgroundColor: categoriaId === cat.id ? '#a8e6a1' : '#eee',
                    border: '1px solid #bbb',
                    cursor: 'pointer'
                  }}
                >
                  {cat.nome}
                </div>
              ))}
              <input
                type="text"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                placeholder="+ Nova"
                style={{
                  padding: '6px 10px',
                  borderRadius: 20,
                  border: '1px solid #ccc',
                  width: 100
                }}
              />
              <button
                type="button"
                onClick={criarCategoria}
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

        <button type="submit" style={{ marginTop: 20 }}>Salvar Produto</button>
      </form>

      <button onClick={() => navigate('/paginaInicial')} style={{
        marginTop: 20,
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer'
      }}>
        Voltar
      </button>
    </div>
  );
}
