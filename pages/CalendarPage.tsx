

import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import toast from 'react-hot-toast';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, SyncIcon } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarEvent } from '../types';

const CalendarPage: React.FC = () => {
  const { settings, connectGoogleCalendar, disconnectGoogleCalendar, calendarEvents, syncCalendar } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleConnect = async () => {
    setIsConnecting(true);
    toast('Conectando com Google Calendar...', { icon: '🗓️', id: 'connecting-toast' });
    const success = await connectGoogleCalendar();
    toast.dismiss('connecting-toast');
    if (success) {
      toast.success('Google Calendar conectado!');
    } else {
      toast.error('Falha ao conectar com Google Calendar.');
    }
    setIsConnecting(false);
  };
  
  const handleDisconnect = () => {
    disconnectGoogleCalendar();
    toast('Google Calendar desconectado.', { icon: 'ℹ️' });
  };
  
  const handleManualSync = () => {
    setIsSyncing(true);
    toast.promise(
      new Promise<void>((resolve, reject) => {
        try {
            // Simulating a short delay for better UX
            setTimeout(() => {
              syncCalendar();
              resolve();
            }, 500);
        } catch(e) {
            reject(e);
        }
      }),
      {
        loading: 'Sincronizando calendário...',
        success: 'Calendário sincronizado!',
        error: 'Erro ao sincronizar.',
      }
    ).finally(() => {
      setIsSyncing(false);
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); // Avoid month-end issues
      newDate.setMonth(prevDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };
  
  const { monthName, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { monthName, year, daysInMonth, firstDayOfMonth };
  }, [currentDate]);

  const calendarGridCells = useMemo(() => {
    const cells = [];
    // Padding for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ key: `pad-${i}`, isPadding: true });
    }
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, currentDate.getMonth(), day);
      const dayEvents = calendarEvents.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart.getFullYear() === date.getFullYear() &&
               eventStart.getMonth() === date.getMonth() &&
               eventStart.getDate() === date.getDate();
      });
      cells.push({ key: `day-${day}`, day, isToday: day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth(), events: dayEvents });
    }
    return cells;
  }, [firstDayOfMonth, daysInMonth, year, currentDate, calendarEvents]);
  
  const EventPill: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const isBigEvent = event.source === 'big';
    const pillClass = isBigEvent
      ? 'bg-accent text-white'
      : 'bg-blue-500 text-white';
    
    const content = (
      <div 
        className={`px-1.5 py-0.5 text-xs rounded-sm mb-1 truncate ${pillClass}`}
        title={`${event.title}${isBigEvent ? ' (Clique para ver o job)' : ''}`}
      >
        {event.title}
      </div>
    );
    
    return isBigEvent ? (
      <button onClick={() => navigate('/jobs')} className="w-full text-left">{content}</button>
    ) : content;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
            <CalendarIcon size={32} className="text-accent mr-3" />
            <h1 className="text-3xl font-bold text-text-primary">Calendário</h1>
        </div>
        {settings.googleCalendarConnected ? (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-sm bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg shadow transition-colors flex items-center disabled:opacity-50"
                >
                    <SyncIcon size={16} className={`mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
                <button 
                    onClick={handleDisconnect}
                    className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg shadow transition-colors flex items-center"
                >
                    <XIcon size={16} className="mr-1.5"/> Desconectar Google
                </button>
            </div>
        ) : <div/>}
      </div>

      <div className="flex-grow bg-card-bg shadow-lg rounded-xl flex flex-col overflow-hidden border border-border-color">
        <header className="flex flex-wrap justify-between items-center p-3 border-b border-border-color">
          <div className="flex items-center">
            <button onClick={() => navigateDate('prev')} className="p-2 text-slate-600 hover:text-accent rounded-full hover:bg-slate-200 transition-colors" title="Mês Anterior">
              <ChevronLeftIcon size={24} />
            </button>
            <h2 className="text-xl font-semibold text-text-primary mx-4 w-52 text-center capitalize">{monthName}</h2>
            <button onClick={() => navigateDate('next')} className="p-2 text-slate-600 hover:text-accent rounded-full hover:bg-slate-200 transition-colors" title="Próximo Mês">
              <ChevronRightIcon size={24} />
            </button>
          </div>
        </header>
        
        {!settings.googleCalendarConnected ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <p className="text-lg text-text-secondary">Conecte sua conta Google Calendar para visualizar seus eventos.</p>
            <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="mt-4 bg-accent text-white px-6 py-3 rounded-lg shadow hover:brightness-90 transition-all flex items-center mx-auto disabled:opacity-50"
            >
                <CalendarIcon size={20} className="mr-2"/> {isConnecting ? 'Conectando...' : 'Conectar com Google Calendar'}
            </button>
            <p className="text-xs text-text-secondary mt-2">
                A configuração de integração também está disponível em <Link to="/settings" className="text-accent underline">Ajustes</Link>.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center font-semibold text-text-secondary text-sm p-2 border-b border-border-color">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-grow bg-border-color gap-px">
              {calendarGridCells.map(cell => (
                <div key={cell.key} className={`bg-card-bg p-1.5 overflow-hidden ${cell.isPadding ? 'opacity-50' : ''}`}>
                  {!cell.isPadding && (
                    <>
                      <span className={`text-sm font-medium ${cell.isToday ? 'bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-text-secondary'}`}>
                        {cell.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {cell.events?.map(event => <EventPill key={event.id} event={event}/>)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
       <p className="text-xs text-text-secondary mt-4 text-center">
        {settings.googleCalendarConnected 
            ? `Última sincronização: ${settings.googleCalendarLastSync ? new Date(settings.googleCalendarLastSync).toLocaleString('pt-BR') : 'Pendente'}`
            : 'A integração com Google Calendar é uma funcionalidade simulada.'
        }
      </p>
    </div>
  );
};

export default CalendarPage;