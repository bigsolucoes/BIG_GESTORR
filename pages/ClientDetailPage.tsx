import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeftIcon, UsersIcon, WalletIcon, BriefcaseIcon, CheckCircleIcon, ClockIcon } from '../constants';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Job, JobStatus } from '../types';

const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, jobs, loading, settings, setJobForDetails } = useAppData();

  const client = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);
  
  const clientJobs = useMemo(() => 
    jobs.filter(j => j.clientId === clientId && !j.isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  , [jobs, clientId]);

  const financialSummary = useMemo(() => {
    return clientJobs.reduce((acc, job) => {
      const { totalPaid, remaining } = getJobPaymentSummary(job);
      acc.totalBilled += job.value;
      acc.totalPaid += totalPaid;
      acc.totalRemaining += remaining;
      return acc;
    }, { totalBilled: 0, totalPaid: 0, totalRemaining: 0 });
  }, [clientJobs]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  if (!client) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-500">Cliente não encontrado</h2>
        <Link to="/clients" className="text-accent hover:underline mt-4 inline-block">Voltar para a lista de clientes</Link>
      </div>
    );
  }

  const handleJobClick = (job: Job) => {
    setJobForDetails(job);
    navigate('/jobs');
  };

  const getStatusIndicator = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PAID:
        return <span title="Pago"><CheckCircleIcon size={16} className="text-green-500"/></span>;
      default:
        return <span title="Em andamento"><ClockIcon size={16} className="text-slate-500"/></span>;
    }
  };


  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center text-sm font-semibold text-accent hover:underline">
        <ChevronLeftIcon size={18} className="mr-1" />
        Voltar para todos os clientes
      </button>

      {/* Header */}
      <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center">
              <UsersIcon size={28} className="mr-3 text-accent" /> {client.name}
            </h1>
            {client.company && <p className="text-text-secondary mt-1">{client.company}</p>}
          </div>
          <div className="text-sm text-text-secondary md:text-right">
            <p><strong>Email:</strong> {client.email}</p>
            {client.phone && <p><strong>Telefone:</strong> {client.phone}</p>}
            <p><strong>Cliente desde:</strong> {formatDate(client.createdAt)}</p>
          </div>
        </div>
        {client.observations && (
            <div className="mt-4 pt-4 border-t border-border-color">
                 <p className="text-sm font-medium text-text-secondary">Observações:</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{client.observations}</p>
            </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
          <WalletIcon size={22} className="mr-2 text-accent" /> Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-text-secondary">Total Faturado</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(financialSummary.totalBilled, settings.privacyModeEnabled)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Pago</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalPaid, settings.privacyModeEnabled)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Saldo Devedor</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalRemaining, settings.privacyModeEnabled)}</p>
          </div>
        </div>
      </div>

      {/* Jobs History */}
      <div className="bg-card-bg p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
          <BriefcaseIcon size={22} className="mr-2 text-accent" /> Histórico de Jobs ({clientJobs.length})
        </h2>
        <div className="max-h-[60vh] overflow-y-auto">
          {clientJobs.length > 0 ? (
            <ul className="divide-y divide-border-color">
              {clientJobs.map(job => (
                <li key={job.id}>
                  <button onClick={() => handleJobClick(job)} className="w-full text-left p-4 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-text-primary">{job.name}</p>
                        <p className="text-sm text-text-secondary">{job.serviceType} • Prazo: {formatDate(job.deadline)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-semibold">{formatCurrency(job.value, settings.privacyModeEnabled)}</span>
                        {getStatusIndicator(job.status)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-center py-4">Nenhum job encontrado para este cliente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;