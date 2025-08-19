import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { Client, Job } from '../types';
import { getJobPaymentSummary } from '../utils/jobCalculations';
import { PlusCircleIcon, PencilIcon, TrashIcon, CurrencyDollarIcon, ArrowRightIcon } from '../constants';
import Modal from '../components/Modal';
import ClientForm from './forms/ClientForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/formatters'; 
import { Link } from 'react-router-dom';

interface ClientCardProps {
  client: Client;
  jobs: Job[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  privacyModeEnabled: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, jobs, onEdit, onDelete, privacyModeEnabled }) => {
  const clientJobs = jobs.filter(job => job.clientId === client.id && !job.isDeleted);
  const totalPaidByClient = clientJobs.reduce((sum, job) => sum + getJobPaymentSummary(job).totalPaid, 0);

  return (
    <div className="bg-card-bg rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col border border-border-color">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">{client.name}</h3>
            {client.company && <p className="text-sm text-text-secondary">{client.company}</p>}
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <button onClick={(e) => { e.preventDefault(); onEdit(client); }} className="text-slate-500 hover:text-accent p-1" title="Editar Cliente"><PencilIcon size={18} /></button>
            <button onClick={(e) => { e.preventDefault(); onDelete(client.id); }} className="text-slate-500 hover:text-red-500 p-1" title="Excluir Cliente"><TrashIcon size={18} /></button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-text-secondary"><strong>Email:</strong> {client.email}</p>
          <p className="text-sm text-text-secondary"><strong>Cliente desde:</strong> {formatDate(client.createdAt)}</p>
        </div>
      </div>
      <div className="mt-4 p-6 border-t border-border-color bg-slate-50 rounded-b-xl">
        <div className="flex items-center text-text-primary">
          <CurrencyDollarIcon size={20} />
          <span className="ml-2">Total Pago: {formatCurrency(totalPaidByClient, privacyModeEnabled)}</span>
        </div>
        <p className="text-sm text-text-secondary mt-1">{clientJobs.length} job(s) ativos.</p>
        <div
          className="group mt-3 inline-flex items-center text-accent font-semibold text-sm"
        >
          Ver Histórico Completo <ArrowRightIcon size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};


const ClientsPage: React.FC = () => {
  const { clients, jobs, deleteClient, settings, loading } = useAppData();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  const handleAddClient = () => {
    setEditingClient(undefined);
    setModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    const associatedJobsCount = jobs.filter(job => job.clientId === clientId && !job.isDeleted).length;
    let confirmMessage = 'Tem certeza que deseja excluir este cliente?';
    if (associatedJobsCount > 0) {
      confirmMessage += `\nExistem ${associatedJobsCount} job(s) associados a este cliente. Eles não serão removidos, mas perderão a associação direta pelo nome do cliente.`;
    }

    if (window.confirm(confirmMessage)) {
      deleteClient(clientId);
      toast.success('Cliente excluído com sucesso!');
    }
  };
  
  const handleFormSuccess = () => {
    setModalOpen(false);
    setEditingClient(undefined);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Clientes</h1>
        <button
          onClick={handleAddClient}
          className="bg-accent text-white px-4 py-2 rounded-lg shadow hover:brightness-90 transition-all flex items-center"
        >
          <PlusCircleIcon size={20} /> <span className="ml-2">Adicionar Novo Cliente</span>
        </button>
      </div>

      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.sort((a,b) => a.name.localeCompare(b.name)).map(client => (
            <Link to={`/clients/${client.id}`} key={client.id} className="block hover:scale-[1.02] transition-transform duration-200">
                <ClientCard 
                  client={client} 
                  jobs={jobs} 
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                  privacyModeEnabled={settings.privacyModeEnabled || false}
                />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-text-secondary">Nenhum cliente cadastrado ainda.</p>
          <p className="mt-2 text-text-secondary">Clique em "Adicionar Novo Cliente" para começar.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'} size="lg">
        <ClientForm onSuccess={handleFormSuccess} clientToEdit={editingClient} />
      </Modal>
    </div>
  );
};

export default ClientsPage;