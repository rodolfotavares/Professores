import { NextRequest } from 'next/server';
import { apiError, getApiUser, json } from '@/lib/api-auth';

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function pickTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const subject = req.nextUrl.searchParams.get('subject')?.trim() || 'educacao';
    const query = encodeURIComponent(`${subject} educacao aula estudantes`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) return json({ articles: [] });

    const xml = await response.text();
    const articles = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => ({
      title: pickTag(match[1], 'title'),
      link: pickTag(match[1], 'link'),
      source: pickTag(match[1], 'source') || 'Google News',
      published_at: pickTag(match[1], 'pubDate'),
    }));

    return json({ articles });
  } catch (error) {
    return apiError(error);
  }
}
