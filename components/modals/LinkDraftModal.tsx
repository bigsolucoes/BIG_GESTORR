import React, { useState } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { DraftNote } from '../../types';
import Modal from '../Modal';
import toast from 'react-hot-toast';

interface LinkDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (draftIds: string[]) => void;
  currentlyLinkedIds: string[];
}

const LinkDraftModal: React.FC<LinkDraftModalProps> = ({ isOpen, onClose, onLink, currentlyLinkedIds }) => {
  const { draftNotes } = useAppData();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentlyLinkedIds));

  const handleToggleSelection = (draftId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(draftId)) {
        newSet.delete(draftId);
      } else {
        newSet.add(draftId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = () => {
    onLink(Array.from(selectedIds));
    toast.success("Roteiros vinculados foram atualizados!");
    onClose();
  };
  
  const availableDrafts = draftNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vincular Roteiros ao Job" size="lg">
      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2 border border-border-color p-2 rounded-lg">
          {availableDrafts.length > 0 ? availableDrafts.map(draft => (
            <div
              key={draft.id}
              onClick={() => handleToggleSelection(draft.id)}
              className="flex items-center p-3 rounded-lg cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(draft.id)}
                readOnly
                className="h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
              />
              <div className="ml-3">
                <p className="font-medium text-text-primary">{draft.title}</p>
                <p className="text-xs text-text-secondary">{draft.type === 'SCRIPT' ? 'Roteiro' : 'Texto'}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-text-secondary py-4">Nenhum rascunho de roteiro disponível para vincular.</p>
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-border-color">
          <button
            onClick={handleSaveChanges}
            className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all"
          >
            Salvar Vínculos
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkDraftModal;
