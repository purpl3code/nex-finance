import React, { useState } from 'react';
import { supabase, setRememberMe, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError('Erro de configuração: Variáveis de ambiente do Supabase não encontradas no .env');
      setLoading(false);
      return;
    }

    // Save persistence preference before auth
    setRememberMe(keepSigned);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Auto login handling or message
        if (!error) toast.success('Conta criada! Você já pode entrar.');
      }
    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro.';
      if (msg === 'Failed to fetch') {
         msg = 'Falha na conexão. Verifique sua internet ou as configurações do projeto.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-xl border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
            <span className="font-bold text-[#ffffff] text-2xl leading-none mt-1">N</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nex Finance</h1>
          <p className="text-slate-400 text-sm mt-2">Suas finanças em qualquer lugar.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="keepSigned"
              checked={keepSigned} 
              onChange={(e) => setKeepSigned(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/20"
            />
            <label htmlFor="keepSigned" className="text-sm text-slate-400 cursor-pointer select-none">
              Manter conectado
            </label>
          </div>

          <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-blue-900/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-white/10 pt-6">
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};