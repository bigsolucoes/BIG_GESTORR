import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { AppDataProvider } from './hooks/useAppData';
import { AuthProvider } from './hooks/useAuth';
import { NotificationsProvider } from './hooks/useNotifications';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <AppDataProvider>
          <NotificationsProvider>
            <App />
          </NotificationsProvider>
        </AppDataProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);