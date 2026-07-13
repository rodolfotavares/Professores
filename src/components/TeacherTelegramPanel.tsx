'use client';

import { useEffect, useState } from 'react';
import { GlassCard, StatusBadge } from '@/components/AppShell';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';

type TelegramConnection = {
  connected: boolean;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  connected_at?: string | null;
};

type TelegramResponse = {
  connection: TelegramConnection;
  bot_username: string;
};

type TelegramLinkResponse = {
  bot_username: string;
  deep_link: string;
  connect_token_expires_at: string;
};

export function TeacherTelegramPanel() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [botUsername, setBotUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState('');

  async function load() {
    try {
      setError('');
      const data = await apiFetch<TelegramResponse>('/api/teacher/telegram');
      setConnection(data.connection);
      setBotUsername(data.bot_username || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar conexao do assistente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, []);

  async function connectTelegram() {
    setActionLoading(true);
    setError('');
    try {
      const data = await apiFetch<TelegramLinkResponse>('/api/teacher/telegram', { method: 'POST' });
      setBotUsername(data.bot_username || '');
      setLinkExpiresAt(data.connect_token_expires_at);
      window.open(data.deep_link, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir conexao do Telegram.');
    } finally {
      setActionLoading(false);
    }
  }

  async function generateMeetingLinks() {
    setMeetingLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ synced: number; meetLinks?: number }>('/api/google/calendar/sync', {
        method: 'POST',
      });
      setError(`${data.meetLinks || 0} aula${data.meetLinks === 1 ? '' : 's'} com link online pronto. ${data.synced} link${data.synced === 1 ? '' : 's'} novo${data.synced === 1 ? '' : 's'} gerado${data.synced === 1 ? '' : 's'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar links das aulas.');
    } finally {
      setMeetingLoading(false);
    }
  }

  const identity = connection?.telegram_username ? `@${connection.telegram_username}` : connection?.telegram_first_name || '';

  return (
    <div className="stack portal-tab">
      <GlassCard className="portal-summary-card telegram-connect-card lumi-assistant-hero">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Lumi Assistente</span>
            <h2>Seu assistente de rotina no Telegram</h2>
          </div>
          <StatusBadge tone={connection?.connected ? 'success' : 'warning'}>
            {connection?.connected ? 'Conectado' : 'Disponivel'}
          </StatusBadge>
        </div>

        <StatusMessage error={error} loading={loading} />

        <p className="muted">
          Conecte o Lumi Assistente para consultar agenda, acompanhar pagamentos, gerar relatorios, criar planilhas e organizar sua rotina de professor sem abrir o painel.
        </p>

        <div className="support-shortcuts lumi-assistant-benefits">
          <span className="support-shortcut">
            <strong>Menos tempo em tarefas repetitivas</strong>
            <small>Peca resumos, graficos, planilhas e documentos direto pelo Telegram.</small>
          </span>
          <span className="support-shortcut">
            <strong>Mais controle no dia a dia</strong>
            <small>Consulte aulas, alunos e financeiro em poucos segundos.</small>
          </span>
          <span className="support-shortcut">
            <strong>Conexao segura</strong>
            <small>O link e temporario, unico e vinculado somente a sua conta.</small>
          </span>
        </div>

        {connection?.connected && (
          <p className="muted">
            Conectado {identity ? `como ${identity}` : 'ao seu Telegram'}. Voce pode reconectar quando quiser trocar a conta usada.
          </p>
        )}

        {!connection?.connected && linkExpiresAt && (
          <p className="muted">
            Link criado. Ele expira em {new Date(linkExpiresAt).toLocaleString('pt-BR')}.
          </p>
        )}

        <div className="panel-actions">
          <button className="btn primary" type="button" onClick={connectTelegram} disabled={actionLoading || !botUsername}>
            {actionLoading ? 'Abrindo Telegram...' : connection?.connected ? 'Reconectar meu Telegram' : 'Conectar meu Telegram'}
          </button>
        </div>
      </GlassCard>

      <GlassCard className="portal-summary-card telegram-connect-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Aulas online</span>
            <h2>Links de aula sem aprovação do Google</h2>
          </div>
          <StatusBadge tone="success">
            Sem OAuth
          </StatusBadge>
        </div>

        <p className="muted">
          O LuminaAI cria links de aula automaticamente e permite adicionar eventos ao Google Agenda por link, sem pedir permissao sensivel e sem verificacao rigorosa do Google.
        </p>

        <div className="support-shortcuts lumi-assistant-benefits">
          <span className="support-shortcut">
            <strong>Link online automatico</strong>
            <small>Cada aula recebe uma sala exclusiva para professor e aluno entrarem.</small>
          </span>
          <span className="support-shortcut">
            <strong>Google Agenda sem login</strong>
            <small>O professor pode adicionar a aula ao calendario usando um link seguro de template.</small>
          </span>
          <span className="support-shortcut">
            <strong>Sem tela de verificacao</strong>
            <small>Nao usamos escopos sensiveis como calendar.events.</small>
          </span>
        </div>

        <div className="panel-actions">
          <button className="btn primary" type="button" onClick={generateMeetingLinks} disabled={meetingLoading}>
            {meetingLoading ? 'Gerando...' : 'Gerar links das aulas existentes'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
