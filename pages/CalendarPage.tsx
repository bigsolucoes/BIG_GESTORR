import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../constants';

const CalendarPage: React.FC = () => {
  const { jobs, setJobForDetails } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
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

  const activeJobs = useMemo(() => jobs.filter(job => !job.isDeleted), [jobs]);

  const calendarGridCells = useMemo(() => {
    const cells = [];
    // Padding for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ key: `pad-${i}`, isPadding: true, day: 0, events: [] });
    }
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, currentDate.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const dayEvents = activeJobs.filter(job => {
        try {
            const deadline = new Date(job.deadline);
            return deadline >= date && deadline < nextDay;
        } catch(e) { return false; }
      });

      const today = new Date();
      const isToday = day === today.getDate() && 
                      currentDate.getMonth() === today.getMonth() &&
                      year === today.getFullYear();

      cells.push({ key: `day-${day}`, day, isToday, events: dayEvents, isPadding: false });
    }
    return cells;
  }, [firstDayOfMonth, daysInMonth, year, currentDate, activeJobs]);
  
  const handleEventClick = (job: Job) => {
    setJobForDetails(job);
    navigate('/jobs');
  };

  const EventPill: React.FC<{ job: Job }> = ({ job }) => (
    <button 
      onClick={() => handleEventClick(job)}
      className="w-full text-left bg-accent text-white px-1.5 py-0.5 text-xs rounded-sm mb-1 truncate hover:brightness-125 transition-all"
      title={`Entrega: ${job.name} (Clique para ver detalhes)`}
    >
      {job.name}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
            <CalendarIcon size={32} className="text-accent mr-3" />
            <h1 className="text-3xl font-bold text-text-primary">Calendário de Entregas</h1>
        </div>
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
             <button onClick={() => navigateDate('today')} className="ml-4 px-3 py-1.5 text-sm font-semibold border border-border-color rounded-md hover:bg-slate-100 transition-colors">
              Hoje
            </button>
          </div>
        </header>
        
        <>
            <div className="grid grid-cols-7 text-center font-semibold text-text-secondary text-sm p-2 border-b border-border-color">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-grow bg-slate-200 gap-px">
              {calendarGridCells.map(cell => (
                <div key={cell.key} className={`bg-card-bg p-1.5 overflow-hidden ${cell.isPadding ? 'opacity-50' : ''}`}>
                  {!cell.isPadding && (
                    <>
                      <span className={`text-sm font-medium ${cell.isToday ? 'bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-text-secondary'}`}>
                        {cell.day}
                      </span>
                      <div className="mt-1 space-y-0.5 max-h-[90px] overflow-y-auto">
                        {cell.events?.map(job => <EventPill key={job.id} job={job}/>)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
      </div>
    </div>
  );
};

export default CalendarPage;