import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // App original do Firebase
// import AppDepartamentos from './AppDepartamentos'; // Versão antiga
// import AppDjango from './AppDjango'; // Versão completa com React Router
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
