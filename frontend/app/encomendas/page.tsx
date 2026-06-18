'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { encomendasApi, Encomenda, condominiosApi, Condominio } from '@/lib/api';
import { Package, Plus, Trash2, CheckCircle, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EncomendasPage() {
  const { user, isAdmin } = useAuth();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondo, setSelectedCondo] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [form, setForm] = useState({
    destinatario: '',
    unidade: '',
    tamanho: 'Pequeno',
    descricao: ''
  });

  useEffect(() => {
    if (isAdmin) {
      condominiosApi.list().then(res => {
        setCondominios(res.data);
        if (res.data.length > 0) setSelectedCondo(res.data[0].id);
      }).catch(console.error);
    } else if (user?.condominioId) {
      setSelectedCondo(user.condominioId);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (selectedCondo) {
      fetchEncomendas();
    }
  }, [selectedCondo]);

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const res = await encomendasApi.list(selectedCondo);
      setEncomendas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondo) return;
    
    try {
      setSending(true);
      await encomendasApi.create({
        ...form,
        condominio_id: selectedCondo
      });
      setForm({ destinatario: '', unidade: '', tamanho: 'Pequeno', descricao: '' });
      fetchEncomendas();
      alert('Encomenda registrada! O morador foi notificado via WhatsApp.');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar encomenda.');
    } finally {
      setSending(false);
    }
  };

  const markAsDelivered = async (id: string) => {
    try {
      await encomendasApi.update(id, { status: 'ENTREGUE' });
      fetchEncomendas();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      await encomendasApi.delete(id);
      fetchEncomendas();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Encomendas</h1>
          <p className="text-slate-500 mt-1">Registre pacotes e notifique os moradores automaticamente.</p>
        </div>
        {isAdmin && (
          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            value={selectedCondo}
            onChange={(e) => setSelectedCondo(e.target.value)}
          >
            {condominios.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-slate-200 h-fit">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Plus size={20} />
              </div>
              <CardTitle className="text-lg">Nova Encomenda</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Unidade/Apto</label>
                <Input 
                  required 
                  placeholder="Ex: 101A"
                  value={form.unidade}
                  onChange={(e) => setForm({...form, unidade: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Destinatário</label>
                <Input 
                  required 
                  placeholder="Nome no pacote"
                  value={form.destinatario}
                  onChange={(e) => setForm({...form, destinatario: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tamanho</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  value={form.tamanho}
                  onChange={(e) => setForm({...form, tamanho: e.target.value})}
                >
                  <option value="Pequeno">Pequeno (Envelope, Caixa pequena)</option>
                  <option value="Médio">Médio (Caixa de sapato)</option>
                  <option value="Grande">Grande (Eletrodoméstico, etc)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Descrição/Obs</label>
                <Textarea 
                  placeholder="Detalhes opcionais..."
                  value={form.descricao}
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  className="resize-none"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={sending || !selectedCondo}>
                {sending ? 'Registrando...' : 'Registrar & Notificar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Package size={20} />
              </div>
              <CardTitle className="text-lg">Pacotes na Portaria</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                ) : encomendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                      <PackageOpen size={48} className="mx-auto mb-3 opacity-20" />
                      Nenhuma encomenda registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  encomendas.map(enc => (
                    <TableRow key={enc.id}>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(enc.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{enc.unidade}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{enc.destinatario}</span>
                          <span className="text-xs text-slate-500">{enc.tamanho}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                          enc.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {enc.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {enc.status === 'PENDENTE' && (
                            <Button variant="ghost" size="icon" title="Marcar como Entregue" onClick={() => markAsDelivered(enc.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                              <CheckCircle size={18} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDelete(enc.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
