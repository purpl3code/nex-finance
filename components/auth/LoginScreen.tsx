import React, { useState } from 'react';
import { supabase, setRememberMe, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Lock, Mail, Loader2, AlertCircle, Wallet, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
      setError('Erro de configuração: Variáveis de ambiente do Supabase não encontradas.');
      setLoading(false);
      return;
    }

    setRememberMe(keepSigned);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!error) toast.success('Conta criada! Você já pode entrar.');
      }
    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro.';
      if (msg === 'Failed to fetch') {
         msg = 'Falha na conexão. Verifique sua rede.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerSettings = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />

      {/* Brand Column (visible only on lg screens) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-black/80 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 mix-blend-overlay"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wallet className="text-white" size={26} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Nex Finance</span>
        </motion.div>

        <motion.div 
          className="relative z-10 max-w-lg"
          initial="hidden"
          animate="visible"
          variants={staggerSettings}
        >
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-semibold mb-6 leading-tight">
            Assuma o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">controle da sua vida</span> financeira hoje.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg mb-10 leading-relaxed">
            Uma plataforma de alta performance criada para gerenciar seu patrimônio, fluxo de caixa e metas com precisão e acompanhamento inteligente.
          </motion.p>
          
          <div className="space-y-6">
            {[
              { icon: <ShieldCheck size={20}/>, text: 'Segurança de nível bancário com backups diários' },
              { icon: <Zap size={20}/>, text: 'Sincronização instantânea e painéis ultra precisos' },
              { icon: <BarChart3 size={20}/>, text: 'Métricas ricas e relatórios mensuráveis' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-center gap-4 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  {item.icon}
                </div>
                <p className="font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <div className="relative z-10 text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} Nex Finance Inc.
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wallet className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Nex Finance</span>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle inner highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h3>
              <p className="text-slate-400 text-sm">
                {isLogin ? 'Entre com seus dados para acessar seu painel.' : 'Junte-se à nova geração de controle financeiro.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm overflow-hidden"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 pl-1">Email</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 focus:bg-blue-950/20"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pl-1 mb-2">
                  <label className="block text-sm font-medium text-slate-300">Senha</label>
                  {isLogin && (
                    <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock size={18} />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 focus:bg-blue-950/20"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="keepSigned"
                    checked={keepSigned} 
                    onChange={(e) => setKeepSigned(e.target.checked)}
                    className="peer w-5 h-5 appearance-none rounded-md border border-white/20 bg-black/40 checked:bg-blue-500 checked:border-blue-500 outline-none transition-all cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 left-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <label htmlFor="keepSigned" className="text-sm text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                  Manter conectado neste dispositivo
                </label>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 group" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      {isLogin ? 'Entrar no painel' : 'Criar minha conta'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Novo por aqui?' : 'Já faz parte do Nex?'}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors focus:outline-none"
              >
                {isLogin ? 'Crie sua conta agora' : 'Faça login aqui'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};