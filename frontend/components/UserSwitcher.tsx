'use client';

import { useAuth, UserRole } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { condominiosApi, Condominio } from '@/lib/api';
import { ShieldCheck, UserCircle, Settings } from 'lucide-react';

export default function UserSwitcher() {
  const { user, login } = useAuth();
  const [condominios, setCondominios] = useState<Condominio[]>([]);

  useEffect(() => {
    condominiosApi.list().then(res => setCondominios(res.data));
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 px-2 text-slate-500">
        <ShieldCheck size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Perfil</span>
      </div>
      
      <select 
        value={user.role}
        onChange={(e) => {
          const role = e.target.value as UserRole;
          if (role === 'ADMIN') {
            login(role);
          } else if (condominios.length > 0) {
            login(role, user.condominioId || condominios[0].id);
          } else {
            login(role);
          }
        }}
        className="text-sm bg-slate-50 border-none rounded-lg py-1 px-2 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
      >
        <option value="ADMIN">Administrador</option>
        <option value="SINDICO">Síndico</option>
        <option value="PORTEIRO">Porteiro</option>
      </select>

      {user.role !== 'ADMIN' && condominios.length > 0 && (
        <>
          <div className="h-4 w-px bg-slate-200" />
          <select
            value={user.condominioId}
            onChange={(e) => login(user.role, e.target.value)}
            className="text-sm bg-slate-50 border-none rounded-lg py-1 px-2 focus:ring-2 focus:ring-primary/20 transition-all font-medium max-w-[150px]"
          >
            {condominios.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
