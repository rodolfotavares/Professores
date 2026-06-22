import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, getApiUser, json } from '@/lib/api-auth';
import { createMercadoPagoPreference, upsertPaymentRecord } from '@/lib/mercadopago';
import { supabaseAdmin } from '@/lib/supabase-admin';

const schema = z.object({
  student_id: z.string().uuid(),
  month_reference: z.string().min(4),
});

function monthlyAmount(student: { classes_per_week: number | null; classes_per_month: number | null; price_per_class: number | null }) {
  const weeklyClasses = student.classes_per_week || Math.ceil((student.classes_per_month || 0) / 4) || 1;
  return weeklyClasses * (student.price_per_class || 0) * 4;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return json({ error: 'Sem permissao.' }, { status: 403 });
    }

    const body = schema.parse(await req.json());
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', body.student_id)
      .eq('teacher_id', user.id)
      .single();

    if (error || !student) return json({ error: 'Aluno nao encontrado.' }, { status: 404 });

    const amount = monthlyAmount(student);
    if (!amount || amount <= 0) {
      return json({ error: 'Configure o valor por aula e aulas por semana antes de cobrar.' }, { status: 400 });
    }

    const externalReference = [user.id, student.id, body.month_reference].join('|');
    await upsertPaymentRecord({
      teacherId: user.id,
      studentId: student.id,
      studentUserId: student.user_id,
      monthReference: body.month_reference,
      amount,
      status: 'pending',
    });

    const preference = await createMercadoPagoPreference({
      title: `Mensalidade LuminaAI - ${student.full_name}`,
      amount,
      payerEmail: student.email,
      externalReference,
      notificationUrl: `${req.nextUrl.origin}/api/payments/mercadopago/webhook`,
      backUrl: `${req.nextUrl.origin}/teacher/finance`,
    });

    return json({ preference_id: preference.id, init_point: preference.init_point, sandbox_init_point: preference.sandbox_init_point });
  } catch (error) {
    return apiError(error);
  }
}
