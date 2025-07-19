from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, AcessadoresSite, Livro, Carrinho, Filtro
from datetime import datetime
import bcrypt
import traceback

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://LetiSecretaria:LetiTaxista2022@localhost/usuarios'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def get_usuario_logado():
    user_id = request.headers.get('X-User-Id')
    print('User ID recebido no header:', user_id)
    if not user_id:
        return None
    try:
        user_id_int = int(user_id)
        usuario = db.session.get(AcessadoresSite, user_id_int)
        return usuario
    except Exception:
        return None

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
    usuario = db.session.get(AcessadoresSite, id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
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
    usuario = db.session.get(AcessadoresSite, id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

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

@app.route('/filtros', methods=['GET'])
def listar_filtros():
    filtros = Filtro.query.all()
    return jsonify([{'id': f.id, 'nome': f.nome} for f in filtros])

@app.route('/filtros', methods=['POST'])
def criar_filtro():
    dados = request.json
    nome = dados.get('nome')
    if not nome:
        return jsonify({'erro': 'Nome do filtro é obrigatório'}), 400

    existente = Filtro.query.filter_by(nome=nome).first()
    if existente:
        return jsonify({'erro': 'Filtro já existe'}), 400

    novo_filtro = Filtro(nome=nome)
    try:
        db.session.add(novo_filtro)
        db.session.commit()
        return jsonify({'mensagem': 'Filtro criado', 'id': novo_filtro.id}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao criar filtro'}), 500

@app.route('/livros', methods=['GET'])
def listar_livros():
    livros = Livro.query.all()
    lista = []
    for l in livros:
        lista.append({
            'id': l.id,
            'nome': l.nome,
            'preco': l.preco,
            'imagem_url': l.imagem_url,
            'estoque': l.estoque,
            'sinopse': l.sinopse,
            'filtro': {
                'id': l.filtro.id if l.filtro else None,
                'nome': l.filtro.nome if l.filtro else None
            }
        })
    return jsonify(lista)

@app.route('/livros/<int:id>', methods=['GET'])
def obter_livro(id):
    l = db.session.get(Livro, id)
    if not l:
        return jsonify({'erro': 'Livro não encontrado'}), 404
    return jsonify({
        'id': l.id,
        'nome': l.nome,
        'preco': l.preco,
        'imagem_url': l.imagem_url,
        'estoque': l.estoque,
        'sinopse': l.sinopse,
        'filtro': {
            'id': l.filtro.id if l.filtro else None,
            'nome': l.filtro.nome if l.filtro else None
        },
        'usuario': {
            'id': l.usuario.id,
            'nome': l.usuario.nome
        }
    })

@app.route('/livros', methods=['POST'])
def criar_livro():
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    dados = request.json

    nome = dados.get('nome')
    preco = dados.get('preco')
    imagem_url = dados.get('imagem_url')
    estoque = dados.get('estoque')
    filtro_id = dados.get('filtro_id')
    sinopse = dados.get('sinopse')

    if not nome or preco is None or not imagem_url or estoque is None or filtro_id is None or sinopse is None:
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        preco = float(preco)
        estoque = int(estoque)
        filtro_id = int(filtro_id)
        if estoque <= 0:
            return jsonify({'erro': 'Estoque deve ser maior que zero'}), 400
    except (ValueError, TypeError):
        return jsonify({'erro': 'Preço, estoque ou filtro inválidos'}), 400

    filtro = db.session.get(Filtro, filtro_id)
    if not filtro:
        return jsonify({'erro': 'Filtro não encontrado'}), 404

    novo_livro = Livro(
        nome=nome,
        preco=preco,
        imagem_url=imagem_url,
        estoque=estoque,
        filtro_id=filtro_id,
        sinopse=sinopse,
        acessadores_site_id=usuario_logado.id
    )

    try:
        db.session.add(novo_livro)
        db.session.commit()
        return jsonify({'mensagem': 'Livro criado com sucesso!'}), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'erro': 'Erro ao salvar livro', 'detalhe': str(e)}), 500

@app.route('/livros/<int:id>', methods=['DELETE'])
def deletar_livro(id):
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    livro = db.session.get(Livro, id)
    if not livro:
        return jsonify({'erro': 'Livro não encontrado'}), 404

    if usuario_logado.id != livro.acessadores_site_id and usuario_logado.tipo != 'admin':
        return jsonify({'erro': 'Acesso negado'}), 403

    try:
        Carrinho.query.filter_by(livro_id=id).delete()
        db.session.delete(livro)
        db.session.commit()
        return jsonify({'mensagem': 'Livro deletado com sucesso'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao deletar livro'}), 500

@app.route('/livros/usuario/<int:usuario_id>', methods=['GET'])
def livros_por_usuario(usuario_id):
    livros = Livro.query.filter_by(acessadores_site_id=usuario_id).all()
    lista = []
    for l in livros:
        lista.append({
            'id': l.id,
            'nome': l.nome,
            'preco': l.preco,
            'imagem_url': l.imagem_url,
            'estoque': l.estoque,
            'sinopse': l.sinopse,
            'filtro': {
                'id': l.filtro.id if l.filtro else None,
                'nome': l.filtro.nome if l.filtro else None
            }
        })
    return jsonify(lista)

@app.route('/livros/filtro/<int:filtro_id>', methods=['GET'])
def livros_por_filtro(filtro_id):
    livros = Livro.query.filter_by(filtro_id=filtro_id).all()
    lista = []
    for l in livros:
        lista.append({
            'id': l.id,
            'nome': l.nome,
            'preco': l.preco,
            'imagem_url': l.imagem_url,
            'estoque': l.estoque,
            'sinopse': l.sinopse,
            'filtro': {
                'id': l.filtro.id if l.filtro else None,
                'nome': l.filtro.nome if l.filtro else None
            }
        })
    return jsonify(lista)

@app.route('/carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    dados = request.json
    livro_id = dados.get('livro_id')
    livro = db.session.get(Livro, livro_id)
    if not livro:
        return jsonify({'erro': 'Livro não encontrado'}), 404
    if livro.estoque <= 0:
        return jsonify({'erro': 'Livro sem estoque'}), 400

    try:
        novo_item = Carrinho(livro_id=livro.id, acessadores_site_id=usuario_logado.id)
        livro.estoque -= 1
        db.session.add(novo_item)
        db.session.commit()
        return jsonify({'mensagem': 'Livro adicionado ao carrinho!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao adicionar ao carrinho', 'detalhe': str(e)}), 500

@app.route('/carrinho', methods=['GET'])
def listar_carrinho():
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    itens = Carrinho.query.filter_by(acessadores_site_id=usuario_logado.id).all()
    livros = []
    valor_total = 0.0

    for item in itens:
        l = db.session.get(Livro, item.livro_id)
        if l:
            valor_total += l.preco
            livros.append({
                'id': l.id,
                'nome': l.nome,
                'preco': l.preco,
                'imagem_url': l.imagem_url,
                'estoque': l.estoque,
                'filtro': {
                    'id': l.filtro.id if l.filtro else None,
                    'nome': l.filtro.nome if l.filtro else None
                }
            })

    return jsonify({'produtos': livros, 'valor_total': f"{valor_total:.2f}"})

@app.route('/carrinho/<int:livro_id>', methods=['DELETE'])
def remover_do_carrinho(livro_id):
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    item = Carrinho.query.filter_by(livro_id=livro_id, acessadores_site_id=usuario_logado.id).first()
    if not item:
        return jsonify({'erro': 'Livro não está no carrinho'}), 404

    try:
        livro = db.session.get(Livro, livro_id)
        if livro:
            livro.estoque += 1
        db.session.delete(item)
        db.session.commit()
        return jsonify({'mensagem': 'Livro removido do carrinho!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao remover do carrinho', 'detalhe': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
