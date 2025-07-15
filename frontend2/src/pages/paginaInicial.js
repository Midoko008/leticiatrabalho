import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function PaginaInicial() {
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Erro ao buscar categorias:', err));
  }, []);

  useEffect(() => {
    let url = 'http://localhost:5000/produtos';

    const termo = filtro.trim();
    if (termo) {
      url = `http://localhost:5000/produtos/buscar?q=${encodeURIComponent(termo)}`;
    } else if (categoriaSelecionada) {
      url = `http://localhost:5000/produtos/categoria/${categoriaSelecionada}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setProdutosFiltrados(data))
      .catch(err => {
        console.error('Erro ao buscar produtos:', err);
        setProdutosFiltrados([]);
      });
  }, [filtro, categoriaSelecionada]);

  function irParaPerfil() {
    navigate('/perfil');
  }

  function abrirDetalhes(id) {
    navigate(`/produto/${id}`);
  }

  function irParaAdicionarProduto() {
    navigate('/adicionar-produto');
  }

  function irParaCarrinho() {
    navigate('/carrinho');
  }

  function adicionarAoCarrinho(e, produtoId) {
    e.stopPropagation();
    fetch('http://localhost:5000/carrinho', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id: produtoId }),
    })
      .then(res => res.json())
      .then(data => alert(data.mensagem || data.erro))
      .catch(() => alert('Erro ao adicionar ao carrinho'));
  }

  return (
    <div className="pagina-inicial">
      <header className="header">
        <h1>Feed de Produtos</h1>
        <div className="botoes-topo">
          <button className="botao-perfil" onClick={irParaPerfil}>Ver Perfil</button>
          <button className="botao-adicionar" onClick={irParaAdicionarProduto}>Adicionar Produto</button>
          <button
            className="botao-carrinho topo"
            onClick={irParaCarrinho}
            aria-label="Ver carrinho"
            title="Ver carrinho"
          >
            <svg className="icone-carrinho" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Barra de busca com classe */}
      <div className="filtros-container">
      <input
        type="text"
        placeholder="Buscar produtos pelo nome..."
        value={filtro}
        onChange={e => {
          setFiltro(e.target.value);
          setCategoriaSelecionada('');
        }}
        className="barra-pesquisa"
      />

      {/* Filtro de categoria com classe */}
      <select
        value={categoriaSelecionada}
        onChange={e => {
          setCategoriaSelecionada(e.target.value);
          setFiltro('');
        }}
        className="select-categoria"
      >
        <option value="">Filtrar por categoria...</option>
        {categorias.map(c => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      </div>

      <div className="lista-produtos">
        {produtosFiltrados.length === 0 ? (
          <p>Nenhum produto encontrado.</p>
        ) : (
          produtosFiltrados.map(produto => (
            <div
              key={produto.id}
              className="card-produto"
              onClick={() => abrirDetalhes(produto.id)}
            >
              <img
                src={produto.imagem_url}
                alt={produto.nome}
                className="imagem-produto"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/img/imagem-nao-disponivel.png';
                }}
              />
              <h3>{produto.nome}</h3>
              <p>Preço: R$ {produto.preco.toFixed(2)}</p>
              <button
                className="botao-carrinho card"
                onClick={(e) => adicionarAoCarrinho(e, produto.id)}
                aria-label={`Adicionar ${produto.nome} ao carrinho`}
                title="Adicionar ao carrinho"
              >
                <svg
                  className="icone-carrinho"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="20"
                  height="20"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
