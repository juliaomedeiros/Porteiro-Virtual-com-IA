'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, condominiosApi, moradoresApi, areasComunsApi, Condominio, Interacao, Stats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  MessageSquare, 
  Users, 
  AlertTriangle, 
  Cpu,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Building,
  MapPin
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Interacao[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [totalMoradores, setTotalMoradores] = useState(0);
  const [totalAreas, setTotalAreas] = useState(0);
  const [loading, setLoading] = useState(true);
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
      fetchDashboardData(selectedCondominio);
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

  const fetchDashboardData = async (condominioId: string) => {
    try {
      setLoading(true);
      const [statsRes, logsRes, moradoresRes, areasRes] = await Promise.all([
        analyticsApi.getStats(condominioId),
        analyticsApi.getLogs(condominioId, { limit: 10 }),
        moradoresApi.list(condominioId),
        areasComunsApi.list(condominioId)
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data);
      setTotalMoradores(moradoresRes.data.length);
      setTotalAreas(areasRes.data.length);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <span className="text-3xl font-bold text-slate-900 mt-1">
          {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Dashboard de Interações" 
        description="Acompanhe o desempenho e cadastros do Porteiro Virtual em tempo real."
      >
        {isAdmin && (
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            value={selectedCondominio}
            onChange={(e) => setSelectedCondominio(e.target.value)}
          >
            {condominios.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </PageHeader>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
          {isAdmin && (
            <StatCard 
              title="Condomínios" 
              value={condominios.length} 
              icon={Building} 
              color="bg-purple-500"
            />
          )}
          <StatCard 
            title="Moradores" 
            value={totalMoradores} 
            icon={Users} 
            color="bg-emerald-500"
          />
          <StatCard 
            title="Áreas Comuns" 
            value={totalAreas} 
            icon={MapPin} 
            color="bg-amber-500"
          />
          <StatCard 
            title="Interações" 
            value={stats.total_interactions} 
            icon={MessageSquare} 
            color="bg-blue-500"
          />
          <StatCard 
            title="Transbordos" 
            value={stats.escalated_interactions} 
            icon={AlertTriangle} 
            color="bg-red-500"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Interações Recentes</h2>
          <button className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
            Ver tudo <ArrowUpRight size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resposta da IA</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    Nenhuma interação encontrada.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                      {log.user_message}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                      {log.ai_response}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.is_escalated ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-tighter">
                          Transbordado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-tighter">
                          Resolvido
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
