import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { APP_NAME } from '../constants';

const RestPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useAppData();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleExitRestMode = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center cursor-pointer z-[200]"
      onClick={handleExitRestMode}
      title="Clique para voltar"
    >
      <div className="text-center">
        <div className="animate-slowPulse">
          {settings.customLogo ? (
            <img 
              src={settings.customLogo} 
              alt={`${APP_NAME} Logo`} 
              className="h-32 sm:h-48 mx-auto object-contain" 
            />
          ) : (
            <h1 className="text-9xl sm:text-[10rem] font-bold text-accent font-robuck tracking-wide">
              {APP_NAME}
            </h1>
          )}
        </div>
         <p className="text-5xl sm:text-6xl font-mono text-text-secondary mt-8">
            {time.toLocaleTimeString('pt-BR')}
        </p>
      </div>
      <p className="mt-8 text-text-secondary animate-pulse">
        Clique em qualquer lugar para voltar
      </p>
    </div>
  );
};

export default RestPage;