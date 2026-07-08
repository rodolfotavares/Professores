'use client';

import { useEffect, useMemo, useState } from 'react';
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

type TrainingExample = {
  id: string;
  phrase: string;
  intent: string;
  entities: Record<string, unknown>;
  confidence: number;
  source: string;
  status: string;
  updated_at: string;
};

type TrainingResponse = {
  examples: TrainingExample[];
  table_ready: boolean;
};

export function TeacherTelegramPanel() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [botUsername, setBotUsername] = useState('');
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [tableReady, setTableReady] = useState(true);
  const [editingExample, setEditingExample] = useState<Record<string, { intent: string; entities: string }>>({});
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
      const training = await apiFetch<TrainingResponse>('/api/teacher/luminabot-training');
      setExamples(training.examples || []);
      setTableReady(training.table_ready);
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

  async function connectTelegram() {
    setActionLoading(true);
    setError('');
    try {
      const data = await apiFetch<TelegramLinkResponse>('/api/teacher/telegram', { method: 'POST' });
      setBotUsername(data.bot_username || '');
      setLinkExpiresAt(data.connect_token_expires_at);
      window.open(data.deep_link, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir conexão do Telegram.');
    } finally {
      setActionLoading(false);
    }
  }

  async function disconnect() {
    setActionLoading(true);
    setError('');
    try {
      await apiFetch('/api/teacher/telegram', { method: 'DELETE' });
      setLinkExpiresAt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao desconectar Telegram.');
    } finally {
      setActionLoading(false);
    }
  }

  async function updateExample(example: TrainingExample, status: string) {
    setActionLoading(true);
    setError('');
    try {
      const draft = editingExample[example.id];
      await apiFetch('/api/teacher/luminabot-training', {
        method: 'PATCH',
        body: JSON.stringify({
          id: example.id,
          intent: draft?.intent || example.intent,
          entities: draft?.entities ? JSON.parse(draft.entities) : example.entities,
          status,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar exemplo do LumiBot.');
    } finally {
      setActionLoading(false);
    }
  }

  function updateDraft(example: TrainingExample, field: 'intent' | 'entities', value: string) {
    setEditingExample((current) => ({
      ...current,
      [example.id]: {
        intent: current[example.id]?.intent ?? example.intent,
        entities: current[example.id]?.entities ?? JSON.stringify(example.entities || {}, null, 2),
        [field]: value,
      },
    }));
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
              : 'Clique no botão abaixo para abrir o Telegram e conectar sua conta automaticamente.'}
          </p>
          {!connection?.connected && (
            <div className="telegram-code-box">
              <span>Link seguro</span>
              <strong>Uso único</strong>
              <small>{linkExpiresAt ? `Expira em ${new Date(linkExpiresAt).toLocaleString('pt-BR')}` : 'O link expira em 10 minutos e só pode ser usado uma vez.'}</small>
            </div>
          )}
          <div className="panel-actions">
            <button className="btn primary" type="button" onClick={connectTelegram} disabled={actionLoading || !botUsername}>
              {actionLoading ? 'Abrindo...' : connection?.connected ? 'Reconectar meu Telegram' : 'Conectar meu Telegram'}
            </button>
            {connection?.connected && (
              <button className="btn danger" type="button" onClick={disconnect} disabled={actionLoading}>
                Desconectar Telegram
              </button>
            )}
          </div>
        </GlassCard>

        <GlassCard className="portal-summary-card">
          <span className="eyebrow">Passo a passo</span>
          <h2>Como conectar</h2>
          <div className="mini-list">
            <span><strong>1. Clique em conectar</strong><small>O LuminaAI gera um link seguro e temporário.</small></span>
            <span><strong>2. Abra o Telegram</strong><small>O link inicia a conversa com o LuminaBot usando um token de uso único.</small></span>
            <span><strong>3. Comece a usar</strong><small>Depois de conectado, envie /ajuda para ver os comandos disponíveis.</small></span>
          </div>
          {telegramLink ? (
            <a className="btn" href={telegramLink} target="_blank" rel="noreferrer">Ver bot no Telegram</a>
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

      <GlassCard className="support-shortcuts-card">
        <div className="glass-card-head">
          <div>
            <span className="eyebrow">Treinamento</span>
            <strong>Exemplos aprendidos pelo LumiBot</strong>
          </div>
          <StatusBadge tone={tableReady ? 'success' : 'warning'}>
            {tableReady ? 'Ativo' : 'Aguardando tabela'}
          </StatusBadge>
        </div>
        <p className="muted">
          Revise exemplos interpretados pelo bot. Quando aprovados, eles ajudam o LumiBot a responder melhor sem chamar inteligencia artificial externa.
        </p>
        {!tableReady && (
          <p className="muted">A tabela de treinamento ainda precisa ser aplicada no Supabase para salvar novos exemplos.</p>
        )}
        <div className="mini-list">
          {examples.length ? examples.slice(0, 12).map((example) => {
            const draft = editingExample[example.id];
            return (
              <span key={example.id}>
                <strong>{example.phrase}</strong>
                <small>Intencao: {example.intent} | Confianca: {Math.round(Number(example.confidence || 0) * 100)}% | Status: {example.status}</small>
                <input
                  className="field-input"
                  value={draft?.intent ?? example.intent}
                  onChange={(event) => updateDraft(example, 'intent', event.target.value)}
                  aria-label="Intencao do exemplo"
                />
                <textarea
                  className="field-input"
                  rows={3}
                  value={draft?.entities ?? JSON.stringify(example.entities || {}, null, 2)}
                  onChange={(event) => updateDraft(example, 'entities', event.target.value)}
                  aria-label="Entidades do exemplo"
                />
                <div className="panel-actions">
                  <button className="btn primary" type="button" disabled={actionLoading} onClick={() => updateExample(example, 'approved')}>Aprovar</button>
                  <button className="btn" type="button" disabled={actionLoading} onClick={() => updateExample(example, example.status)}>Salvar correcao</button>
                  <button className="btn danger" type="button" disabled={actionLoading} onClick={() => updateExample(example, 'rejected')}>Rejeitar</button>
                </div>
              </span>
            );
          }) : (
            <span>
              <strong>Nenhum exemplo salvo ainda</strong>
              <small>Quando o LumiBot interpretar ou executar novas acoes, os exemplos aparecerao aqui.</small>
            </span>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
