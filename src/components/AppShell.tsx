'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetcher';

const titles: Record<string, { title: string; eyebrow: string }> = {
  '/teacher': { title: 'Painel', eyebrow: 'Portal do Professor' },
  '/teacher/students': { title: 'Alunos', eyebrow: 'Gestão' },
  '/teacher/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/teacher/finance': { title: 'Financeiro', eyebrow: 'Receita' },
  '/teacher/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/teacher/smart-lesson': { title: 'Aula Inteligente', eyebrow: 'Relatórios' },
  '/teacher/telegram': { title: 'Lumi Assistente', eyebrow: 'Produtividade' },
  '/teacher/support': { title: 'Suporte', eyebrow: 'Ajuda' },
  '/teacher/settings': { title: 'Configurações', eyebrow: 'Conta' },
  '/teacher/planner': { title: 'Planos de aula', eyebrow: 'Planejamento' },
  '/teacher/news': { title: 'Notícias', eyebrow: 'Curadoria' },
  '/teacher/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
  '/teacher/classes': { title: 'Turmas', eyebrow: 'Organização' },
  '/teacher/grades': { title: 'Notas', eyebrow: 'Avaliação' },
  '/teacher/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/student': { title: 'Painel', eyebrow: 'Portal do Aluno' },
  '/student/schedule': { title: 'Agenda', eyebrow: 'Calendário' },
  '/student/messages': { title: 'Mensagens', eyebrow: 'Comunicação' },
  '/student/lesson-history': { title: 'Histórico de Aulas', eyebrow: 'Relatórios' },
  '/student/settings': { title: 'Perfil', eyebrow: 'Conta' },
  '/student/support': { title: 'Suporte', eyebrow: 'Ajuda' },
  '/student/tutorial': { title: 'Tutorial', eyebrow: 'Instalação' },
  '/student/classes': { title: 'Minhas aulas', eyebrow: 'Aulas' },
  '/student/grades': { title: 'Notas', eyebrow: 'Desempenho' },
  '/student/frequency': { title: 'Frequência', eyebrow: 'Presença' },
  '/student/materials': { title: 'Materiais', eyebrow: 'Arquivos' },
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string;
};

export function AppLayout({ children, area }: { children: React.ReactNode; area: 'teacher' | 'student' }) {
  const pathname = usePathname();
  const current = titles[pathname] || { title: area === 'teacher' ? 'Portal do Professor' : 'Portal do Aluno', eyebrow: 'LuminaAI' };
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    apiFetch<{ notifications: NotificationItem[] }>('/api/notifications')
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }, [pathname]);

  return (
    <section className="app-glass-shell clean-shell">
      <header className="app-top-header clean-topbar">
        <div className="app-title-block">
          <span className="eyebrow">{current.eyebrow}</span>
          <h1>{current.title}</h1>
        </div>

        <div className="app-search" role="search">
          <SearchIcon />
          <input aria-label="Buscar" placeholder={area === 'teacher' ? 'Buscar alunos, aulas, mensagens...' : 'Buscar aulas, mensagens...'} />
          <kbd>Ctrl K</kbd>
        </div>

        <div className="app-header-actions">
          <div className="notification-menu">
            <button className="glass-icon-button notification-button" title="Notificações" aria-label="Notificações" onClick={() => setOpen((value) => !value)}>
              <BellIcon />
              {notifications.length > 0 && <span>{notifications.length}</span>}
            </button>
            {open && (
              <div className="notification-popover">
                <div className="glass-card-head">
                  <strong>Central de lembretes</strong>
                  <small>{notifications.length} alerta{notifications.length === 1 ? '' : 's'}</small>
                </div>
                <PushNotificationButton />
                {notifications.length === 0 ? (
                  <p className="muted">Nenhum lembrete urgente no momento.</p>
                ) : (
                  notifications.map((item) => (
                    <Link className="notification-item" href={item.link} key={item.id} onClick={() => setOpen(false)}>
                      <span className={`notification-dot ${item.type}`} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.message}</small>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <Link className="glass-icon-button header-message-button" href={area === 'teacher' ? '/teacher/messages' : '/student/messages'} title="Mensagens" aria-label="Mensagens">
            <MessageIcon />
          </Link>
          <div className="profile-chip">
            <div className="teacher-avatar">{area === 'teacher' ? 'P' : 'A'}</div>
            <span>{area === 'teacher' ? 'Professor' : 'Aluno'}</span>
          </div>
        </div>
      </header>

      <div className="app-content">{children}</div>
      <OnboardingGuide area={area} />
    </section>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function PushNotificationButton() {
  const [status, setStatus] = useState<'idle' | 'unsupported' | 'enabled' | 'blocked' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('Receba lembretes mesmo fora do app.');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      setMessage('Este navegador nao suporta push notification.');
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus('enabled');
      setMessage('Push ativado neste dispositivo.');
    } else if (Notification.permission === 'denied') {
      setStatus('blocked');
      setMessage('Permissao bloqueada no navegador.');
    }
  }, []);

  async function enablePush() {
    try {
      setStatus('loading');
      setMessage('Preparando notificacoes...');

      const keyData = await apiFetch<{ publicKey: string; configured: boolean }>('/api/push/public-key');
      if (!keyData.configured || !keyData.publicKey) {
        throw new Error('As chaves de push ainda nao foram configuradas no servidor.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'blocked' : 'idle');
        setMessage(permission === 'denied' ? 'Permissao bloqueada no navegador.' : 'Permissao nao concedida.');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.register('/sw.js');
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription.toJSON()),
      });

      await apiFetch('/api/push/test', { method: 'POST' });
      setStatus('enabled');
      setMessage('Push ativado. Enviamos um teste para este dispositivo.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel ativar notificacoes.');
    }
  }

  const disabled = status === 'loading' || status === 'enabled' || status === 'unsupported' || status === 'blocked';

  return (
    <div className={`push-enable-card ${status}`}>
      <span>
        <strong>Push notification</strong>
        <small>{message}</small>
      </span>
      <button type="button" onClick={enablePush} disabled={disabled}>
        {status === 'loading' ? 'Ativando...' : status === 'enabled' ? 'Ativo' : 'Ativar'}
      </button>
    </div>
  );
}

const onboardingSteps = {
  teacher: [
    {
      title: 'Bem-vindo ao LuminaAI',
      text: 'Você tem 7 dias grátis para testar o app. Depois desse período, a mensalidade de R$ 19,90 libera o acesso completo.',
      hint: 'Use esse tempo para cadastrar alunos e validar sua rotina.',
    },
    {
      title: 'Cadastre seus alunos',
      text: 'Entre em Alunos para criar o perfil, definir dias, horários, valor por aula e dados do responsável.',
      hint: 'Esses dados alimentam agenda, financeiro e relatórios.',
    },
    {
      title: 'Organize a agenda',
      text: 'No Início, arraste aulas no calendário, confirme, reagende ou desmarque encontros sem sair da tela principal.',
      hint: 'A agenda é o centro do uso diário do professor.',
    },
    {
      title: 'Use a Aula Inteligente',
      text: 'Ao fim da aula, registre o resumo. A IA ajuda a gerar relatório, mensagem para responsável e evolução do aluno.',
      hint: 'Quanto melhor o relato, mais fiel fica a análise.',
    },
    {
      title: 'Acompanhe o financeiro',
      text: 'Em Financeiro você controla pagamentos dos alunos e também paga a assinatura do app quando o teste acabar.',
      hint: 'Professores já cadastrados como isentos continuam liberados.',
    },
  ],
  student: [
    {
      title: 'Bem-vindo ao LuminaAI',
      text: 'Seu portal mostra aulas, mensagens e sua evolução conforme o professor registra os relatórios.',
      hint: 'Alunos não pagam assinatura do app.',
    },
    {
      title: 'Veja sua próxima aula',
      text: 'No Início você acompanha horário, matéria e status da próxima aula cadastrada pelo professor.',
      hint: 'Use o botão de confirmar aula quando estiver tudo certo.',
    },
    {
      title: 'Acompanhe sua evolução',
      text: 'O gráfico mostra a evolução calculada a partir dos relatórios de aula publicados pelo professor.',
      hint: 'Ele melhora conforme mais aulas são registradas.',
    },
    {
      title: 'Converse com o professor',
      text: 'Use Mensagens para tirar dúvidas, enviar combinados e manter o histórico organizado.',
      hint: 'Tudo fica vinculado ao seu professor.',
    },
  ],
} as const;

function OnboardingGuide({ area }: { area: 'teacher' | 'student' }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = onboardingSteps[area];
  const storageKey = `lumina-onboarding-${area}`;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('welcome') === '1';
    const pending = window.localStorage.getItem(storageKey) === 'pending';
    const done = window.localStorage.getItem(`${storageKey}-done`) === '1';
    if ((requested || pending) && !done) {
      setStep(0);
      setOpen(true);
    }
  }, [storageKey]);

  function closeTutorial() {
    window.localStorage.setItem(`${storageKey}-done`, '1');
    window.localStorage.removeItem(storageKey);
    setOpen(false);
  }

  if (!open) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="onboarding-card">
        <div className="onboarding-head">
          <span>Guia rápido</span>
          <button type="button" onClick={closeTutorial} aria-label="Pular tutorial">Pular</button>
        </div>
        <div className="onboarding-progress" aria-label={`Etapa ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => (
            <span className={index <= step ? 'active' : ''} key={item.title} />
          ))}
        </div>
        <h2 id="onboarding-title">{current.title}</h2>
        <p>{current.text}</p>
        <small>{current.hint}</small>
        <div className="onboarding-actions">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>Voltar</button>
          <button className="primary" type="button" onClick={() => (isLast ? closeTutorial() : setStep((value) => value + 1))}>
            {isLast ? 'Começar a usar' : 'Próximo'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function GlobalBackground() {
  return null;
}

export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card glass-card ${className}`}>{children}</section>;
}

export function MetricCard({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return (
    <GlassCard className="metric-card">
      <p className="muted">{title}</p>
      <h2>{value}</h2>
      {note && <small>{note}</small>}
    </GlassCard>
  );
}

export function StatusBadge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'warning' | 'success' }) {
  return <span className={`badge status-${tone}`}>{children}</span>;
}

export function DataTable({ rows }: { rows: Array<{ title: string; meta?: string; value?: string | number; status?: string }> }) {
  return (
    <GlassCard className="data-table-card">
      <div className="data-table">
        {rows.map((row) => (
          <div className="data-row" key={`${row.title}-${row.meta || row.value || row.status}`}>
            <span>
              <strong>{row.title}</strong>
              {row.meta && <small>{row.meta}</small>}
            </span>
            {row.value != null && <span>{row.value}</span>}
            {row.status && <StatusBadge tone="default">{row.status}</StatusBadge>}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 21h4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    </svg>
  );
}
