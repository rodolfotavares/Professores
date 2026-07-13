import { randomBytes, createHash } from 'crypto';
import { supabaseAdmin } from './supabase-admin';

export type StudentLinkInput = {
  teacherId: string;
  studentId: string;
  studentUserId?: string | null;
  subject?: string | null;
  pricePerClass?: number | null;
  classesPerWeek?: number | null;
  status?: 'active' | 'paused' | 'inactive';
  inviteId?: string | null;
};

export type StudentInvitePayload = {
  teacherId: string;
  studentId?: string | null;
  email?: string | null;
  subject?: string | null;
  pricePerClass?: number | null;
  classesPerWeek?: number | null;
};

export function newInviteToken() {
  return randomBytes(24).toString('base64url');
}

export function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function upsertTeacherStudentLink(input: StudentLinkInput) {
  const payload = {
    teacher_id: input.teacherId,
    student_id: input.studentId,
    student_user_id: input.studentUserId || null,
    subject: input.subject || null,
    price_per_class: input.pricePerClass ?? null,
    classes_per_week: input.classesPerWeek ?? null,
    status: input.status || 'active',
    invite_id: input.inviteId || null,
    accepted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('teacher_student_links')
    .upsert(payload, { onConflict: 'teacher_id,student_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function ensureLinksForExistingStudents(teacherId?: string) {
  let query = supabaseAdmin
    .from('students')
    .select('id, teacher_id, user_id, subject, price_per_class, classes_per_week, status');
  if (teacherId) query = query.eq('teacher_id', teacherId);
  const { data, error } = await query;
  if (error) throw error;

  for (const student of data || []) {
    await upsertTeacherStudentLink({
      teacherId: student.teacher_id,
      studentId: student.id,
      studentUserId: student.user_id,
      subject: student.subject,
      pricePerClass: student.price_per_class,
      classesPerWeek: student.classes_per_week,
      status: student.status || 'active',
    });
  }
}

export async function studentIdsForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((item) => item.id);
}

export async function teacherIdsForStudentUser(userId: string) {
  const ids = await studentIdsForUser(userId);
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from('teacher_student_links')
    .select('teacher_id')
    .in('student_id', ids)
    .eq('status', 'active');
  if (error) throw error;
  return Array.from(new Set((data || []).map((item) => item.teacher_id)));
}

export async function findValidStudentInvite(token: string) {
  const tokenHash = hashInviteToken(token);
  const { data, error } = await supabaseAdmin
    .from('student_invites')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markInviteUsed(inviteId: string, studentId: string, studentUserId?: string | null) {
  const { error } = await supabaseAdmin
    .from('student_invites')
    .update({
      used_at: new Date().toISOString(),
      used_by_student_id: studentId,
      used_by_user_id: studentUserId || null,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', inviteId);
  if (error) throw error;
}
