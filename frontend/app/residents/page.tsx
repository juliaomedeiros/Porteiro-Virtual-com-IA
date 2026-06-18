'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { moradoresApi, Morador } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3, 
  User,
  Phone,
  Home,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ResidentsList() {
  const { user, isAdmin } = useAuth();
  const [residents, setResidents] = useState<Morador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchResidents();
    }
  }, [user]);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const condominioId = isAdmin ? undefined : user?.condominioId;
      const response = await moradoresApi.list(condominioId);
      setResidents(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching residents:', err);
      setError('Falha ao carregar moradores. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja excluir este morador?')) return;
    
    try {
      await moradoresApi.delete(id);
      setResidents(residents.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting resident:', err);
      alert('Falha ao excluir morador.');
    }
  };

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Moradores</h1>
          <p className="text-slate-500 mt-1">{isAdmin ? "Gerencie os moradores de todos os condomínios." : "Lista de moradores autorizados do seu condomínio."}</p>
        </div>
        
        {isAdmin && (
          <Button render={<Link href="/residents/new" />} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <UserPlus size={18} />
            Novo Morador
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              type="text" 
              placeholder="Buscar por nome ou unidade..." 
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Morador</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={5} className="h-16" />
                  </TableRow>
                ))
              ) : filteredResidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <User size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                      <p className="font-medium text-slate-600">Nenhum morador encontrado</p>
                      <p className="text-sm">Tente mudar os termos da busca.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResidents.map((resident) => (
                  <TableRow key={resident.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {resident.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{resident.name}</span>
                          <span className="text-xs text-slate-500">CPF: {resident.cpf || 'Não informado'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Home size={14} className="text-slate-400" />
                        {resident.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {resident.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {!resident.is_active ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit bg-red-100 text-red-700">
                            INATIVO (MUDOU)
                          </span>
                        ) : (
                          <>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${resident.status_bot === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              BOT: {resident.status_bot}
                            </span>
                            {resident.is_sindico && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit bg-purple-100 text-purple-700">
                                SÍNDICO
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" render={<Link href={`/residents/${resident.id}`} />} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Edit3 size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resident.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                        <ChevronRight size={16} className="text-slate-300 ml-2" />
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
  );
}
