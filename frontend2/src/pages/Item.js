import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Livro() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [livro, setLivro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noCarrinho, setNoCarrinho] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
      navigate('/login');
      return;
    }
    setUsuarioLogado(usuario);

    fetch(`http://localhost:5000/livros/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Livro não encontrado');
        return res.json();
      })
      .then(data => {
        setLivro(data);
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        navigate('/paginaInicial');
      });
  }, [id, navigate]);

  useEffect(() => {
    if (!usuarioLogado) return;

    fetch('http://localhost:5000/carrinho', {
      headers: {
        'X-User-Id': usuarioLogado.id
      }
    })
      .then(res => res.json())
      .then(data => {
        // Verifica se o livro está no carrinho pelo livro_id
        const estaNoCarrinho = data.produtos?.some(item => item.livro_id === Number(id)) || false;
        setNoCarrinho(estaNoCarrinho);
      })
      .catch(() => setNoCarrinho(false));
  }, [id, usuarioLogado]);

  if (loading || !livro || !usuarioLogado) return <div>Carregando...</div>;

  function deletarLivro() {
    if (!window.confirm('Tem certeza que deseja deletar este livro?')) return;

    fetch(`http://localhost:5000/livros/${livro.id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': usuarioLogado.id
      }
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensagem || data.erro);
        if (data.mensagem) {
          navigate('/paginaInicial');
        }
      })
      .catch(() => alert('Erro ao deletar livro'));
  }

  // Pode deletar se for dono do livro ou admin
  const podeDeletar =
    livro.usuario &&
    usuarioLogado &&
    (livro.usuario.id === usuarioLogado.id || usuarioLogado.tipo === 'admin');

  return (
    <div
      className="pagina-inicial"
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: 20,
        backgroundColor: '#fffef8',
        borderRadius: 10,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      <button className="botao-perfil" onClick={() => navigate('/paginaInicial')}>
        Voltar
      </button>

      <h1 style={{ marginTop: 20 }}>{livro.nome}</h1>

      <img
        src={livro.imagem_url}
        alt={livro.nome}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: 8,
          marginBottom: 20,
          boxShadow: '0 0 5px rgba(0,0,0,0.15)'
        }}
        onError={e => {
          e.target.onerror = null;
          e.target.src = '/img/imagem-nao-disponivel.png';
        }}
      />

      <p>
        <strong>Preço:</strong> R$ {livro.preco.toFixed(2)}
      </p>
      <p>
        <strong>Estoque:</strong> {livro.estoque}
      </p>

      {livro.filtro && (
        <p>
          <strong>Categoria:</strong> {livro.filtro.nome}
        </p>
      )}

      {livro.sinopse && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            backgroundColor: '#f9f9f9',
            borderLeft: '5px solid #007bff',
            borderRadius: 6
          }}
        >
          <h3 style={{ marginBottom: 10 }}>📖 Sinopse</h3>
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{livro.sinopse}</p>
        </div>
      )}

      {livro.usuario && (
        <p style={{ marginTop: 20 }}>
          <strong>Postado por: </strong>
          <span
            onClick={() => navigate(`/perfil/${livro.usuario.id}`)}
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {livro.usuario.nome}
          </span>
        </p>
      )}

      {!noCarrinho && (
        <button
          className="botao-perfil"
          onClick={() => {
            fetch('http://localhost:5000/carrinho', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': usuarioLogado.id
              },
              body: JSON.stringify({ livro_id: livro.id })
            })
              .then(res => res.json())
              .then(data => {
                alert(data.mensagem || data.erro);
                if (data.mensagem) setNoCarrinho(true);
              })
              .catch(() => alert('Erro ao adicionar ao carrinho'));
          }}
        >
          Adicionar ao Carrinho
        </button>
      )}

      {noCarrinho && (
        <button
          className="botao-perfil"
          onClick={() => {
            fetch(`http://localhost:5000/carrinho/${livro.id}`, {
              method: 'DELETE',
              headers: {
                'X-User-Id': usuarioLogado.id
              }
            })
              .then(res => res.json())
              .then(data => {
                alert(data.mensagem || data.erro);
                if (data.mensagem) setNoCarrinho(false);
              })
              .catch(() => alert('Erro ao remover do carrinho'));
          }}
          style={{ backgroundColor: '#dc3545' }}
        >
          Remover do Carrinho
        </button>
      )}

      {podeDeletar && (
        <button
          className="botao-perfil"
          style={{ backgroundColor: '#b22222', marginTop: 20 }}
          onClick={deletarLivro}
        >
          Deletar Livro
        </button>
      )}
    </div>
  );
}
