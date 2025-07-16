from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, AcessadoresSite, Produto, Carrinho, Filtro
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
            'filtro': {
                'id': p.filtro.id if p.filtro else None,
                'nome': p.filtro.nome if p.filtro else None
            }
        })
    return jsonify(lista)

@app.route('/produtos/<int:id>', methods=['GET'])
def obter_produto(id):
    p = db.session.get(Produto, id)
    if not p:
        return jsonify({'erro': 'Produto não encontrado'}), 404
    return jsonify({
        'id': p.id,
        'nome': p.nome,
        'preco': p.preco,
        'imagem_url': p.imagem_url,
        'estoque': p.estoque,
        'filtro': {
            'id': p.filtro.id if p.filtro else None,
            'nome': p.filtro.nome if p.filtro else None
        },
        'usuario': {
            'id': p.usuario.id,
            'nome': p.usuario.nome
        }
    })

@app.route('/produtos', methods=['POST'])
def criar_produto():
    usuario_logado = get_usuario_logado()
    print("DEBUG - Usuário logado no backend:", usuario_logado)
    if not usuario_logado:
        print("DEBUG - Usuário não autenticado. Falha na autenticação")
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    dados = request.json
    print("DEBUG - Dados recebidos para criar produto:", dados)

    nome = dados.get('nome')
    preco = dados.get('preco')
    imagem_url = dados.get('imagem_url')
    estoque = dados.get('estoque')
    filtro_id = dados.get('filtro_id')

    if not nome or preco is None or not imagem_url or estoque is None or filtro_id is None:
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        preco = float(preco)
        estoque = int(estoque)
        filtro_id = int(filtro_id)
        if estoque <= 0:
            return jsonify({'erro': 'Estoque deve ser maior que zero'}), 400
    except (ValueError, TypeError) as e:
        print("[DEBUG] Erro na conversão de tipos:", e)
        return jsonify({'erro': 'Preço, estoque ou filtro inválidos'}), 400

    filtro = db.session.get(Filtro, filtro_id)
    if not filtro:
        return jsonify({'erro': 'Filtro não encontrado'}), 404

    novo_produto = Produto(
        nome=nome,
        preco=preco,
        imagem_url=imagem_url,
        estoque=estoque,
        filtro_id=filtro_id,
        acessadores_site_id=usuario_logado.id  # ALTERADO para novo campo
    )

    try:
        db.session.add(novo_produto)
        db.session.commit()
        return jsonify({'mensagem': 'Produto criado com sucesso!'}), 201
    except Exception as e:
        db.session.rollback()
        print("[ERROR] Erro ao salvar produto:")
        traceback.print_exc()
        return jsonify({'erro': 'Erro ao salvar produto', 'detalhe': str(e)}), 500


@app.route('/produtos/<int:id>', methods=['DELETE'])
def deletar_produto(id):
    usuario_logado = get_usuario_logado()
    if not usuario_logado:
        return jsonify({'erro': 'Usuário não autenticado'}), 401

    produto = db.session.get(Produto, id)
    if not produto:
        return jsonify({'erro': 'Produto não encontrado'}), 404

    if usuario_logado.id != produto.acessadores_site_id and usuario_logado.tipo != 'admin':  # ALTERADO
        return jsonify({'erro': 'Acesso negado'}), 403

    try:
        Carrinho.query.filter_by(produto_id=id).delete()
        db.session.delete(produto)
        db.session.commit()
        return jsonify({'mensagem': 'Produto deletado com sucesso'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'erro': 'Erro ao deletar produto'}), 500

@app.route('/carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    dados = request.json
    produto_id = dados.get('produto_id')
    produto = db.session.get(Produto, produto_id)
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
        p = db.session.get(Produto, item.produto_id)
        if p:
            valor_total += p.preco
            produtos.append({
                'id': p.id,
                'nome': p.nome,
                'preco': p.preco,
                'imagem_url': p.imagem_url,
                'estoque': p.estoque,
                'filtro': {
                    'id': p.filtro.id if p.filtro else None,
                    'nome': p.filtro.nome if p.filtro else None
                }
            })

    return jsonify({'produtos': produtos, 'valor_total': f"{valor_total:.2f}"})

@app.route('/carrinho/<int:produto_id>', methods=['DELETE'])
def remover_do_carrinho(produto_id):
    item = Carrinho.query.filter_by(produto_id=produto_id).first()
    if not item:
        return jsonify({'erro': 'Produto não está no carrinho'}), 404

    try:
        produto = db.session.get(Produto, produto_id)
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
    produtos = Produto.query.filter_by(acessadores_site_id=usuario_id).all()  # ALTERADO
    lista = []
    for p in produtos:
        lista.append({
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'imagem_url': p.imagem_url,
            'estoque': p.estoque,
            'filtro': {
                'id': p.filtro.id if p.filtro else None,
                'nome': p.filtro.nome if p.filtro else None
            }
        })
    return jsonify(lista)

@app.route('/produtos/filtro/<int:filtro_id>', methods=['GET'])
def produtos_por_filtro(filtro_id):
    produtos = Produto.query.filter_by(filtro_id=filtro_id).all()
    lista = []
    for p in produtos:
        lista.append({
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'imagem_url': p.imagem_url,
            'estoque': p.estoque,
            'filtro': {
                'id': p.filtro.id if p.filtro else None,
                'nome': p.filtro.nome if p.filtro else None
            }
        })
    return jsonify(lista)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
