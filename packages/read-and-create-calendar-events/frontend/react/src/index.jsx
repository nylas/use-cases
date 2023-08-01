import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import './styles/style.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
const SERVER_URI = import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

root.render(
  <React.StrictMode>
    <AppProvider serverBaseUrl={SERVER_URI}>
      <App />
    </AppProvider>
  </React.StrictMode>
);
