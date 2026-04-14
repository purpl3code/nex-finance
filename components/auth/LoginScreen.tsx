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
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
  };

  const staggerSettings = {
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const features = [
    { icon: <ShieldCheck size={18}/>, text: 'Segurança de nível bancário com backups diários' },
    { icon: <Zap size={18}/>,        text: 'Sincronização instantânea e painéis ultra precisos' },
    { icon: <BarChart3 size={18}/>,  text: 'Métricas ricas e relatórios mensuráveis' },
  ];

  return (
    <div className="min-h-screen w-full flex font-sans text-slate-100 overflow-hidden relative"
         style={{ backgroundColor: 'rgb(2, 6, 23)', backgroundImage: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}>
      
      {/* ── Animated ambient orbs ── */}
      <div className="absolute top-[-15%] left-[-8%]  w-[45%] h-[45%] rounded-full bg-blue-600/15    blur-[130px] pointer-events-none animate-orb-1" />
      <div className="absolute bottom-[-15%] right-[-8%] w-[45%] h-[45%] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none animate-orb-2" />
      <div className="absolute top-[40%] left-[30%]   w-[25%] h-[25%] rounded-full bg-violet-600/8    blur-[100px] pointer-events-none" />

      {/* ── CSS grid texture overlay (replaces external URL) ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* ══════════════════════════════════════
          BRAND COLUMN (lg+)
          ══════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-indigo-950/30 to-black/70 z-0" />

        {/* Inner micro-grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-glow-pulse">
            <Wallet className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">Nex Finance</span>
            <p className="text-[10px] text-blue-400/70 font-medium tracking-widest uppercase -mt-0.5">Premium Analytics</p>
          </div>
        </motion.div>

        {/* Hero text + features */}
        <motion.div 
          className="relative z-10 max-w-md"
          initial="hidden"
          animate="visible"
          variants={staggerSettings}
        >
          <motion.h2 variants={fadeUp} className="text-4xl lg:text-5xl font-semibold mb-5 leading-[1.15] tracking-tight">
            Assuma o{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 animate-gradient-x">
              controle total
            </span>{' '}
            das suas finanças.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-base mb-10 leading-relaxed">
            Uma plataforma de alta performance para gerenciar patrimônio, fluxo de caixa e metas com precisão e inteligência.
          </motion.p>
          
          <div className="space-y-4">
            {features.map((item, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp} 
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 backdrop-blur-sm group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all duration-300 shrink-0">
                  {item.icon}
                </div>
                <p className="text-slate-300 font-medium text-sm leading-snug">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-500/50 animate-pulse" />
          <p className="text-slate-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} Nex Finance Inc. — Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FORM COLUMN
          ══════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Wallet className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Nex Finance</span>
          </div>

          {/* Glass form card */}
          <div className="glass-lg rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10">
            {/* Highlight lines */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Animated top-right accent */}
            <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />

            {/* Title area */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-7"
              >
                <h3 className="text-2xl font-bold text-white tracking-tight mb-1.5">
                  {isLogin ? 'Bem-vindo de volta 👋' : 'Crie sua conta'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {isLogin ? 'Entre com seus dados para acessar seu painel.' : 'Junte-se à nova geração de controle financeiro.'}
                </p>
                <div className="mt-3 h-px w-12 rounded-full bg-gradient-to-r from-blue-500/80 to-transparent" />
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 flex items-start gap-3 text-red-400 text-sm overflow-hidden"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 pl-1 uppercase tracking-wider">Email</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-600 focus:bg-blue-950/15 hover:border-white/20"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between pl-1 mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Senha</label>
                  {isLogin && (
                    <a href="#" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                      Esqueceu?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock size={16} />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-600 focus:bg-blue-950/15 hover:border-white/20"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {/* Keep signed */}
              <div className="flex items-center gap-3 pt-1">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="keepSigned"
                    checked={keepSigned} 
                    onChange={(e) => setKeepSigned(e.target.checked)}
                    className="peer w-5 h-5 appearance-none rounded-md border border-white/20 bg-black/40 checked:bg-blue-500 checked:border-blue-500 outline-none transition-all cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 left-1 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <label htmlFor="keepSigned" className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                  Manter conectado neste dispositivo
                </label>
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_28px_rgba(59,130,246,0.55)] relative overflow-hidden"
                >
                  {/* shimmer on hover */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Entrar no painel' : 'Criar minha conta'}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </div>

          {/* Toggle login/signup */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="mt-7 text-center"
          >
            <p className="text-slate-500 text-sm">
              {isLogin ? 'Novo por aqui?' : 'Já faz parte do Nex?'}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors focus:outline-none underline underline-offset-2 decoration-blue-500/30 hover:decoration-blue-400/60"
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