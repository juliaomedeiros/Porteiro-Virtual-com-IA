'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, condominiosApi, moradoresApi, areasComunsApi, inboxApi, Condominio, InboxItem, Stats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  MessageSquare, Users, AlertTriangle, Building, MapPin, Search, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<InboxItem | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [totalMoradores, setTotalMoradores] = useState(0);
  const [totalAreas, setTotalAreas] = useState(0);
  const [loading, setLoading] = useState(true);

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
      fetchDashboardData(selectedCondominio);
    }
  }, [selectedCondominio]);

  const fetchCondominios = async () => {
    try {
      const response = await condominiosApi.list();
      setCondominios(response.data);
      if (!selectedCondominio && response.data.length > 0) {
        setSelectedCondominio(user?.condominioId || response.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (condominioId: string) => {
    try {
      setLoading(true);
      const [statsRes, inboxRes, moradoresRes, areasRes] = await Promise.all([
        analyticsApi.getStats(condominioId),
        inboxApi.list(condominioId),
        moradoresApi.list(condominioId),
        areasComunsApi.list(condominioId)
      ]);
      setStats(statsRes.data);
      setInbox(inboxRes.data);
      if (inboxRes.data.length > 0) setSelectedChat(inboxRes.data[0]);
      setTotalMoradores(moradoresRes.data.length);
      setTotalAreas(areasRes.data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedChat) return;
    try {
      await inboxApi.reply(selectedChat.morador.id, replyMessage);
      setReplyMessage('');
      fetchDashboardData(selectedCondominio); // reload to see new messages
    } catch (error) {
      console.error('Failed to reply', error);
      alert('Erro ao enviar mensagem.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <PageHeader title="Dashboard & Inbox" description="Visão geral e atendimento humano via WhatsApp.">
        {isAdmin && (
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20"
            value={selectedCondominio}
            onChange={(e) => setSelectedCondominio(e.target.value)}
          >
            {condominios.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </PageHeader>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Moradores" value={totalMoradores} icon={Users} color="bg-emerald-500" />
          <StatCard title="Áreas Comuns" value={totalAreas} icon={MapPin} color="bg-amber-500" />
          <StatCard title="Interações Totais" value={stats.total_interactions} icon={MessageSquare} color="bg-blue-500" />
          <StatCard title="Transbordos" value={stats.escalated_interactions} icon={AlertTriangle} color="bg-red-500" />
        </div>
      )}

      {/* INBOX UI */}
      <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px]">
        
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Conversas Ativas</h3>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar morador..." className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">Nenhuma conversa ativa.</div>
            ) : (
              inbox.map((item) => (
                <div 
                  key={item.morador.id}
                  onClick={() => setSelectedChat(item)}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat?.morador.id === item.morador.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-slate-900">{item.morador.name}</span>
                    <span className="text-xs text-slate-500">{item.morador.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-2">
                    {item.interacoes[item.interacoes.length - 1]?.user_message || 'Nova conversa'}
                  </div>
                  {item.morador.status_bot === 'PAUSADO' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                      AGUARDANDO ATENDIMENTO
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="w-2/3 flex flex-col bg-slate-50">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.morador.name} (Apto {selectedChat.morador.unit})</h3>
                  <span className="text-xs text-slate-500">{selectedChat.morador.phone}</span>
                </div>
                {selectedChat.morador.status_bot === 'PAUSADO' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Atendimento Humano</span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Bot Ativo</span>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedChat.interacoes.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    {/* User message */}
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-slate-400 mb-1 ml-1">{new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm shadow-sm">
                        {msg.user_message}
                      </div>
                    </div>
                    {/* Bot/Syndic message */}
                    <div className="flex flex-col items-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm shadow-sm whitespace-pre-wrap">
                        {msg.ai_response}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                  <Input 
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Digite sua resposta e retome o atendimento..."
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                  />
                  <Button onClick={handleReply} className="bg-blue-600 hover:bg-blue-700">
                    <Send size={18} className="mr-2" />
                    Enviar
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  * Ao responder, o status do morador voltará para <b>Bot Ativo</b> automaticamente.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Selecione uma conversa para visualizar e responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
