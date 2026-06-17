'use client';

import { useEffect, useState } from 'react';
import { areasComunsApi, AreaComum, condominiosApi, Condominio } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AreasComunsList() {
  const { user, isAdmin } = useAuth();
  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AreaComum>>({ name: '', description: '', max_capacity: 10 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [condominios, setCondominios] = useState<Condominio[]>([]);

  useEffect(() => {
    if (user) {
      fetchAreas();
      if (isAdmin) {
        fetchCondominios();
      }
    }
  }, [user, isAdmin]);

  const fetchCondominios = async () => {
    try {
      const response = await condominiosApi.list();
      setCondominios(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, condominio_id: response.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching condominios:', err);
    }
  };

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const condominioId = isAdmin ? undefined : user?.condominioId;
      const response = await areasComunsApi.list(condominioId);
      setAreas(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching areas comuns:', err);
      setError('Falha ao carregar áreas comuns.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Deseja realmente excluir esta área comum?')) return;
    
    try {
      await areasComunsApi.delete(id);
      setAreas(areas.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting area:', err);
      alert('Falha ao excluir área.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        condominio_id: isAdmin ? (formData.condominio_id || user?.condominioId) : user?.condominioId
      };
      const response = await areasComunsApi.create(payload);
      setAreas([...areas, response.data]);
      setIsOpen(false);
      setFormData({ name: '', description: '', max_capacity: 10 });
    } catch (err) {
      console.error('Error creating area:', err);
      alert('Erro ao criar área comum.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Áreas Comuns</h1>
          <p className="text-slate-500 mt-1">Espaços disponíveis para reserva e lazer no condomínio.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger render={<Button className="gap-2 bg-blue-600 hover:bg-blue-700" />}>
              <Plus size={18} />
              Nova Área
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Área Comum</DialogTitle>
                <DialogDescription>
                  Cadastre um novo espaço de lazer no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Espaço</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Salão de Festas" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    value={formData.description || ''} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição breve do local" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Capacidade Máxima</Label>
                  <Input 
                    id="max_capacity" 
                    type="number"
                    required 
                    value={formData.max_capacity || ''} 
                    onChange={e => setFormData({...formData, max_capacity: parseInt(e.target.value)})}
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="condominio_id">Condomínio</Label>
                    <select 
                      id="condominio_id" 
                      required 
                      value={formData.condominio_id || ''} 
                      onChange={e => setFormData({...formData, condominio_id: e.target.value})}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione um condomínio</option>
                      {condominios.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Área'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-slate-100" />
            </Card>
          ))
        ) : areas.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-20 text-center text-slate-400">
            <MapPin size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhuma área comum cadastrada.</p>
          </div>
        ) : (
          areas.map((area) => (
            <Card key={area.id} className="overflow-hidden hover:shadow-md transition-all group">
              <div className="h-2 bg-blue-600/10 group-hover:bg-blue-600 transition-colors" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <MapPin size={20} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(area.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1">{area.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{area.description || 'Sem descrição cadastrada.'}</p>
                
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Users size={14} className="text-slate-400" />
                    Capacidade: <span className="text-slate-900">{area.max_capacity || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Calendar size={14} className="text-slate-400" />
                    Reservável
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
