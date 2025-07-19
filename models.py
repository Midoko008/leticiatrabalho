from flask_sqlalchemy import SQLAlchemy
from datetime import date

db = SQLAlchemy()

class AcessadoresSite(db.Model):
    __tablename__ = 'acessadores_site'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    cep = db.Column(db.String(9))
    cpf = db.Column(db.String(14))
    data_nascimento = db.Column(db.Date)
    idade = db.Column(db.Integer)
    senha_hash = db.Column(db.Text)
    tipo = db.Column(db.String(20), default='comum')

    livros = db.relationship('Livro', back_populates='usuario', cascade='all, delete-orphan')

    @staticmethod
    def calcular_idade(data_nascimento):
        hoje = date.today()
        return hoje.year - data_nascimento.year - (
            (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day)
        )

    def to_dict_completo(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'cep': self.cep,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento.strftime('%Y-%m-%d') if self.data_nascimento else None,
            'idade': self.idade,
            'tipo': self.tipo
        }

    def to_dict_publico(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'idade': self.idade
        }

class Filtro(db.Model):
    __tablename__ = 'filtro'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False, unique=True)

    livros = db.relationship('Livro', back_populates='filtro', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Filtro {self.nome}>'

class Livro(db.Model):
    __tablename__ = 'livros'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco = db.Column(db.Float, nullable=False)
    imagem_url = db.Column(db.String(255))
    estoque = db.Column(db.Integer, nullable=False)
    sinopse = db.Column(db.Text, nullable=False)

    acessadores_site_id = db.Column(db.Integer, db.ForeignKey('acessadores_site.id'), nullable=False)
    usuario = db.relationship('AcessadoresSite', back_populates='livros')

    filtro_id = db.Column(db.Integer, db.ForeignKey('filtro.id'), nullable=False)
    filtro = db.relationship('Filtro', back_populates='livros')

    carrinho_items = db.relationship('Carrinho', back_populates='livro', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Livro {self.nome}>'

class Carrinho(db.Model):
    __tablename__ = 'carrinho'

    id = db.Column(db.Integer, primary_key=True)
    livro_id = db.Column(db.Integer, db.ForeignKey('livros.id'), nullable=False)

    livro = db.relationship('Livro', back_populates='carrinho_items')

    acessadores_site_id = db.Column(db.Integer, db.ForeignKey('acessadores_site.id'), nullable=False)
    usuario = db.relationship('AcessadoresSite')

    def __repr__(self):
        return f'<Carrinho livro_id={self.livro_id} acessadores_site_id={self.acessadores_site_id}>'
