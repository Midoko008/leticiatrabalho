import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [perfil, setPerfil] = useState(null);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [livrosPostados, setLivrosPostados] = useState([]);
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');

  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('usuario'));
    if (!userFromStorage) {
      navigate('/login');
      return;
    }

    setUsuarioLogado(userFromStorage);

    const urlUsuario = id
      ? `http://localhost:5000/usuarios/${id}`
      : `http://localhost:5000/usuarios/me`;

    fetch(urlUsuario, {
      headers: {
        'X-User-Id': userFromStorage.id
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar dados do perfil');
        return res.json();
      })
      .then(data => {
        setPerfil(data);
        setNovoNome(data.nome);
        setNovoEmail(data.email);
      })
      .catch(err => console.error("Erro ao buscar dados do perfil", err));

    const userIdParaLivros = id || userFromStorage.id;
    fetch(`http://localhost:5000/livros/usuario/${userIdParaLivros}`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar livros do usuário');
        return res.json();
      })
      .then(data => setLivrosPostados(data))
      .catch(err => {
        console.error("Erro ao buscar livros", err);
        setLivrosPostados([]);
      });
  }, [id, navigate]);

  if (!perfil || !usuarioLogado) return <p>Carregando perfil literário...</p>;

  const isMeuPerfil = !id || Number(usuarioLogado.id) === Number(id);
  const isAdmin = usuarioLogado.tipo === 'admin';

  function salvarEdicao() {
    fetch(`http://localhost:5000/usuarios/${usuarioLogado.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': usuarioLogado.id
      },
      body: JSON.stringify({
        nome: novoNome,
        email: novoEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensagem || data.erro);
        if (data.mensagem) {
          setPerfil(prev => ({ ...prev, nome: novoNome, email: novoEmail }));
          const novoLocal = { ...usuarioLogado, nome: novoNome, email: novoEmail };
          localStorage.setItem('usuario', JSON.stringify(novoLocal));
          setUsuarioLogado(novoLocal);
          setEditando(false);
        }
      })
      .catch(() => alert('Erro ao atualizar perfil literário'));
  }

  return (
    <div>
      <div className="perfil-container">
        <h1>Perfil Literário de {perfil.nome}</h1>

        {!editando ? (
          <div className="perfil-box">
            <p><strong>Nome:</strong> {perfil.nome}</p>
            <p><strong>Email:</strong> {perfil.email}</p>
            <p><strong>Idade:</strong> {perfil.idade}</p>

            {(isMeuPerfil || isAdmin) && (
              <>
                <p><strong>CPF:</strong> {perfil.cpf}</p>
                <p><strong>CEP:</strong> {perfil.cep}</p>
                <p><strong>Data de Nascimento:</strong> {perfil.data_nascimento}</p>
              </>
            )}

            {(!isMeuPerfil && !isAdmin) && (
              <p style={{ fontStyle: 'italic' }}>Informações restritas.</p>
            )}
          </div>
        ) : (
          <div className="perfil-box">
            <p><strong>Nome:</strong></p>
            <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} />

            <p><strong>Email:</strong></p>
            <input type="email" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} />
            <br/>
            <button
              onClick={salvarEdicao}
              className="botao-perfil botao-perfil-salvar"
              style={{ marginTop: '15px', marginRight: '3px' }}>
              Salvar
            </button>
            <button
              onClick={() => setEditando(false)}
              className="botao-perfil botao-perfil-cancelar"
              style={{ marginLeft: '6px' }}>
              Cancelar
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/paginaInicial')} className="botao-perfil">
            Voltar para For You Books
          </button>

          {isMeuPerfil && !editando && (
            <button
              onClick={() => setEditando(true)}
              className="botao-perfil"
              style={{ backgroundColor: '#17a2b8' }}>
              Editar Perfil Literário
            </button>
          )}
        </div>
      </div>

      <div className="livrosPostados" style={{ background: '#eee', padding: '20px', marginTop: '30px' }}>
        <h2>Livros Publicados</h2>

        {livrosPostados.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Nenhum livro publicado ainda.</p>
        ) : (
          <div className="lista-produtos" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
            {livrosPostados.map(livro => (
              <div
                key={livro.id}
                className="card-produto"
                onClick={() => navigate(`/livro/${livro.id}`)}
                style={{ cursor: 'pointer', maxWidth: '250px' }}
              >
                <img
                  src={livro.imagem_url}
                  alt={livro.nome}
                  className="imagem-produto"
                  style={{ width: '100%', borderRadius: '8px' }}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = '/img/imagem-nao-disponivel.png';
                  }}
                />
                <h3 style={{ margin: '10px 0 5px' }}>{livro.nome}</h3>
                <p>Preço: R$ {livro.preco.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
