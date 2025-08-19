import React, { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { useAppData } from '../hooks/useAppData';
import { DraftNote, ScriptLine, Attachment } from '../types';
import { PlusCircleIcon, TrashIcon, SaveIcon, DraftIcon, PlusIcon, MinusIcon, ClockIcon, PaperclipIcon, XIcon, ImageUpIcon } from '../constants';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import { v4 as uuidv4 } from 'uuid';
import Modal from '../components/Modal';

const DraftsPage: React.FC = () => {
  const { draftNotes, addDraftNote, updateDraftNote, deleteDraftNote, loading: appLoading, draftForDetails, setDraftForDetails } = useAppData();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDraftData, setNewDraftData] = useState({ title: '', type: 'SCRIPT' as 'TEXT' | 'SCRIPT' });
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const selectedDraft = useMemo(() => {
    return draftNotes.find(d => d.id === selectedDraftId) || null;
  }, [selectedDraftId, draftNotes]);

  useEffect(() => {
    if (draftForDetails) {
      const draftToView = draftNotes.find(d => d.id === draftForDetails.id);
      if (draftToView) {
        setSelectedDraftId(draftToView.id);
      }
      setDraftForDetails(null);
    }
  }, [draftForDetails, setDraftForDetails, draftNotes]);

  useEffect(() => {
    if (selectedDraft) {
      setDraftTitle(selectedDraft.title);
      setDraftContent(selectedDraft.content || '');
      setScriptLines(selectedDraft.scriptLines || []);
      setAttachments(selectedDraft.attachments || []);
    } else {
      setDraftTitle('');
      setDraftContent('');
      setScriptLines([]);
      setAttachments([]);
    }
  }, [selectedDraft]);

  const isDirty = () => {
    if (!selectedDraft) return false;
    const originalTitle = selectedDraft.title;
    const originalContent = selectedDraft.content;
    const originalLines = JSON.stringify(selectedDraft.scriptLines);
    const originalAttachments = JSON.stringify(selectedDraft.attachments);

    const currentTitle = draftTitle;
    const currentContent = draftContent;
    const currentLines = JSON.stringify(scriptLines);
    const currentAttachments = JSON.stringify(attachments);

    return originalTitle !== currentTitle || originalContent !== currentContent || originalLines !== currentLines || originalAttachments !== currentAttachments;
  }
  
  const handleSelectDraft = (draft: DraftNote) => {
     if (isDirty()) {
      if (window.confirm("Você tem alterações não salvas. Deseja descartá-las?")) {
        setSelectedDraftId(draft.id);
      }
    } else {
      setSelectedDraftId(draft.id);
    }
  };

  const handleOpenCreateModal = () => {
    setNewDraftData({ title: '', type: 'SCRIPT'});
    setIsCreateModalOpen(true);
  }

  const handleConfirmCreateDraft = () => {
    if (!newDraftData.title.trim()) {
        toast.error("O título é obrigatório.");
        return;
    }
    const newDraft = addDraftNote({ title: newDraftData.title, type: newDraftData.type });
    setSelectedDraftId(newDraft.id);
    setIsCreateModalOpen(false);
  }

  const handleSaveChanges = () => {
    if (!selectedDraft) return;
    if (!draftTitle.trim()) {
      toast.error('O título não pode ficar vazio.');
      return;
    }
    const updatedDraftData: DraftNote = { 
      ...selectedDraft, 
      title: draftTitle, 
      content: draftContent,
      scriptLines: scriptLines,
      attachments: attachments,
    };
    updateDraftNote(updatedDraftData);
    toast.success('Rascunho salvo!');
  };

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este rascunho?')) {
      deleteDraftNote(draftId);
      if (selectedDraftId === draftId) {
        setSelectedDraftId(null);
      }
      toast.success('Rascunho excluído.');
    }
  };
  
  const updateLine = (index: number, field: keyof Omit<ScriptLine, 'id'>, value: string | number) => {
    const newLines = [...scriptLines];
    const line = newLines[index];
    if (field === 'duration') {
        const numValue = Number(value);
        line[field] = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    } else {
        line[field] = value as string;
    }
    setScriptLines(newLines);
  };

  const addLine = (index: number) => {
    const newLines = [...scriptLines];
    const prevLine = newLines[index];
    const newSceneNumber = parseInt(prevLine.scene, 10);
    const newScene = !isNaN(newSceneNumber) ? (newSceneNumber + 1).toString() : '';

    newLines.splice(index + 1, 0, { id: uuidv4(), scene: newScene, description: '', duration: prevLine.duration });
    setScriptLines(newLines);
  };

  const removeLine = (index: number) => {
    if (scriptLines.length <= 1) {
        toast.error("O roteiro deve ter pelo menos uma cena.");
        return;
    }
    const newLines = scriptLines.filter((_, i) => i !== index);
    setScriptLines(newLines);
  };

  const handleAttachmentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('O arquivo é muito grande. Máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAttachment: Attachment = {
          id: uuidv4(),
          name: file.name,
          dataUrl: reader.result as string,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const totalDuration = useMemo(() => {
    return scriptLines.reduce((acc, line) => acc + (line.duration || 0), 0);
  }, [scriptLines]);

  const formatTotalDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }


  if (appLoading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar for Draft List */}
      <div className="w-1/3 min-w-[280px] max-w-[350px] bg-card-bg shadow-lg rounded-xl p-4 flex flex-col border border-border-color">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            <DraftIcon size={22} className="mr-2 text-accent"/> Meus Rascunhos
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="p-2 text-accent hover:bg-slate-100 rounded-full"
            title="Criar Novo Rascunho"
          >
            <PlusCircleIcon size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow space-y-2 pr-1">
          {draftNotes.length === 0 && <p className="text-text-secondary text-sm text-center py-4">Nenhum rascunho ainda.</p>}
          {draftNotes.map(draft => (
            <div
              key={draft.id}
              onClick={() => handleSelectDraft(draft)}
              className={`p-3 rounded-lg cursor-pointer transition-colors
                          ${selectedDraftId === draft.id ? 'bg-accent text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <h3 className={`font-medium truncate ${selectedDraftId === draft.id ? 'text-white' : 'text-text-primary'}`}>{draft.title}</h3>
              <p className={`text-xs truncate ${selectedDraftId === draft.id ? 'text-blue-100' : 'text-text-secondary'}`}>
                {draft.type === 'SCRIPT' ? 'Roteiro' : 'Texto'} • Modificado: {formatDate(draft.updatedAt, {dateStyle: 'short', timeStyle: 'short'})}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-grow bg-card-bg shadow-lg rounded-xl flex flex-col border border-border-color">
        {selectedDraft ? (
          <>
            <div className="flex justify-between items-center p-4 border-b border-border-color">
              <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="text-2xl font-semibold text-text-primary bg-transparent border-b-2 border-transparent focus:border-accent w-full mr-4 outline-none transition-colors"
                  placeholder="Título do Rascunho"
                />
              <div className="flex items-center space-x-2">
                 <button
                    onClick={handleSaveChanges}
                    disabled={!isDirty()}
                    className="p-2 text-green-600 hover:text-green-700 enabled:hover:bg-green-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Salvar Alterações"
                >
                    <SaveIcon size={20} />
                </button>
                 <button
                    onClick={() => handleDeleteDraft(selectedDraft.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                    title="Excluir Rascunho"
                 >
                    <TrashIcon size={20} />
                 </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow p-4">
                {selectedDraft.type === 'SCRIPT' ? (
                     <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr>
                                <th className="p-2 border-b border-border-color text-left text-sm font-medium text-text-secondary w-24">CENA</th>
                                <th className="p-2 border-b border-border-color text-left text-sm font-medium text-text-secondary">DESCRIÇÃO</th>
                                <th className="p-2 border-b border-border-color text-left text-sm font-medium text-text-secondary w-28">DURAÇÃO (s)</th>
                                <th className="p-2 border-b border-border-color text-left text-sm font-medium text-text-secondary w-24">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scriptLines.map((line, index) => (
                                <tr key={line.id} className="group hover:bg-slate-50">
                                    <td className="p-1 border-b border-border-color"><input type="text" value={line.scene} onChange={(e) => updateLine(index, 'scene', e.target.value)} className="w-full bg-transparent p-1 rounded focus:bg-white focus:ring-1 focus:ring-accent outline-none text-text-primary"/></td>
                                    <td className="p-1 border-b border-border-color"><textarea value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="w-full bg-transparent p-1 rounded focus:bg-white focus:ring-1 focus:ring-accent outline-none resize-y min-h-[40px] text-sm text-text-primary" rows={1}/></td>
                                    <td className="p-1 border-b border-border-color"><input type="number" value={line.duration} onChange={(e) => updateLine(index, 'duration', e.target.value)} className="w-full bg-transparent p-1 rounded focus:bg-white focus:ring-1 focus:ring-accent outline-none text-text-primary"/></td>
                                    <td className="p-1 border-b border-border-color text-center">
                                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => addLine(index)} className="p-1 text-green-500 hover:bg-green-100 rounded-full" title="Adicionar Cena Abaixo"><PlusIcon size={18}/></button>
                                            <button onClick={() => removeLine(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full" title="Remover Cena"><MinusIcon size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <textarea 
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="w-full h-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary bg-card-bg outline-none text-sm resize-none"
                        placeholder="Escreva sua anotação aqui..."
                    />
                )}
            </div>

            {/* Attachments Section */}
            <div className="p-4 border-t border-border-color">
                <h3 className="text-base font-semibold text-text-primary mb-2 flex items-center"><PaperclipIcon size={18} className="mr-2"/>Anexos</h3>
                <div className="flex flex-wrap gap-4 items-center">
                    {attachments.map(att => (
                        <div key={att.id} className="relative group w-24 h-24">
                            <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover rounded-md border border-border-color"/>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => removeAttachment(att.id)} className="p-2 bg-red-500 text-white rounded-full" title="Remover Anexo">
                                    <TrashIcon size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => attachmentInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-border-color rounded-md flex flex-col items-center justify-center text-text-secondary hover:bg-slate-50 hover:border-accent hover:text-accent transition-colors"
                        title="Adicionar Anexo"
                    >
                        <ImageUpIcon size={24}/>
                        <span className="text-xs mt-1">Adicionar</span>
                    </button>
                    <input type="file" ref={attachmentInputRef} onChange={handleAttachmentUpload} accept="image/*" className="hidden" />
                </div>
            </div>

            <div className="p-4 border-t border-border-color bg-slate-50 flex justify-between items-center">
                <p className="text-sm text-text-secondary">
                    Criado: {formatDate(selectedDraft.createdAt, {dateStyle: 'short'})} | 
                    Atualizado: {formatDate(selectedDraft.updatedAt, {dateStyle: 'short', timeStyle: 'short'})}
                </p>
                {selectedDraft.type === 'SCRIPT' && (
                    <div className="flex items-center font-semibold bg-accent text-white px-3 py-1.5 rounded-lg">
                        <ClockIcon size={16} className="mr-2"/>
                        <span>TEMPO TOTAL: {formatTotalDuration(totalDuration)}</span>
                    </div>
                )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <DraftIcon size={64} className="text-slate-300 mb-4" />
            <p className="text-xl text-text-secondary">Selecione um rascunho para visualizar ou editar.</p>
            <p className="mt-2 text-text-secondary">Ou crie um novo para começar.</p>
            <button
                onClick={handleOpenCreateModal}
                className="mt-6 bg-accent text-white px-6 py-3 rounded-lg shadow hover:brightness-90 transition-all flex items-center text-lg"
            >
                <PlusCircleIcon size={22} className="mr-2"/> Criar Novo Rascunho
            </button>
          </div>
        )}
      </div>
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Criar Novo Rascunho">
        <div className="space-y-4">
            <div>
                <label htmlFor="draftTitle" className="block text-sm font-medium text-text-secondary mb-1">Título</label>
                <input
                    type="text"
                    id="draftTitle"
                    value={newDraftData.title}
                    onChange={(e) => setNewDraftData(prev => ({ ...prev, title: e.target.value}))}
                    className="w-full p-2 border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:border-accent text-text-primary outline-none transition-shadow bg-card-bg"
                    placeholder="Título do seu rascunho..."
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-text-secondary mb-1">Tipo de Rascunho</label>
                 <div className="flex space-x-2">
                     <button
                        onClick={() => setNewDraftData(prev => ({...prev, type: 'SCRIPT'}))}
                        className={`flex-1 p-3 border rounded-md text-left ${newDraftData.type === 'SCRIPT' ? 'border-accent ring-2 ring-accent' : 'border-border-color'}`}
                     >
                        <h4 className="font-semibold text-text-primary">Roteiro</h4>
                        <p className="text-xs text-text-secondary">Estrutura com cenas, descrições e duração.</p>
                     </button>
                     <button
                        onClick={() => setNewDraftData(prev => ({...prev, type: 'TEXT'}))}
                        className={`flex-1 p-3 border rounded-md text-left ${newDraftData.type === 'TEXT' ? 'border-accent ring-2 ring-accent' : 'border-border-color'}`}
                    >
                        <h4 className="font-semibold text-text-primary">Texto Simples</h4>
                        <p className="text-xs text-text-secondary">Uma nota de texto livre para ideias e anotações.</p>
                     </button>
                 </div>
            </div>
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleConfirmCreateDraft}
                    className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:brightness-90 transition-all"
                >
                    Criar Rascunho
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default DraftsPage;