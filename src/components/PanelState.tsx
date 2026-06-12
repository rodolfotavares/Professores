export function StatusMessage({ error, loading }: { error: string; loading: boolean }) {
  if (loading) return <div className="notice">Carregando dados...</div>;
  if (error) return <div className="notice error">Erro: {error}</div>;
  return null;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
