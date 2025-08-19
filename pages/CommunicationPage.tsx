
import React, { useState, useEffect } from 'react';
import { WhatsAppIcon, ExternalLinkIcon } from '../constants';
import { APP_NAME } from '../constants';

const WHATSAPP_WARNING_KEY = 'big_whatsapp_warning_shown';

const CommunicationPage: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const warningShown = localStorage.getItem(WHATSAPP_WARNING_KEY);
    if (!warningShown) {
      setShowWarning(true);
    }
  }, []);

  const handleCloseWarning = () => {
    setShowWarning(false);
    localStorage.setItem(WHATSAPP_WARNING_KEY, 'true');
  };
  
  const openWhatsAppPopup = () => {
    const width = 1000;
    const height = 750;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    window.open(
      'https://web.whatsapp.com/',
      'whatsapp_window',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Comunicação (WhatsApp)</h1>
      </div>

      {showWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
            </div>
            <div>
              <p className="font-bold">Aviso Importante</p>
              <p className="text-sm">Por razões de segurança, o WhatsApp não pode ser exibido diretamente aqui. A melhor solução é abri-lo em uma janela dedicada ao lado.</p>
              <button 
                onClick={handleCloseWarning}
                className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow flex items-center justify-center bg-card-bg rounded-xl shadow-lg p-8 border border-border-color">
        <div className="text-center">
            <WhatsAppIcon size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Acesso ao WhatsApp Web</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Clique no botão para abrir suas conversas em uma nova janela. Isso permite que você use o WhatsApp e o {APP_NAME} lado a lado.
            </p>
            <button
                onClick={openWhatsAppPopup}
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <span className="mr-2">Abrir WhatsApp em Janela</span>
                <ExternalLinkIcon size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPage;
