'use client';

import { useEffect, useState } from 'react';
import { condominiosApi, Condominio } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  Building, 
  Plus, 
  Search, 
  Trash2, 
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function CondominiosList() {
  const { user, isAdmin } = useAuth();
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', cnpj: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchCondominios();
    }
  }, [user, isAdmin]);

  const fetchCondominios = async () => {
    try {
      setLoading(true);
      const response = await condominiosApi.list();
      setCondominios(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching condominios:', err);
      setError('Falha ao carregar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Deseja realmente excluir este condomínio?')) return;
    
    try {
      await condominiosApi.delete(id);
      setCondominios(condominios.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Falha ao excluir condomínio.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await condominiosApi.create(formData);
      setCondominios([...condominios, response.data]);
      setIsOpen(false);
      setFormData({ name: '', cnpj: '', address: '' });
    } catch (err) {
      console.error('Error creating:', err);
      alert('Erro ao criar condomínio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCondominios = condominios.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj.includes(searchTerm)
  );

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Acesso restrito a Administradores.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Condomínios</h1>
          <p className="text-slate-500 mt-1">Gerencie os condomínios cadastrados no sistema.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="gap-2 bg-blue-600 hover:bg-blue-700" />}>
            <Plus size={18} />
            Novo Condomínio
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Condomínio</DialogTitle>
              <DialogDescription>
                Cadastre um novo condomínio no sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Condomínio</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Condomínio das Flores" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  required 
                  value={formData.cnpj} 
                  onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Rua Exemplo, 123" 
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Condomínio'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              type="text" 
              placeholder="Buscar por nome ou CNPJ..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredCondominios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center text-slate-400 gap-2">
                      <Building size={32} />
                      <p>Nenhum condomínio encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCondominios.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <Building size={16} />
                        </div>
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{c.cnpj}</TableCell>
                    <TableCell className="text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {c.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
