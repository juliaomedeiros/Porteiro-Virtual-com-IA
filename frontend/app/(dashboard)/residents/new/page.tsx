'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moradoresApi, condominiosApi, Condominio, MoradorCreate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function NewResident() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MoradorCreate>({
    name: '',
    phone: '',
    cpf: '',
    unit: '',
    condominio_id: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCondominios();
    } else if (user?.condominioId) {
      setFormData(prev => ({ ...prev, condominio_id: user.condominioId! }));
      setLoading(false);
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
      setError('Falha ao carregar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'unit') {
      newValue = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let formattedPhone = formData.phone.replace(/\D/g, '');
      if (formattedPhone.length === 10 || formattedPhone.length === 11) {
        formattedPhone = '55' + formattedPhone;
      }
      const payload = { ...formData, phone: formattedPhone };
      await moradoresApi.create(payload);
      router.push('/residents');
    } catch (err: any) {
      console.error('Error creating resident:', err);
      setError(err.response?.data?.detail || 'Erro ao criar morador. Verifique os dados fornecidos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 animate-pulse text-center">Carregando formulário...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/residents" />} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Novo Morador</h1>
          <p className="text-slate-500 mt-1">Cadastre um novo morador autorizado no sistema.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Dados do Morador
          </CardTitle>
          <CardDescription>
            As informações de contato são usadas pelo Porteiro IA para validação no WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form id="new-resident-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: João Silva"
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
                  placeholder="Ex: 5511999999999"
                />
                <p className="text-xs text-slate-400">Inclua o código do país (55)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (Opcional)</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
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
                  placeholder="Ex: 101"
                  type="text"
                  inputMode="numeric"
                />
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="condominio_id">Condomínio</Label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            form="new-resident-form" 
            className="bg-blue-600 hover:bg-blue-700" 
            disabled={submitting}
          >
            {submitting ? 'Cadastrando...' : 'Cadastrar Morador'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
