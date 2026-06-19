"use client";

import { useEffect, useState } from 'react';
import { areasComunsApi, condominiosApi, reservasApi, moradoresApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Ban, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ReservasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [condominios, setCondominios] = useState<any[]>([]);
  const [selectedCondo, setSelectedCondo] = useState<string>('');
  
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Day Details Dialog
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Reservation Form State
  const [moradores, setMoradores] = useState<any[]>([]);
  const [formData, setFormData] = useState({ morador_id: '', hora_inicio: '', hora_fim: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      fetchAreas();
      fetchMoradores();
      fetchReservas();
    }
  }, [selectedCondo]);

  const fetchAreas = async () => {
    try {
      const res = await areasComunsApi.list(selectedCondo);
      setAreas(res.data);
      if (res.data.length > 0) {
        setSelectedArea(res.data[0].id);
      } else {
        setSelectedArea('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMoradores = async () => {
    try {
      const res = await moradoresApi.list(selectedCondo);
      setMoradores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReservas = async () => {
    try {
      setLoading(true);
      // Fetches all reservations for this condo
      const res = await reservasApi.list(selectedCondo);
      setReservas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const grid = [];
    
    let currentWeek = [];
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }
    
    return grid;
  };

  // Filter reservations for the selected area
  const areaReservas = reservas.filter(r => r.area_id === selectedArea && r.status !== 'CANCELADA');

  const getReservasForDay = (day: number) => {
    return areaReservas.filter(r => {
      const rDate = new Date(r.booking_date);
      // Handle timezone offset simply by matching Y-M-D strings or local date if API sends YYYY-MM-DD string
      const rYear = parseInt(r.booking_date.split('-')[0]);
      const rMonth = parseInt(r.booking_date.split('-')[1]) - 1;
      const rDay = parseInt(r.booking_date.split('-')[2]);
      
      return rYear === currentYear && rMonth === currentMonth && rDay === day;
    });
  };

  const openDayDetails = (day: number) => {
    setSelectedDay(day);
    setFormData({ morador_id: '', hora_inicio: '', hora_fim: '' });
    setIsDialogOpen(true);
  };

  const handleAprovarPagamento = async (id: string) => {
    if (!confirm('Confirmar o pagamento e a reserva?')) return;
    try {
      await reservasApi.aprovarPagamento(id);
      fetchReservas();
    } catch (err) {
      console.error(err);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await reservasApi.cancelar(id);
      fetchReservas();
    } catch (err) {
      console.error(err);
      alert('Erro ao cancelar reserva.');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !selectedArea) return;
    
    setIsSubmitting(true);
    try {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      
      const payload = {
        booking_date: dateStr,
        area_id: selectedArea,
        morador_id: formData.morador_id,
        hora_inicio: formData.hora_inicio || null,
        hora_fim: formData.hora_fim || null
      };

      await reservasApi.create(payload);
      await fetchReservas();
      setFormData({ morador_id: '', hora_inicio: '', hora_fim: '' });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Erro ao criar reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeArea = areas.find(a => a.id === selectedArea);
  const dayReservas = selectedDay ? getReservasForDay(selectedDay) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Reservas</h1>
          <p className="text-slate-500 mt-1">Calendário visual de locação das áreas comuns.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
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
          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            {areas.length === 0 && <option value="">Nenhuma área cadastrada</option>}
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50 border-b border-slate-100">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
          <CardTitle className="text-lg">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </CardTitle>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight size={16} />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {!selectedArea ? (
             <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
               <CalendarCheck size={48} className="text-slate-300 mx-auto" />
               <p>Selecione uma área comum para visualizar o calendário.</p>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                    {day}
                  </div>
                ))}
                
                {generateCalendarGrid().map((week, wIndex) => (
                  week.map((day, dIndex) => {
                    const rForDay = day ? getReservasForDay(day) : [];
                    const hasPendente = rForDay.some(r => r.status_pagamento === 'PENDENTE');
                    const hasConfirmed = rForDay.some(r => r.status_pagamento === 'PAGO' || r.status_pagamento === 'ISENTO');
                    
                    return (
                      <div 
                        key={`${wIndex}-${dIndex}`} 
                        onClick={() => day && openDayDetails(day)}
                        className={`bg-white min-h-[100px] p-2 relative transition-colors ${day ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                      >
                        {day && (
                          <>
                            <span className="text-sm font-medium text-slate-700">{day}</span>
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                               {rForDay.map((r, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-2.5 h-2.5 rounded-full ${r.status_pagamento === 'PENDENTE' ? 'bg-slate-400' : 'bg-green-500'}`} 
                                    title={r.status_pagamento === 'PENDENTE' ? 'Pendente' : 'Confirmado'}
                                  />
                               ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                ))}
              </div>
              
              <div className="flex items-center gap-6 mt-6 text-sm text-slate-600 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span>Reserva Pendente (Aguardando Pagamento)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Reserva Confirmada / Paga</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Reservas para {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* List of existing reservations for the day */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Reservas Atuais:</h3>
              {dayReservas.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma reserva neste dia.</p>
              ) : (
                dayReservas.map(r => {
                  const m = moradores.find(x => x.id === r.morador_id);
                  return (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m ? m.name : 'Morador Desconhecido'}</p>
                          <p className="text-xs text-slate-500">Apto: {m ? m.unit : 'N/A'}</p>
                          {activeArea?.tipo_reserva === 'POR_BLOCO' && (
                             <p className="text-xs font-semibold text-blue-600 mt-1">Das {r.hora_inicio} às {r.hora_fim}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase
                          ${r.status_pagamento === 'PAGO' ? 'bg-green-100 text-green-700' : 
                            r.status_pagamento === 'ISENTO' ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
                          {r.status_pagamento === 'PENDENTE' ? '⏳ PENDENTE' : '✅ CONFIRMADO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                        {r.status_pagamento === 'PENDENTE' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => handleAprovarPagamento(r.id)}>
                            Aprovar Pgto.
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleCancelar(r.id)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form to add a new reservation */}
            <div className="pt-4 border-t border-slate-200">
               <h3 className="text-sm font-semibold text-slate-900 mb-3">Lançar Nova Reserva Manualmente</h3>
               <form onSubmit={handleCreateReservation} className="space-y-4">
                 <div className="space-y-2">
                    <Label>Morador</Label>
                    <select 
                      required
                      value={formData.morador_id}
                      onChange={e => setFormData({...formData, morador_id: e.target.value})}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>Selecione o morador...</option>
                      {moradores.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (Apto {m.unit})</option>
                      ))}
                    </select>
                 </div>
                 
                 {activeArea?.tipo_reserva === 'POR_BLOCO' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora Início</Label>
                        <input 
                          type="time" 
                          required
                          value={formData.hora_inicio}
                          onChange={e => setFormData({...formData, hora_inicio: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora Fim</Label>
                        <input 
                          type="time" 
                          required
                          value={formData.hora_fim}
                          onChange={e => setFormData({...formData, hora_fim: e.target.value})}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                        />
                      </div>
                    </div>
                 )}

                 <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                   {isSubmitting ? 'Salvando...' : 'Confirmar Reserva'}
                 </Button>
               </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
