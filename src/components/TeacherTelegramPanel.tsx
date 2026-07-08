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
    </div>
  );
}
