

import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS, APP_NAME, ExternalLinkIcon } from '../constants';
import { LucideProps } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<LucideProps>;
}

const Sidebar: React.FC = () => {
  const { settings } = useAppData();
  const asaasUrl = settings.asaasUrl || 'https://www.asaas.com/login';
  const googleDriveUrl = 'https://drive.google.com';
  const googlePhotosUrl = 'https://photos.google.com';

  return (
    <div className={`w-64 p-4 hidden md:flex md:flex-col space-y-2 h-full shadow-2xl 
                    bg-slate-900 text-slate-300 border-r border-slate-800`}>
      <nav className="flex-grow mt-4"> 
        <ul>
          {(NAVIGATION_ITEMS as NavigationItem[]).map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.name} className="mb-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out group ${
                      isActive 
                        ? 'bg-accent font-semibold text-white shadow-lg shadow-accent/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {IconComponent && <IconComponent size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />}
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* External Links Section */}
      <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
        <a
          href={asaasUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200 ease-in-out"
        >
          <ExternalLinkIcon size={20} />
          <span>Acessar Asaas</span>
        </a>
        <a
          href={googleDriveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200 ease-in-out"
        >
          <ExternalLinkIcon size={20} />
          <span>Acessar Drive</span>
        </a>
        <a
          href={googlePhotosUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors duration-200 ease-in-out"
        >
          <ExternalLinkIcon size={20} />
          <span>Acessar Google Fotos</span>
        </a>
      </div>

      <div className="text-center text-xs text-slate-500 mt-auto pt-4 pb-2">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
        <p>BIG Soluções</p>
      </div>
    </div>
  );
};

export default Sidebar;