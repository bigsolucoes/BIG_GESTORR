
import React from 'react';
import { useAppData } from '../hooks/useAppData';
import { Job, JobStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArchiveIcon as PageIcon, TrashIcon } from '../constants';
import { RotateCcw as RestoreIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ArchivePage: React.FC = () => {
  const { jobs, clients, settings, loading, deleteJob, updateJob } = useAppData();

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  const archivedJobs = jobs
    .filter(job => job.status === JobStatus.PAID && !job.isDeleted)
    .sort((a, b) => {
        try { // Sort by last payment date, most recent first
            const paymentTimestampsA = a.payments.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
            const paymentTimestampsB = b.payments.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
            const lastPaymentA = paymentTimestampsA.length > 0 ? Math.max(...paymentTimestampsA) : 0;
            const lastPaymentB = paymentTimestampsB.length > 0 ? Math.max(...paymentTimestampsB) : 0;
            return lastPaymentB - lastPaymentA;
        } catch { return 0; }
    });

  const handleDeleteFromArchive = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && window.confirm(`Tem certeza que deseja mover o job arquivado "${job.name}" para a lixeira? Ele poderá ser restaurado a partir de lá.`)) {
        deleteJob(job.id);
        toast.success('Job movido para a lixeira!');
    }
  };

  const handleUnarchive = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && window.confirm(`Tem certeza que deseja desarquivar o job "${job.name}"? Ele voltará para a coluna "Finalizado".`)) {
      updateJob({ ...job, status: JobStatus.FINALIZED });
      toast.success('Job desarquivado com sucesso!');
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <PageIcon size={32} className="text-accent mr-3" />
        <h1 className="text-3xl font-bold text-text-primary">Arquivo Morto</h1>
      </div>
      
      <p className="text-text-secondary mb-6">
        Esta seção lista todos os jobs que foram concluídos e cujo status foi definido como "Pago".
      </p>

      {archivedJobs.length === 0 ? (
        <div className="text-center py-10 bg-card-bg rounded-xl shadow border border-border-color">
          <PageIcon size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-xl text-text-secondary">Nenhum job arquivado ainda.</p>
          <p className="mt-2 text-text-secondary">Jobs com status "Pago" aparecerão aqui.</p>
        </div>
      ) : (
        <div className="bg-card-bg shadow-lg rounded-xl overflow-hidden border border-border-color">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nome do Job</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Valor Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Data Último Pag.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Tipo Serviço</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-card-bg divide-y divide-border-color">
                {archivedJobs.map((job) => {
                  const client = clients.find(c => c.id === job.clientId);
                  
                  const paymentTimestamps = job.payments
                    .map(p => new Date(p.date).getTime())
                    .filter(t => !isNaN(t));

                  let lastPaymentDate: string | undefined;
                  if (paymentTimestamps.length > 0) {
                      lastPaymentDate = new Date(Math.max(...paymentTimestamps)).toISOString();
                  }

                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{job.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{client?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {formatCurrency(job.value, settings.privacyModeEnabled)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {formatDate(lastPaymentDate, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{job.serviceType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleUnarchive(job.id)}
                            className="text-slate-500 hover:text-blue-500 p-1"
                            title="Desarquivar Job"
                          >
                            <RestoreIcon size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteFromArchive(job.id)}
                            className="text-slate-500 hover:text-red-500 p-1"
                            title="Mover para Lixeira"
                          >
                            <TrashIcon size={18} />
                          </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;