import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Perfil() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [perfil, setPerfil] = useState(null);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [produtosPostados, setProdutosPostados] = useState([]);
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
        Authorization: `Bearer ${userFromStorage.id}`
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

    const userIdParaProdutos = id || userFromStorage.id;
    fetch(`http://localhost:5000/produtos/usuario/${userIdParaProdutos}`)
      .then(res => res.json())
      .then(data => setProdutosPostados(data))
      .catch(err => console.error("Erro ao buscar produtos", err));
  }, [id, navigate]);

  if (!perfil || !usuarioLogado) return <p>Carregando perfil...</p>;

  const isMeuPerfil = !id || Number(usuarioLogado.id) === Number(id);
  const isAdmin = usuarioLogado.tipo === 'admin';

  function salvarEdicao() {
    fetch(`http://localhost:5000/usuarios/${usuarioLogado.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${usuarioLogado.id}`
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
      .catch(() => alert('Erro ao atualizar informações'));
  }

  return (
    <div>
      <div className="perfil-container">
        <h1>Perfil de {perfil.nome}</h1>

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
            <button onClick={() => setEditando(false)} className="botao-perfil botao-perfil-cancelar"style = {{marginLeft: '6px'}}>
              Cancelar
            </button>
          </div>
        )}

        {/* Botões inferiores: voltar + editar */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/paginaInicial')} className="botao-perfil">
            Voltar para Página Inicial
          </button>

          {isMeuPerfil && !editando && (
            <button onClick={() => setEditando(true)} className="botao-perfil" style={{ backgroundColor: '#17a2b8' }}>
              Editar Informações
            </button>
          )}
        </div>
      </div>

      <div className="produtosPostados" style={{ background: '#eee', padding: '20px', marginTop: '30px' }}>
        <h2>Produtos Postados</h2>

        {produtosPostados.length === 0 ? (
          <p>Nenhum produto postado ainda.</p>
        ) : (
          <div className="lista-produtos">
            {produtosPostados.map(produto => (
              <div key={produto.id} className="card-produto" onClick={() => navigate(`/produto/${produto.id}`)}>
                <img src={produto.imagem_url} alt={produto.nome} className="imagem-produto" />
                <h3>{produto.nome}</h3>
                <p>Preço: R$ {produto.preco.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
