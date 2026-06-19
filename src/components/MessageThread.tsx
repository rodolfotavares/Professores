'use client';

import type { Message } from '@/types';

type MessageThreadProps = {
  messages: Message[];
  currentRole: 'teacher' | 'student';
};

function isImage(message: Message) {
  return Boolean(message.attachment_type?.startsWith('image/') || message.attachment_url?.match(/\.(png|jpe?g|gif|webp|avif)$/i));
}

function isVideo(message: Message) {
  return Boolean(message.attachment_type?.startsWith('video/') || message.attachment_url?.match(/\.(mp4|webm|mov|m4v)$/i));
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function roleLabel(role: Message['sender_role']) {
  return role === 'teacher' ? 'Professor' : 'Aluno';
}

function AttachmentPreview({ message }: { message: Message }) {
  if (!message.attachment_url) return null;

  if (isImage(message)) {
    return (
      <a className="message-attachment media" href={message.attachment_url} target="_blank">
        <img src={message.attachment_url} alt={message.attachment_name || 'Imagem enviada'} />
      </a>
    );
  }

  if (isVideo(message)) {
    return (
      <video className="message-attachment video" src={message.attachment_url} controls>
        <a href={message.attachment_url} target="_blank">Abrir vídeo</a>
      </video>
    );
  }

  return (
    <a className="message-attachment file" href={message.attachment_url} target="_blank">
      <span>Arquivo</span>
      <strong>{message.attachment_name || 'Abrir anexo'}</strong>
    </a>
  );
}

export function MessageThread({ messages, currentRole }: MessageThreadProps) {
  return (
    <div className="message-thread">
      {messages.map((message) => {
        const outgoing = message.sender_role === currentRole;
        return (
          <article className={`message-row ${outgoing ? 'outgoing' : 'incoming'}`} key={message.id}>
            <div className="message-bubble">
              <div className="message-meta">
                <span>{outgoing ? 'Você' : roleLabel(message.sender_role)}</span>
                <small>{formatMessageTime(message.created_at)}</small>
              </div>
              {message.text && <p>{message.text}</p>}
              <AttachmentPreview message={message} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
