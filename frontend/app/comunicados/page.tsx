'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { condominiosApi, Condominio } from '@/lib/api';
import { Megaphone, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function ComunicadosPage() {
  const { user, isAdmin } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondo, setSelectedCondo] = useState<string>('');

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

  const handleSend = async () => {
    if (!message.trim() || !selectedCondo) return;
    if (!confirm('⚠️ AVISO: Esta ação enviará uma mensagem no WhatsApp para TODOS os moradores ativos deste condomínio. Tem certeza que deseja prosseguir?')) return;
    
    try {
      setSending(true);
      setError(null);
      setSuccess(false);
      await condominiosApi.broadcast(selectedCondo, message);
      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError('Ocorreu um erro ao enviar o comunicado. Verifique a conexão com o servidor.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Comunicados em Massa</h1>
        <p className="text-slate-500 mt-1">Envie alertas e informativos para todos os moradores via WhatsApp.</p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Megaphone size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">Novo Comunicado</CardTitle>
              <CardDescription className="text-slate-500">
                A mensagem será entregue instantaneamente na caixa de entrada dos moradores.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Selecione o Condomínio</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                value={selectedCondo}
                onChange={(e) => setSelectedCondo(e.target.value)}
                disabled={sending}
              >
                {condominios.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mensagem do Síndico</label>
            <Textarea
              placeholder="Digite o comunicado oficial aqui..."
              className="min-h-[200px] resize-y bg-slate-50 border-slate-200 focus:bg-white text-base p-4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-slate-500 flex items-center justify-between">
              <span>Evite mensagens muito longas para garantir a leitura.</span>
              <span className={message.length > 800 ? "text-amber-500 font-medium" : ""}>
                {message.length} caracteres
              </span>
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle size={18} className="text-red-600" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center gap-2 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Comunicado colocado na fila de envio com sucesso! Os moradores receberão a mensagem em breve.
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center">
          <p className="text-xs text-slate-500 max-w-sm">
            O envio em lote processa mensagens com pequenos intervalos para evitar bloqueios no WhatsApp.
          </p>
          <Button 
            size="lg" 
            onClick={handleSend} 
            disabled={!message.trim() || !selectedCondo || sending}
            className="bg-blue-600 hover:bg-blue-700 min-w-[150px]"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={18} />
                Disparar
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
