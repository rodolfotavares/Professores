'use client';

import { useEffect, useMemo, useState } from 'react';
import { GlassCard, StatusBadge } from '@/components/AppShell';
import { StatusMessage } from '@/components/PanelState';
import { apiFetch } from '@/lib/fetcher';

type TelegramConnection = {
  connection_code: string;
  code_expires_at: string;
  connected: boolean;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  connected_at?: string | null;
};

type TelegramResponse = {
  connection: TelegramConnection;
  bot_username: string;
};

export function TeacherTelegramPanel() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [botUsername, setBotUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      setError('');
      const data = await apiFetch<TelegramResponse>('/api/teacher/telegram');
      setConnection(data.connection);
      setBotUsername(data.bot_username || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar conexão do Telegram.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, []);

  const telegramLink = useMemo(() => {
    if (!botUsername) return '';
    return `https://t.me/${botUsername.replace('@', '')}`;
  }, [botUsername]);

  async function copyCode() {
    if (!connection?.connection_code) return;
    await navigator.clipboard.writeText(connection.connection_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function regenerateCode() {
    setActionLoading(true);
    setError('');
    try {
      const data = await apiFetch<TelegramResponse>('/api/teacher/telegram', { method: 'POST' });
      setConnection(data.connection);
      setBotUsername(data.bot_username || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar novo código.');
    } finally {
      setActionLoading(false);
    }
  }

  async function disconnect() {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch('/api/teacher/telegram', { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar Telegram.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="stack portal-tab">
      <div className="section-intro">
        <span className="eyebrow">LuminaBot</span>
        <h2>Conectar Telegram</h2>
        <p>Use o Telegram para consultar agenda, listar alunos e registrar ações rápidas sem abrir o app.</p>
      </div>
      <StatusMessage error={error} loading={loading} />

      <div className="grid grid-2">
        <GlassCard className="portal-summary-card telegram-connect-card">
          <div className="glass-card-head">
            <div>
              <span className="eyebrow">Status</span>
              <strong>{connection?.connected ? 'Telegram conectado' : 'Aguardando conexão'}</strong>
            </div>
            <StatusBadge tone={connection?.connected ? 'success' : 'warning'}>
              {connection?.connected ? 'Ativo' : 'Pendente'}
            </StatusBadge>
          </div>
          <p className="muted">
            {connection?.connected
              ? `Conectado como ${connection.telegram_username ? `@${connection.telegram_username}` : connection.telegram_first_name || 'usuário do Telegram'}.`
              : 'Envie o código abaixo para o bot no Telegram para concluir a conexão.'}
          </p>
          <div className="telegram-code-box">
            <span>Código de conexão</span>
            <strong>{connection?.connection_code || '...'}</strong>
            <small>Expira em {connection?.code_expires_at ? new Date(connection.code_expires_at).toLocaleString('pt-BR') : '24 horas'}</small>
          </div>
          <div className="panel-actions">
            <button className="btn primary" type="button" onClick={copyCode} disabled={!connection?.connection_code}>
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
            <button className="btn" type="button" onClick={regenerateCode} disabled={actionLoading}>
              Novo código
            </button>
            {connection?.connected && (
              <button className="btn danger" type="button" onClick={disconnect} disabled={actionLoading}>
                Desconectar
              </button>
            )}
          </div>
        </GlassCard>

        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Passo a passo</span>
          <h2>Como conectar</h2>
          <div className="mini-list">
            <span><strong>1. Abra o bot</strong><small>{telegramLink ? 'Clique no botão abaixo ou procure pelo usuário do bot.' : 'Configure o usuário do bot nas variáveis de ambiente.'}</small></span>
            <span><strong>2. Envie o código</strong><small>Copie o código desta tela e envie como mensagem para o bot.</small></span>
            <span><strong>3. Use comandos</strong><small>Depois de conectado, envie /ajuda para ver os comandos disponíveis.</small></span>
          </div>
          {telegramLink ? (
            <a className="btn primary" href={telegramLink} target="_blank" rel="noreferrer">Abrir bot no Telegram</a>
          ) : (
            <p className="muted">Defina NEXT_PUBLIC_TELEGRAM_BOT_USERNAME para mostrar o link direto do bot.</p>
          )}
        </GlassCard>
      </div>

      <GlassCard className="support-shortcuts-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Comandos iniciais</span>
            <strong>O que o LuminaBot entende</strong>
          </div>
        </div>
        <div className="support-shortcuts">
          <span className="support-shortcut"><strong>/agenda</strong><small>Mostra a agenda de hoje.</small></span>
          <span className="support-shortcut"><strong>/alunos</strong><small>Lista seus alunos cadastrados.</small></span>
          <span className="support-shortcut"><strong>/pendentes</strong><small>Mostra pagamentos pendentes do mês.</small></span>
          <span className="support-shortcut"><strong>Marcar aula com Ana amanhã às 15h</strong><small>Cria aula após confirmação.</small></span>
          <span className="support-shortcut"><strong>Registrar pagamento do João de R$100</strong><small>Registra pagamento após confirmação.</small></span>
          <span className="support-shortcut"><strong>Maria faltou hoje</strong><small>Marca falta após confirmação.</small></span>
        </div>
      </GlassCard>
    </div>
  );
}
