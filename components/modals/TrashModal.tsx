
import React from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Job, Client } from '../../types';
import { TrashIcon as PermanentlyDeleteIcon, RotateCcw } from 'lucide-react'; // Using RotateCcw for restore
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface TrashModalProps {
  onClose: () => void;
}

const TrashModal: React.FC<TrashModalProps> = ({ onClose }) => {
  const { jobs, clients, updateJob, permanentlyDeleteJob, settings } = useAppData();

  const deletedJobs = jobs.filter(job => job.isDeleted);

  const handleRestoreJob = (jobId: string) => {
    const jobToRestore = jobs.find(j => j.id === jobId);
    if (jobToRestore) {
      updateJob({ ...jobToRestore, isDeleted: false });
      toast.success(`Job "${jobToRestore.name}" restaurado!`);
    }
  };

  const handlePermanentlyDeleteJob = (jobId: string) => {
    const jobToDelete = jobs.find(j => j.id === jobId);
    if (jobToDelete && window.confirm(`Tem certeza que deseja excluir permanentemente o job "${jobToDelete.name}"? Esta ação não pode ser desfeita.`)) {
      permanentlyDeleteJob(jobId);
      toast.success(`Job "${jobToDelete.name}" excluído permanentemente.`);
    }
  };

  return (
    <div className="max-h-[70vh] flex flex-col">
      {deletedJobs.length === 0 ? (
        <p className="text-text-secondary text-center py-8">A lixeira está vazia.</p>
      ) : (
        <div className="overflow-y-auto flex-grow">
          <ul className="space-y-3">
            {deletedJobs.map(job => {
              const client = clients.find(c => c.id === job.clientId);
              return (
                <li key={job.id} className="p-4 bg-slate-100 rounded-lg shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">{job.name}</h4>
                    <p className="text-xs text-text-secondary">Cliente: {client?.name || 'N/A'}</p>
                    <p className="text-xs text-text-secondary">Valor: {formatCurrency(job.value, settings.privacyModeEnabled)}</p>
                    <p className="text-xs text-text-secondary">Prazo: {formatDate(job.deadline)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRestoreJob(job.id)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-100 transition-colors"
                      title="Restaurar Job"
                    >
                      <RotateCcw size={20} />
                    </button>
                    <button
                      onClick={() => handlePermanentlyDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                      title="Excluir Permanentemente"
                    >
                      <PermanentlyDeleteIcon size={20} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-border-color flex justify-end">
        <button
          onClick={onClose}
          className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg shadow transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default TrashModal;