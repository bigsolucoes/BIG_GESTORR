
import React, { useState, useEffect } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Client } from '../../types';
import toast from 'react-hot-toast';

interface ClientFormProps {
  onSuccess: () => void;
  clientToEdit?: Client;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, clientToEdit }) => {
  const { addClient, updateClient } = useAppData();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setCompany(clientToEdit.company || '');
      setEmail(clientToEdit.email);
      setPhone(clientToEdit.phone || '');
      setCpf(clientToEdit.cpf || '');
      setObservations(clientToEdit.observations || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setCpf('');
      setObservations('');
    }
  }, [clientToEdit]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.substring(0, 11); // CPF max length 11
    
    // Apply mask: 000.000.000-00
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Nome e Email são obrigatórios.');
      return;
    }
    // Basic CPF validation (length after removing mask)
    const rawCpf = cpf.replace(/\D/g, '');
    if (cpf && rawCpf.length !== 11) {
        toast.error('CPF inválido. Deve conter 11 dígitos.');
        return;
    }


    const clientData = {
      name,
      company: company || undefined,
      email,
      phone: phone || undefined,
      cpf: cpf || undefined,
      observations: observations || undefined,
    };

    if (clientToEdit) {
      updateClient({ ...clientToEdit, ...clientData });
      toast.success('Cliente atualizado com sucesso!');
    } else {
      // For addClient, ensure all potential fields from clientData are passed correctly.
      // The addClient in useAppData expects Omit<Client, 'id' | 'createdAt'>, 
      // so clientData matches this structure if we consider cpf and observations optional.
      addClient(clientData);
      toast.success('Cliente adicionado com sucesso!');
    }
    onSuccess();
  };
  
  const commonInputClass = "w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-custom-brown focus:border-custom-brown text-text-primary outline-none transition-shadow bg-card-bg";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-text-secondary mb-1">Nome <span className="text-red-500">*</span></label>
        <input type="text" id="clientName" value={name} onChange={(e) => setName(e.target.value)} className={commonInputClass} required />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-1">Empresa (Opcional)</label>
        <input type="text" id="company" value={company} onChange={(e) => setCompany(e.target.value)} className={commonInputClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email <span className="text-red-500">*</span></label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClass} required />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Telefone (Opcional)</label>
        <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={commonInputClass} />
      </div>
      <div>
        <label htmlFor="cpf" className="block text-sm font-medium text-text-secondary mb-1">CPF (Opcional)</label>
        <input 
          type="text" 
          id="cpf" 
          value={cpf} 
          onChange={handleCpfChange} 
          className={commonInputClass} 
          placeholder="000.000.000-00"
          maxLength={14} // Length with mask
        />
      </div>
      <div>
        <label htmlFor="observations" className="block text-sm font-medium text-text-secondary mb-1">Observações (Opcional)</label>
        <textarea 
          id="observations" 
          value={observations} 
          onChange={(e) => setObservations(e.target.value)} 
          rows={3} 
          className={commonInputClass} 
          placeholder="Preferências, histórico, etc."
        />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all">
          {clientToEdit ? 'Salvar Alterações' : 'Adicionar Cliente'}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;