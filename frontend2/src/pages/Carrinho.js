import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Carrinho() {
  const [livros, setLivros] = useState([]);
  const [valorTotal, setValorTotal] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
      alert('Você precisa estar logado para ver o carrinho.');
      navigate('/login');
      return;
    }

    fetch('http://localhost:5000/carrinho', {
      headers: { 'X-User-Id': usuario.id }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar carrinho');
        return res.json();
      })
      .then(data => {
        // Usar 'produtos' conforme backend, não 'livros'
        setLivros(data.produtos || []);
        setValorTotal(data.valor_total ? Number(data.valor_total).toFixed(2) : '0.00');
        setLoading(false);
      })
      .catch(() => {
        alert('Erro ao carregar carrinho');
        setLoading(false);
      });
  }, [navigate]);

  function removerDoCarrinho(e, livroId) {
    e.stopPropagation();

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
      alert('Você precisa estar logado para alterar o carrinho.');
      navigate('/login');
      return;
    }

    fetch(`http://localhost:5000/carrinho/${livroId}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': usuario.id }
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensagem || data.erro);
        if (data.mensagem) {
          const novaLista = livros.filter(p => p.id !== livroId);
          setLivros(novaLista);

          // Garantir que preco é número para soma correta
          const novoTotal = novaLista.reduce((total, p) => total + Number(p.preco), 0);
          setValorTotal(novoTotal.toFixed(2));
        }
      })
      .catch(() => alert('Erro ao remover do carrinho'));
  }

  if (loading) return <div>Carregando carrinho...</div>;

  return (
    <div
      className="pagina-inicial"
      style={{
        maxWidth: 650,
        margin: '40px auto',
        padding: 30,
        backgroundColor: '#fefcf6',
        borderRadius: 12,
        boxShadow: '0 6px 15px rgba(0,0,0,0.08)'
      }}
    >
      <button
        className="botao-perfil"
        onClick={() => navigate('/paginaInicial')}
        style={{ marginBottom: 25 }}
      >
        Voltar
      </button>

      <h1
        style={{
          fontFamily: 'Georgia, serif',
          color: '#2c3e50',
          marginBottom: 30,
          textAlign: 'center'
        }}
      >
        Estante de livros
      </h1>

      <div
        className="lista-livros"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: livros.length === 0 ? 'center' : 'flex-start'
        }}
      >
        {livros.length === 0 && (
          <p
            style={{
              fontStyle: 'italic',
              color: '#5d533b',
              fontSize: '1.1rem',
              textAlign: 'center',
              width: '100%'
            }}
          >
            Seu carrinho está vazio.
          </p>
        )}

        {livros.map(livro => (
          <div
            key={livro.id}
            className="card-livro"
            style={{
              cursor: 'default',
              paddingBottom: 50,
              position: 'relative',
              maxWidth: 220,
              flexGrow: 1
            }}
          >
            <img
              src={livro.imagem_url}
              alt={livro.nome}
              className="imagem-livro"
              style={{
                maxHeight: 280,
                marginBottom: 16,
                boxShadow: '0 3px 12px rgb(0 0 0 / 0.1)',
                width: '100%',
                objectFit: 'cover',
                borderRadius: 8
              }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = '/img/imagem-nao-disponivel.png';
              }}
            />
            <h3
              style={{
                fontFamily: 'Georgia, serif',
                color: '#34495e',
                marginBottom: 8,
                fontSize: '1.1rem'
              }}
            >
              {livro.nome}
            </h3>
            <p
              style={{
                fontWeight: '600',
                color: '#7f8c8d',
                marginBottom: 10
              }}
            >
              Preço: R$ {livro.preco.toFixed(2)}
            </p>

            <button
              className="botao-carrinho remover"
              onClick={e => removerDoCarrinho(e, livro.id)}
              aria-label={`Remover ${livro.nome} do carrinho`}
              title="Remover do carrinho"
              style={{
                position: 'absolute',
                bottom: 15,
                right: 15,
                backgroundColor: '#b03a2e',
                borderRadius: '50%',
                padding: 12,
                border: 'none',
                boxShadow: '0 4px 8px rgba(176, 58, 46, 0.5)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, background-color 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#7a241d';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#b03a2e';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                className="icone-carrinho"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
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
        ))}
      </div>

      <div
        className="carrinho-footer"
        style={{
          backgroundColor: '#fcf9f3',
          borderRadius: 12,
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          padding: 20,
          marginTop: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          fontFamily: 'Georgia, serif',
          color: '#5d533b',
          fontWeight: '600'
        }}
      >
        <span className="precoTotal" style={{ fontSize: 28 }}>
          Total: R$ {valorTotal}
        </span>
        <button
          className="confirmarCompra"
          style={{
            minWidth: 160,
            padding: '12px 24px',
            backgroundColor: '#4b6587',
            color: '#f0ead8',
            fontWeight: '700',
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 4px 8px rgba(75, 101, 135, 0.5)',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#34495e')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#4b6587')}
          // Pode adicionar onClick para lógica de compra aqui
        >
          Confirmar compra
        </button>
      </div>
    </div>
  );
}
