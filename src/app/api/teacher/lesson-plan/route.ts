import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';

const schema = z.object({
  subject: z.string().min(2),
  topic: z.string().min(2),
  level: z.string().optional(),
  duration: z.string().optional(),
  objective: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') return json({ error: 'Sem permissao.' }, { status: 403 });

    const body = schema.parse(await req.json());
    const duration = body.duration || '60 minutos';
    const level = body.level || 'nivel do aluno';
    const objective = body.objective || `compreender e praticar ${body.topic}`;

    return json({
      plan: {
        title: `${body.subject}: ${body.topic}`,
        summary: `Plano de ${duration} para ${level}, com foco em ${objective}.`,
        steps: [
          `Acolhimento e diagnostico rapido sobre ${body.topic}.`,
          `Explicacao guiada com exemplos graduais de ${body.subject}.`,
          'Resolucao acompanhada de 2 a 3 exercicios.',
          'Pratica independente com correcao comentada.',
          'Fechamento com resumo e tarefa curta para consolidacao.',
        ],
        materials: [
          'Quadro ou folha de rascunho',
          'Lista curta de exercicios',
          'Atividade de fixacao no EduAssist Pro',
        ],
        homework: `Criar uma atividade de 5 questoes sobre ${body.topic}, misturando revisao e desafio.`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
