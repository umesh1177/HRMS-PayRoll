/**
 * React Application DOM Entrypoint
 * 
 * RESPONSIBILITY:
 * Mounts the React application tree into the HTML #root DOM node and loads global styles.
 * 
 * NOT RESPONSIBLE FOR:
 * Routing or component hierarchy.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
