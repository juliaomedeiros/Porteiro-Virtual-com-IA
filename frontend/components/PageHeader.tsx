'use client';

import { useAuth } from '@/lib/auth';
import UserSwitcher from './UserSwitcher';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
        <UserSwitcher />
      </div>
    </div>
  );
}
