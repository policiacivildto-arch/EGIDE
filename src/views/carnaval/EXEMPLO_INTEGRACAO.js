// Exemplo de integração no App.js ou AppDjango.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { PlanoOperacionalCarnaval } from './views/carnaval';

// ... outras importações

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navegação */}
        <nav className="bg-blue-900 text-white p-4">
          <div className="container mx-auto flex gap-6">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            <Link to="/carnaval2026" className="hover:text-blue-200">
              Plano Carnaval 2026
            </Link>
            {/* ... outros links */}
          </div>
        </nav>

        {/* Rotas */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/carnaval2026" element={<PlanoOperacionalCarnaval />} />
          {/* ... outras rotas */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

/* 
 * ALTERNATIVA: Adicionar como aba na página de eventos
 */

import { PlanoOperacionalCarnaval } from './views/carnaval';

function EventosPage() {
  const [abaAtiva, setAbaAtiva] = useState('lista');

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setAbaAtiva('lista')}>Lista de Eventos</button>
        <button onClick={() => setAbaAtiva('carnaval2026')}>Carnaval 2026</button>
      </div>

      {abaAtiva === 'lista' && <ListaEventos />}
      {abaAtiva === 'carnaval2026' && <PlanoOperacionalCarnaval />}
    </div>
  );
}

/*
 * ALTERNATIVA: Componente standalone para apresentação
 */

import ReactDOM from 'react-dom/client';
import { PlanoOperacionalCarnaval } from './views/carnaval';
import './index.css';

// Renderizar apenas a apresentação (útil para apresentações em tela cheia)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PlanoOperacionalCarnaval />
  </React.StrictMode>
);
