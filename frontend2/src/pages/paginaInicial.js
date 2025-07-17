import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function PaginaInicial() {
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [filtros, setFiltros] = useState([]);
  const [filtroSelecionado, setFiltroSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/filtros')
      .then(res => res.json())
      .then(data => setFiltros(data))
      .catch(err => {
        console.error('Erro ao buscar filtros:', err);
        setFiltros([]);
      });
  }, []);

  useEffect(() => {
    async function buscarProdutos() {
      setLoading(true);
      setErro(null);
      try {
        let url = 'http://localhost:5000/livro';

        if (filtroSelecionado) {
          url = `http://localhost:5000/livro/filtro/${filtroSelecionado}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erro ao buscar livros: ${res.statusText}`);
        let data = await res.json();

        // Filtra pelo título localmente
        if (filtro.trim()) {
          const termo = filtro.trim().toLowerCase();
          data = data.filter(l => l.nome.toLowerCase().includes(termo));
        }

        setProdutosFiltrados(data);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar os livros.');
        setProdutosFiltrados([]);
      } finally {
        setLoading(false);
      }
    }

    buscarProdutos();
  }, [filtro, filtroSelecionado]);

  function irParaPerfil() {
    navigate('/perfil');
  }

  function abrirDetalhes(id) {
    navigate(`/livro/${id}`);
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
      body: JSON.stringify({ livro_id: produtoId }),
    })
      .then(res => res.json())
      .then(data => alert(data.mensagem || data.erro))
      .catch(() => alert('Erro ao adicionar à estante'));
  }

  return (
    <div className="pagina-inicial">
      <header className="header">
        <h1>For You Books</h1>
        <div className="botoes-topo">
          <button className="botao-perfil" onClick={irParaPerfil}>
            Meu Perfil Literário
          </button>
          <button className="botao-adicionar" onClick={irParaAdicionarProduto}>
            Publicar Livro
          </button>
          <button
            className="botao-carrinho topo"
            onClick={irParaCarrinho}
            aria-label="Minha Estante"
            title="Minha Estante"
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
              width="24"
              height="24"
            >
              <path d="M4 19.5V6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V19.5L12 16L4 19.5Z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="filtros-container">
        <input
          type="text"
          placeholder="Buscar livros pelo título..."
          value={filtro}
          onChange={e => {
            setFiltro(e.target.value);
            setFiltroSelecionado('');
          }}
          className="barra-pesquisa"
          aria-label="Busca livros pelo título"
        />

        <select
          value={filtroSelecionado}
          onChange={e => {
            setFiltroSelecionado(e.target.value);
            setFiltro('');
          }}
          className="select-categoria"
          aria-label="Filtrar por gênero"
        >
          <option value="">Filtrar por gênero...</option>
          {filtros.map(f => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Carregando livros...</p>}
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <div className="lista-produtos">
        {!loading && produtosFiltrados.length === 0 && <p>Nenhum livro encontrado.</p>}

        {produtosFiltrados.map(produto => (
          <div
            key={produto.id}
            className="card-produto"
            onClick={() => abrirDetalhes(produto.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' ? abrirDetalhes(produto.id) : null)}
          >
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="imagem-produto"
              onError={e => {
                e.target.onerror = null;
                e.target.src = '/img/imagem-nao-disponivel.png';
              }}
            />
            <h3>{produto.nome}</h3>
            <p>Preço: R$ {produto.preco.toFixed(2)}</p>
            <button
              className="botao-carrinho card"
              onClick={e => adicionarAoCarrinho(e, produto.id)}
              aria-label={`Adicionar "${produto.nome}" à estante`}
              title="Adicionar à estante"
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
                <path d="M4 19.5V6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V19.5L12 16L4 19.5Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
