import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth'; 
import { APP_NAME, SettingsIcon, EyeOpenIcon, EyeClosedIcon, LogOutIcon, BellIcon } from '../constants';
import { Notification } from '../types';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
    notifications: Notification[];
    markNotificationsAsRead: (notificationId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ notifications, markNotificationsAsRead }) => {
  const { settings, updateSettings } = useAppData();
  const { currentUser, logout } = useAuth(); 
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogoClick = () => {
    if (currentUser) {
      navigate('/rest'); 
    }
  };

  const togglePrivacyMode = () => {
    updateSettings({ privacyModeEnabled: !settings.privacyModeEnabled });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
        markNotificationsAsRead(notification.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelRef]);

  return (
    <header className="bg-card-bg text-text-primary py-4 px-6 sm:px-8 shadow-md flex justify-between items-center h-20 sticky top-0 z-30">
      {/* Logo on the left */}
      <div 
        onClick={handleLogoClick}
        className="cursor-pointer flex items-center"
        title="Ir para a tela de descanso"
      >
        {settings.customLogo ? (
          <img src={settings.customLogo} alt={`${APP_NAME} Logo`} className="h-12 max-h-full max-w-xs object-contain" />
        ) : (
          <span className="text-5xl font-bold text-slate-900 font-robuck tracking-wide">{APP_NAME}</span>
        )}
      </div>

      {/* Icons on the right */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsPanelOpen(prev => !prev)}
                className="p-2 text-text-secondary hover:text-accent transition-colors relative"
                title="Notificações"
            >
                <BellIcon size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-card-bg"></span>
                )}
            </button>
            {isPanelOpen && (
                <NotificationsPanel
                    notifications={notifications}
                    onClose={() => setIsPanelOpen(false)}
                    onNotificationClick={handleNotificationClick}
                />
            )}
        </div>

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
