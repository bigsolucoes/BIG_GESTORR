import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth'; 
import { APP_NAME, SettingsIcon, EyeOpenIcon, EyeClosedIcon, LogOutIcon } from '../constants';

const Header: React.FC = () => {
  const { settings, updateSettings } = useAppData();
  const { currentUser, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (currentUser) {
      navigate('/dashboard'); 
    }
  };

  const togglePrivacyMode = () => {
    updateSettings({ privacyModeEnabled: !settings.privacyModeEnabled });
  };

  return (
    <header className="bg-card-bg text-text-primary py-4 px-6 sm:px-8 shadow-md flex justify-between items-center h-20 sticky top-0 z-30">
      {/* Logo on the left */}
      <div 
        onClick={handleLogoClick}
        className="cursor-pointer flex items-center"
        title="Ir para o Dashboard"
      >
        {settings.customLogo ? (
          <img src={settings.customLogo} alt={`${APP_NAME} Logo`} className="h-12 max-h-full max-w-xs object-contain" />
        ) : (
          <span className="text-5xl font-bold text-slate-900 font-robuck tracking-wide">{APP_NAME}</span>
        )}
      </div>

      {/* Icons on the right */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePrivacyMode}
          className="p-2 text-text-secondary hover:text-accent transition-colors"
          title={settings.privacyModeEnabled ? "Mostrar Valores Monetários" : "Ocultar Valores Monetários"}
        >
          {settings.privacyModeEnabled ? <EyeClosedIcon size={20} /> : <EyeOpenIcon size={20} />}
        </button>
        <Link 
          to="/settings" 
          className="p-2 text-text-secondary hover:text-accent transition-colors"
          title="Configurações"
        >
          <SettingsIcon size={20} />
        </Link>
        <button
          onClick={logout}
          className="p-2 text-text-secondary hover:text-red-500 transition-colors"
          title="Sair da conta"
        >
          <LogOutIcon size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;