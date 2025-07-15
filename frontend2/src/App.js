import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import PaginaInicial from './pages/paginaInicial';
import Perfil from './pages/perfil';
import Item from './pages/Item';
import AdicionarProduto from './pages/AdicionarProduto';
import Carrinho from './pages/Carrinho';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/paginaInicial" element={<PaginaInicial />} />
        {/* Rota para perfil do usuário logado */}
        <Route path="/perfil" element={<Perfil />} />
        {/* Rota para perfil de outro usuário */}
        <Route path="/perfil/:id" element={<Perfil />} />
        <Route path="/produto/:id" element={<Item />} />
        <Route path="/adicionar-produto" element={<AdicionarProduto />} />
        <Route path="/carrinho" element={<Carrinho />} />
      </Routes>
    </Router>
  );
}

export default App;
