"use client";

import { useEffect, useState } from 'react';
import api, { condominiosApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UsuariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isSindico = user?.role === 'SINDICO';

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [condominios, setCondominios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: isAdmin ? 'SINDICO' : 'PORTEIRO',
    phone: '',
    condominio_id: '' // Para vincular inicialmente
  });

  useEffect(() => {
    fetchUsuarios();
    fetchCondominios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/usuarios/');
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCondominios = async () => {
    try {
      const res = await condominiosApi.list();
      setCondominios(res.data);
      if (res.data.length > 0) {
        setFormData(f => ({ ...f, condominio_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user
      const userRes = await api.post('/usuarios/', formData);
      const newUser = userRes.data;

      // Link to condominio if selected
      if (formData.condominio_id) {
        await api.post(`/usuarios/${newUser.id}/condominios/${formData.condominio_id}`);
      }
      
      setIsOpen(false);
      fetchUsuarios();
      setFormData({
        name: '', email: '', password: '', role: isAdmin ? 'SINDICO' : 'PORTEIRO', phone: '', condominio_id: formData.condominio_id
      });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Erro ao criar usuário');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Equipe</h1>
          <p className="text-slate-500 mt-1">Gerencie os síndicos e porteiros do sistema.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={18} className="mr-2" />
              Novo Usuário
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>E-mail (Login)</Label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Senha Temporária</Label>
                <Input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Papel (Role)</Label>
                <select 
                  required 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                >
                  {isAdmin && <option value="SINDICO">Síndico</option>}
                  <option value="PORTEIRO">Porteiro</option>
                  {isAdmin && <option value="ADMIN">Admin</option>}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Vincular Condomínio Inicial</Label>
                <select 
                  required 
                  value={formData.condominio_id} 
                  onChange={e => setFormData({...formData, condominio_id: e.target.value})}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Nenhum (selecione)</option>
                  {condominios.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full bg-blue-600">Criar Usuário</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <ShieldCheck size={48} className="text-slate-300" />
              <p>Nenhum usuário cadastrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                  <th className="px-6 py-4 font-semibold">Papel</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="text-emerald-600 font-medium text-xs">ATIVO</span>
                      ) : (
                        <span className="text-red-600 font-medium text-xs">INATIVO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
