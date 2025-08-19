import React from 'react';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '../constants';

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onClose, onNotificationClick }) => {
  const navigate = useNavigate();

  const handleItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    navigate(notification.linkTo);
    onClose();
  };

  const sortedNotifications = [...notifications].sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-card-bg rounded-lg shadow-2xl border border-border-color animate-modalShow z-50">
      <div className="p-3 border-b border-border-color">
        <h3 className="font-semibold text-text-primary">Notificações</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {sortedNotifications.length > 0 ? (
          <ul>
            {sortedNotifications.map(notification => (
              <li key={notification.id}>
                <button
                  onClick={() => handleItemClick(notification)}
                  className={`w-full text-left p-3 text-sm transition-colors hover:bg-slate-100 ${
                    notification.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'
                  }`}
                >
                  <span className="block">{notification.message}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-sm text-text-secondary">
            <BellIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p>Você não tem novas notificações.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
