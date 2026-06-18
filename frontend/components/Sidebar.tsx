'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Map, 
  LogOut,
  Building2,
  Menu,
  X,
  Building,
  Megaphone,
  Package
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ name: 'Condomínios', href: '/condominios', icon: Building }] : []),
    { name: 'Moradores', href: '/residents', icon: Users },
    { name: 'Áreas Comuns', href: '/areas-comuns', icon: Map },
    { name: 'Documentos & RAG', href: '/documents', icon: FileText },
    { name: 'Comunicados', href: '/comunicados', icon: Megaphone },
    { name: 'Encomendas', href: '/encomendas', icon: Package },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50 border-r border-slate-800">
      <div className="flex items-center gap-3 p-6 mb-2">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
          <Building2 className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">Porteiro IA</span>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center font-bold text-blue-400 border border-blue-800/50">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-slate-200">{user?.name}</span>
            <span className="text-xs text-slate-500 truncate">{user?.role}</span>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={logout}
          className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Sair da conta</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 shadow-sm">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:-ml-2 text-slate-600" />}>
            <Menu size={24} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0 bg-slate-950">
             <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 ml-3">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <Building2 className="text-white" size={18} />
          </div>
          <span className="font-bold text-slate-800">Porteiro IA</span>
        </div>
      </div>

      <aside className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-64">
        <SidebarContent />
      </aside>
    </>
  );
}
