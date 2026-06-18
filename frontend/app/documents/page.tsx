'use client';

import { useEffect, useState } from 'react';
import { documentosApi, condominiosApi, Condominio, Documento } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  FileText, 
  Upload, 
  Trash2, 
  FileUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  useEffect(() => {
    if (user && !isAdmin && user.condominioId) {
      setSelectedCondominio(user.condominioId);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedCondominio) {
      fetchDocuments(selectedCondominio);
    }
  }, [selectedCondominio]);

  const fetchCondominios = async () => {
    try {
      const response = await condominiosApi.list();
      setCondominios(response.data);
      if (!selectedCondominio && response.data.length > 0) {
        if (user && !isAdmin && user.condominioId) {
          setSelectedCondominio(user.condominioId);
        } else {
          setSelectedCondominio(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching condominios:', err);
      setError('Falha ao carregar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (condominioId: string) => {
    try {
      setLoading(true);
      const response = await documentosApi.list(condominioId);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Falha ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !selectedCondominio) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, envie um arquivo PDF.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await documentosApi.upload(selectedCondominio, file);
      fetchDocuments(selectedCondominio);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.detail || 'Falha ao enviar documento.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja excluir este documento? Todos os vetores de IA associados serão removidos.')) return;

    try {
      await documentosApi.delete(id);
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Falha ao excluir documento.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INDEXADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> INDEXADO
          </span>
        );
      case 'PROCESSANDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
            <Clock size={12} /> PROCESSANDO
          </span>
        );
      case 'ERRO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <AlertCircle size={12} /> ERRO
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Documentos & RAG" 
        description="Gerencie os documentos que alimentam a Inteligência Artificial do condomínio."
      >
        <div className="flex items-center gap-3">
          {isAdmin && (
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all shadow-sm"
              value={selectedCondominio}
              onChange={(e) => setSelectedCondominio(e.target.value)}
            >
              {condominios.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          
          {isAdmin && (
            <label className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer">
              {uploading ? <Clock className="animate-spin" size={18} /> : <FileUp size={18} />}
              <span>{uploading ? 'Enviando...' : 'Upload PDF'}</span>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </PageHeader>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                    {isAdmin && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && documents.length === 0 ? (
                    [1, 2].map(i => (
                      <tr key={i} className="animate-pulse h-16 bg-slate-50/30" />
                    ))
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} className="px-6 py-20 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Nenhum documento encontrado.</p>
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-slate-400" />
                            {doc.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div>{getStatusBadge(doc.status)}</div>
                            {doc.status === 'ERRO' && doc.error_message && (
                              <span className="text-xs text-red-600 max-w-xs truncate" title={doc.error_message}>
                                {doc.error_message}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDelete(doc.id)} 
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
              <Info size={20} className="text-primary" />
              <h3>O que é RAG?</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              <strong>Retrieval-Augmented Generation</strong> permite que a IA responda dúvidas baseada exclusivamente nos documentos oficiais que você envia.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Upload', desc: 'Envie o PDF (Regimento, Atas, Comunicados).' },
                { label: 'Processamento', desc: 'Extraímos o texto e geramos vetores matemáticos.' },
                { label: 'Indexação', desc: 'A IA agora "conhece" o conteúdo do documento.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-primary text-xs flex items-center justify-center font-bold border border-blue-100">
                    {i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{step.label}</span>
                    <span className="text-xs text-slate-500">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110">
              <HelpCircle size={120} />
            </div>
            <h4 className="font-bold mb-2">Dica de Especialista</h4>
            <p className="text-blue-100 text-sm leading-relaxed">
              Documentos com texto claro (não digitalizados como imagem) processam mais rápido e geram respostas mais precisas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
