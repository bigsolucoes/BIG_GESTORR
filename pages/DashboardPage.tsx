

import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, JobStatus, Payment } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { PlusCircleIcon, WalletIcon, ClockIcon, CheckCircleIcon, BriefcaseIcon, UsersIcon } from '../constants';
import Modal from '../components/Modal';
import JobForm from './forms/JobForm'; 
import ClientForm from './forms/ClientForm'; 
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

const DashboardPage: React.FC = () => {
  const { jobs, clients, settings, loading } = useAppData();
  const [isJobModalOpen, setJobModalOpen] = React.useState(false);
  const [isClientModalOpen, setClientModalOpen] = React.useState(false);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  const now = new Date();
  const todayStart = new Date(now.setHours(0,0,0,0)); 
  const thirtyDaysAgo = new Date(new Date().setDate(todayStart.getDate() - 30));


  const totalToReceive = jobs
    .filter(job => !job.isDeleted)
    .reduce((sum, job) => sum + getJobPaymentSummary(job).remaining, 0);

  const receivedLast30Days = jobs
    .flatMap(job => job.payments || [])
    .filter(payment => {
        try {
            return new Date(payment.date) >= thirtyDaysAgo;
        } catch (e) { return false; }
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  const jobStatusCounts = jobs.reduce((acc, job) => {
    try {
        if (job.isDeleted || job.status === JobStatus.PAID) return acc;

        const deadlineDate = new Date(job.deadline);
        const isOverdue = !isNaN(deadlineDate.getTime()) && deadlineDate < todayStart && job.status !== JobStatus.FINALIZED;
        
        if (isOverdue) {
          acc.Atrasados = (acc.Atrasados || 0) + 1;
        } else if (job.status === JobStatus.FINALIZED) { 
          acc.AguardandoPagamento = (acc.AguardandoPagamento || 0) + 1;
        } else if (job.status === JobStatus.REVIEW) {
          acc.AguardandoAprovação = (acc.AguardandoAprovação || 0) + 1;
        } else if (job.status === JobStatus.OTHER) {
          acc.Outros = (acc.Outros || 0) + 1;
        }
         else { // BRIEFING, PRODUCTION
          acc.EmAndamento = (acc.EmAndamento || 0) + 1;
        }
    } catch(e) {
        console.warn("Error processing job status for dashboard", job.id, e);
    }
    return acc;
  }, {} as { [key: string]: number });

  const jobStatusData = Object.entries(jobStatusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = {
    EmAndamento: '#94a3b8', // slate-400
    Atrasados: '#ef4444', 
    AguardandoAprovação: '#eab308', 
    AguardandoPagamento: '#f97316',
    Outros: '#a855f7', // purple-500
  };

  const upcomingDeadlines = jobs
    .filter(job => {
        try {
            return job.status !== JobStatus.PAID && !job.isDeleted && new Date(job.deadline) >= todayStart;
        } catch(e) { return false; }
    })
    .sort((a, b) => {
        try {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } catch(e) { return 0; }
    })
    .slice(0, 5);

  const getDaysRemaining = (deadline: string) => {
    try {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return 'Data inválida';
      }
      
      const deadlineDayStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

      if (deadlineDayStart < todayStart) return 'Atrasado';
      if (deadlineDayStart.getTime() === todayStart.getTime()) return 'Hoje';
      
      const diffTime = deadlineDayStart.getTime() - todayStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} dia(s)`;

    } catch (e) {
      console.warn("Error in getDaysRemaining", deadline, e);
      return 'Erro no prazo';
    }
  };
  
  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; isCurrency?: boolean; color?: string }> = 
    ({ title, value, icon, isCurrency = false, color = 'text-accent' }) => (
    <div className="bg-card-bg p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border-color">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary">
            {isCurrency ? formatCurrency(typeof value === 'number' ? value : parseFloat(value.toString()), settings.privacyModeEnabled) : value}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-slate-100 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-text-primary">
                {settings.userName ? `Olá, ${settings.userName}!` : 'Dashboard'}
            </h1>
            {settings.userName && <p className="text-text-secondary">Bem-vindo(a) ao seu painel BIG Soluções.</p>}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setJobModalOpen(true)}
            className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center"
          >
            <PlusCircleIcon size={20} /> <span className="ml-2">Novo Job</span>
          </button>
          <button
            onClick={() => setClientModalOpen(true)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors flex items-center"
          >
            <PlusCircleIcon size={20} /> <span className="ml-2">Novo Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="A Receber" value={totalToReceive} icon={<WalletIcon size={24} />} isCurrency={true} color="text-accent" />
        <StatCard title="Recebido (30 dias)" value={receivedLast30Days} icon={<CheckCircleIcon size={24} />} isCurrency={true} color="text-green-500" />
        <StatCard title="Jobs Ativos" value={jobs.filter(j => j.status !== JobStatus.PAID && !j.isDeleted).length} icon={<BriefcaseIcon size={24} />} color="text-accent" />
        <StatCard title="Total Clientes" value={clients.length} icon={<UsersIcon size={24} />} color="text-accent" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Status dos Jobs Ativos</h2>
          {jobStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie isAnimationActive={true} animationDuration={500} data={jobStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} job(s)`}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-text-secondary">Nenhum job ativo para exibir.</p>}
        </div>

        <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Próximos Prazos</h2>
          {upcomingDeadlines.length > 0 ? (
            <ul className="space-y-3">
              {upcomingDeadlines.map(job => (
                <li key={job.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <button onClick={() => {}} className="block w-full text-left"> 
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-text-primary">{job.name}</span>
                      <span className={`text-sm font-semibold ${new Date(job.deadline) < todayStart && job.status !== JobStatus.PAID && job.status !== JobStatus.FINALIZED ? 'text-red-500' : 'text-accent'}`}>
                        {getDaysRemaining(job.deadline)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{clients.find(c => c.id === job.clientId)?.name || 'Cliente desconhecido'}</p>
                    <p className="text-xs text-text-secondary">Prazo: {formatDate(job.deadline)}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="text-text-secondary">Nenhum prazo iminente.</p>}
        </div>
      </div>


      <Modal isOpen={isJobModalOpen} onClose={() => setJobModalOpen(false)} title="Adicionar Novo Job" size="lg">
        <JobForm onSuccess={() => setJobModalOpen(false)} />
      </Modal>
      <Modal isOpen={isClientModalOpen} onClose={() => setClientModalOpen(false)} title="Adicionar Novo Cliente">
        <ClientForm onSuccess={() => setClientModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default DashboardPage;