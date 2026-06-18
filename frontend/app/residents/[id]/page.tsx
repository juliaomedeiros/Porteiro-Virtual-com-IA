'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moradoresApi, condominiosApi, Condominio, MoradorCreate, Morador } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, UserX, AlertTriangle, Save } from 'lucide-react';

export default function EditResident({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, isAdmin } = useAuth();
  
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalMorador, setOriginalMorador] = useState<Morador | null>(null);
  
  const [formData, setFormData] = useState<MoradorCreate & { is_active: boolean }>({
    name: '',
    phone: '',
    cpf: '',
    unit: '',
    condominio_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [id, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [residentRes, condominiosRes] = await Promise.all([
        moradoresApi.get(id),
        isAdmin ? condominiosApi.list() : Promise.resolve({ data: [] })
      ]);
      
      const resident = residentRes.data;
      setOriginalMorador(resident);
      setFormData({
        name: resident.name,
        phone: resident.phone,
        cpf: resident.cpf || '',
        unit: resident.unit,
        condominio_id: resident.condominio_id,
        is_active: resident.is_active
      });
      if (isAdmin) setCondominios(condominiosRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Falha ao carregar os dados do morador.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await moradoresApi.update(id, formData);
      router.push('/residents');
    } catch (err: any) {
      console.error('Error updating resident:', err);
      setError(err.response?.data?.detail || 'Erro ao atualizar morador. Verifique os dados fornecidos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('⚠️ Esta ação vai desativar o morador no sistema, revogando o acesso dele ao bot. Tem certeza que ocorreu uma mudança/troca de aluguel?')) return;
    
    setSubmitting(true);
    try {
      await moradoresApi.update(id, { is_active: false });
      alert('Morador desativado com sucesso. Você já pode registrar o novo inquilino na mesma unidade.');
      router.push('/residents');
    } catch (err) {
      console.error(err);
      setError('Erro ao desativar morador.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 animate-pulse text-center">Carregando dados do morador...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/residents" />} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Editar Morador</h1>
          <p className="text-slate-500 mt-1">Atualize as informações ou gerencie a rotatividade da unidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Dados do Morador
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                  {error}
                </div>
              )}

              <form id="edit-resident-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de WhatsApp</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF (Opcional)</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade / Apartamento</Label>
                    <Input
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="condominio_id">Condomínio</Label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        id="condominio_id"
                        name="condominio_id"
                        value={formData.condominio_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>Selecione um condomínio</option>
                        {condominios.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end gap-3 pt-6">
              <Button variant="outline" render={<Link href="/residents" />} disabled={submitting}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="edit-resident-form" 
                className="bg-blue-600 hover:bg-blue-700" 
                disabled={submitting}
              >
                <Save size={16} className="mr-2" />
                {submitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-red-100 bg-red-50/30">
            <CardHeader className="pb-3 border-b border-red-100/50">
              <CardTitle className="flex items-center gap-2 text-red-700 text-base">
                <AlertTriangle size={18} />
                Rotatividade (Mudança)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Se o morador mudou de unidade ou não faz mais parte do condomínio, desative o acesso dele.
              </p>
              <div className="p-3 bg-white rounded-lg border border-red-100 shadow-sm text-xs text-slate-500">
                O morador será impedido de usar o assistente via WhatsApp imediatamente.
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleDeactivate}
                disabled={submitting || !formData.is_active}
              >
                <UserX size={16} className="mr-2" />
                {formData.is_active ? 'Desativar Morador Atual' : 'Morador Inativo'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
