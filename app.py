from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, AcessadoresSite, Produto, Carrinho, Categoria
from datetime import datetime
import bcrypt

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://LetiSecretaria:LetiTaxista2022@localhost/usuarios'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Função para obter o usuário logado a partir do header Authorization (Bearer <user_id>)
def get_usuario_logado():
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    try:
        token_type, user_id = auth.split()
        if token_type.lower() != 'bearer':
            return None
        user_id_int = int(user_id)
        return AcessadoresSite.query.get(user_id_int)
    except Exception:
        return None

# --- Rotas Usuário ---

@app.route('/cadastro', methods=['POST'])
def cadastrar_usuario():
    dados = request.json
    try:
        nascimento = datetime.strptime(dados['data_nascimento'], '%Y-%m-%d').date()
    except (ValueError, KeyError):
        return jsonify({'erro': 'Data de nascimento inválida ou não informada'}), 400

    idade = AcessadoresSite.calcular_idade(nascimento)
    senha = dados.get('senha', '')
    if not senha:
        return jsonify({'erro': 'Senha não informada'}), 400

    senha_bytes = senha.encode('utf-8')
    senha_criptografada = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())

    novo_usuario = AcessadoresSite(
        nome=dados.get('nome'),
        email=dados.get('email'),
        cep=dados.get('cep'),
        cpf=dados.get('cpf'),
        data_nascimento=nascimento,
        idade=idade,
        senha_hash=senha_criptografada.decode('utf-8'),
        tipo='comum'
    )

    try:
        db.session.add(novo_usuario)
        db.session.commit()
        return jsonify({'mensagem': 'Usuário cadastrado com sucesso!'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao cadastrar usuário'}), 500

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    usuario = AcessadoresSite.query.filter_by(email=dados.get('email')).first()

    if usuario and bcrypt.checkpw(dados.get('senha', '').encode(), usuario.senha_hash.encode()):
        return jsonify({
            'mensagem': 'Login bem-sucedido',
            'usuario': {
                'id': usuario.id,
                'nome': usuario.nome,
                'email': usuario.email,
                'cep': usuario.cep,
                'cpf': usuario.cpf,
                'data_nascimento': usuario.data_nascimento.strftime('%Y-%m-%d'),
                'idade': usuario.idade,
                'tipo': usuario.tipo
            }
        }), 200

    return jsonify({'erro': 'E-mail ou senha inválidos'}), 401

@app.route('/usuarios/<int:id>', methods=['GET'])
def obter_usuario(id):
    usuario = AcessadoresSite.query.get_or_404(id)
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    if usuario_logado.id == usuario.id or usuario_logado.tipo == 'admin':
        return jsonify(usuario.to_dict_completo())
    else:
        return jsonify(usuario.to_dict_publico())

@app.route('/usuarios/me', methods=['GET'])
def obter_meu_perfil():
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401
    return jsonify(usuario_logado.to_dict_completo())

@app.route('/usuarios/<int:id>', methods=['PUT'])
def atualizar_usuario(id):
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401
    if usuario_logado.id != id and usuario_logado.tipo != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    dados = request.json
    usuario = AcessadoresSite.query.get_or_404(id)
    if 'nome' in dados:
        usuario.nome = dados['nome']
    if 'email' in dados:
        usuario.email = dados['email']

    try:
        db.session.commit()
        return jsonify({'mensagem': 'Dados atualizados com sucesso'})
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao atualizar usuário'}), 500

# --- Rotas Categoria ---

@app.route('/categorias', methods=['GET'])
def listar_categorias():
    categorias = Categoria.query.all()
    return jsonify([{'id': c.id, 'nome': c.nome} for c in categorias])

@app.route('/categorias', methods=['POST'])
def criar_categoria():
    dados = request.json
    nome = dados.get('nome')
    if not nome:
        return jsonify({'erro': 'Nome da categoria é obrigatório'}), 400

    existente = Categoria.query.filter_by(nome=nome).first()
    if existente:
        return jsonify({'erro': 'Categoria já existe'}), 400

    nova_categoria = Categoria(nome=nome)
    try:
        db.session.add(nova_categoria)
        db.session.commit()
        return jsonify({'mensagem': 'Categoria criada', 'id': nova_categoria.id}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar categoria'}), 500

# --- Rotas Produto ---

@app.route('/produtos', methods=['GET'])
def listar_produtos():
    produtos = Produto.query.all()
    lista = []
    for p in produtos:
        lista.append({
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'imagem_url': p.imagem_url,
            'estoque': p.estoque,
            'categoria': {
                'id': p.categoria.id if p.categoria else None,
                'nome': p.categoria.nome if p.categoria else None
            }
        })
    return jsonify(lista)

@app.route('/produtos/<int:id>', methods=['GET'])
def obter_produto(id):
    p = Produto.query.get(id)
    if not p:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    return jsonify({
        'id': p.id,
        'nome': p.nome,
        'preco': p.preco,
        'imagem_url': p.imagem_url,
        'estoque': p.estoque,
        'categoria': {
            'id': p.categoria.id if p.categoria else None,
            'nome': p.categoria.nome if p.categoria else None
        },
        'usuario': {
            'id': p.usuario.id,
            'nome': p.usuario.nome
        }
    })

@app.route('/produtos', methods=['POST'])
def criar_produto():
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    dados = request.json
    nome = dados.get('nome')
    preco = dados.get('preco')
    imagem_url = dados.get('imagem_url')
    estoque = dados.get('estoque')
    categoria_id = dados.get('categoria_id')

    if not nome or preco is None or not imagem_url or estoque is None or not categoria_id:
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        preco = float(preco)
        estoque = int(estoque)
        categoria_id = int(categoria_id)
        if estoque <= 0:
            return jsonify({'erro': 'Estoque deve ser maior que zero'}), 400
    except (ValueError, TypeError):
        return jsonify({'erro': 'Preço, estoque ou categoria inválidos'}), 400

    categoria = Categoria.query.get(categoria_id)
    if not categoria:
        return jsonify({'erro': 'Categoria não encontrada'}), 404

    novo_produto = Produto(
        nome=nome,
        preco=preco,
        imagem_url=imagem_url,
        estoque=estoque,
        categoria_id=categoria_id,
        usuario_id=usuario_logado.id
    )

    try:
        db.session.add(novo_produto)
        db.session.commit()
        return jsonify({'mensagem': 'Produto criado com sucesso!'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao salvar produto'}), 500

@app.route('/produtos/<int:id>', methods=['DELETE'])
def deletar_produto(id):
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    produto = Produto.query.get(id)
    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404

    if usuario_logado.id != produto.usuario_id and usuario_logado.tipo != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    try:
        Carrinho.query.filter_by(produto_id=id).delete()
        db.session.delete(produto)
        db.session.commit()
        return jsonify({'mensagem': 'Produto deletado com sucesso'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao deletar produto'}), 500

# --- Carrinho (sem usuário_id) ---

@app.route('/carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    dados = request.json
    produto_id = dados.get('produto_id')
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    if produto.estoque <= 0:
        return jsonify({'erro': 'Produto sem estoque'}), 400

    try:
        novo_item = Carrinho(produto_id=produto.id)
        produto.estoque -= 1
        db.session.add(novo_item)
        db.session.commit()
        return jsonify({'mensagem': 'Produto adicionado ao carrinho!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao adicionar ao carrinho', 'detalhe': str(e)}), 500

@app.route('/carrinho', methods=['GET'])
def listar_carrinho():
    itens = Carrinho.query.all()
    produtos = []
    valor_total = 0.0

    for item in itens:
        p = Produto.query.get(item.produto_id)
        if p:
            valor_total += p.preco
            produtos.append({
                'id': p.id,
                'nome': p.nome,
                'preco': p.preco,
                'imagem_url': p.imagem_url,
                'estoque': p.estoque,
                'categoria': {
                    'id': p.categoria.id if p.categoria else None,
                    'nome': p.categoria.nome if p.categoria else None
                }
            })

    return jsonify({'produtos': produtos, 'valor_total': f"{valor_total:.2f}"})

@app.route('/carrinho/<int:produto_id>', methods=['DELETE'])
def remover_do_carrinho(produto_id):
    item = Carrinho.query.filter_by(produto_id=produto_id).first()
    if not item:
        return jsonify({'erro': 'Produto não está no carrinho'}), 404

    try:
        produto = Produto.query.get(produto_id)
        if produto:
            produto.estoque += 1
        db.session.delete(item)
        db.session.commit()
        return jsonify({'mensagem': 'Produto removido do carrinho!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao remover do carrinho', 'detalhe': str(e)}), 500

@app.route('/produtos/usuario/<int:usuario_id>', methods=['GET'])
def produtos_por_usuario(usuario_id):
    produtos = Produto.query.filter_by(usuario_id=usuario_id).all()
    lista = []
    for p in produtos:
        lista.append({
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'imagem_url': p.imagem_url,
            'estoque': p.estoque,
            'categoria': {
                'id': p.categoria.id if p.categoria else None,
                'nome': p.categoria.nome if p.categoria else None
            }
        })
    return jsonify(lista)

@app.route('/produtos/categoria/<int:categoria_id>', methods=['GET'])
def produtos_por_categoria(categoria_id):
    produtos = Produto.query.filter_by(categoria_id=categoria_id).all()
    lista = []
    for p in produtos:
        lista.append({
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'imagem_url': p.imagem_url,
            'estoque': p.estoque,
            'categoria': {
                'id': p.categoria.id if p.categoria else None,
                'nome': p.categoria.nome if p.categoria else None
            }
        })
    return jsonify(lista)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
