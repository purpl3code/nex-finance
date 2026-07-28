# 💼 Nex Finance — Personal Finance Management App

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)

**Nex Finance** é um aplicativo completo e moderno de gestão financeira pessoal com design *Glassmorphism*, suporte offline-first, sincronização em nuvem via Supabase e suporte a exportação nativa para Android via Capacitor.

[Funcionalidades](#-funcionalidades) • [Arquitetura](#-arquitetura) • [Instalação](#-como-executar) • [Variáveis de Ambiente](#-variáveis-de-ambiente) • [Compilação Mobile](#-compilação-mobile-android)

</div>

---

## ✨ Funcionalidades

- 📊 **Dashboard Financeiro Inteligente**: Indicadores dinâmicos de patrimônio, despesas mensais, saldo líquido e gráficos de tendência.
- 💳 **Gestão Completa de Cartões de Crédito**: Acompanhamento de faturas (abertas/fechadas), limite disponível, parcelamentos e datas de vencimento.
- 🎯 **Metas & Objetivos Financeiros**: Monitoramento de progresso com projeções de conclusão e aporte.
- 📉 **Planejador de Quitação de Dívidas**: Acompanhamento de débitos e cálculo automático de juros e saldo devedor.
- 🔄 **Transações Recorrentes & Orçamentos**: Automatização de contas fixas e definição de teto de gastos por categoria.
- 📄 **Exportação & Relatórios**: Geração de relatórios completos em PDF, exportação de extratos em CSV e backup de dados em JSON.
- ☁️ **Sincronização Nuvem + Offline**: Operação local via `LocalStorage` / `StorageAdapter` com suporte a sincronização via Supabase RLS.
- 📱 **Multiplataforma**: Interface responsiva pronta para Web e empacotada para Android com Capacitor.

---

## 🛠️ Arquitetura e Tecnologias

```text
nex-finance/
├── components/          # Componentes de visão e gerenciadores de módulos
│   ├── auth/            # Autenticação e tela de Login
│   └── ui/              # Design System Glassmorphism (GlassButton, GlassCard, ModalShell...)
├── services/            # Serviços de integração (Storage, Supabase Sync, Backup, Theme)
├── hooks/               # Custom React Hooks (useFinance, useAuth, useUserProfile...)
├── selectors/           # Selector pattern para cálculos puros de indicadores e gráficos
├── utils/               # Utilitários puros (CSV, PDF Parser, Ajudantes de Metas e Dívidas)
├── lib/                 # Inicialização de bibliotecas externas (Supabase Client)
├── android/             # Projeto nativo Android (Capacitor)
└── public/              # Ativos estáticos e recursos
```

### Principais Bibliotecas
- **Interface**: React 18, Tailwind CSS, Framer Motion, Lucide Icons, Sonner (Toasts)
- **Visualização de Dados**: Recharts
- **Parsing e Documentos**: `pdfjs-dist` e `date-fns`
- **Mobile Native**: `@capacitor/core`, `@capacitor/android`

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **pnpm**

### Passos para rodar localmente:

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/nex-finance.git
   cd nex-finance
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
   ```

4. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:5173`.

---

## 📱 Compilação Mobile (Android)

Para sincronizar e gerar o aplicativo nativo para Android:

```bash
# Compila a aplicação web e sincroniza o projeto Android
npm run cap:sync

# Compila o APK de desenvolvimento Android
npm run cap:build
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para utilizá-lo e adaptá-lo.
