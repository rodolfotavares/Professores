type GenerateLessonReportInput = {
  professor: string;
  student: string;
  subject: string;
  duration: number;
  taughtContent: string;
  observations: string;
  homework: string;
  transcript: string;
};

function clean(value?: string) {
  return value?.trim() || '';
}

function fallback(value: string, empty = 'Não informado pelo professor.') {
  return clean(value) || empty;
}

export function generateLessonReport(input: GenerateLessonReportInput) {
  const subject = fallback(input.subject, 'Aula particular');
  const taught = fallback(input.taughtContent);
  const observations = fallback(input.observations, 'A aula foi registrada sem observações adicionais.');
  const homework = fallback(input.homework, 'Nenhuma tarefa combinada foi informada.');
  const transcript = clean(input.transcript);

  return {
    title: `Relatório de ${subject} - ${input.student}`,
    summary: `Aula de ${subject} com duração aproximada de ${input.duration || 60} minutos. ${observations}`,
    taught_content: taught,
    student_questions: transcript
      ? 'As dúvidas devem ser revisadas a partir da transcrição/resumo informado pelo professor.'
      : 'Nenhuma dúvida específica foi registrada.',
    reinforcement_points: observations,
    exercises_done: transcript
      ? 'Exercícios e exemplos citados no resumo da aula foram considerados no acompanhamento.'
      : 'Exercícios realizados não foram detalhados pelo professor.',
    homework,
    next_recommendation: `Na próxima aula, retomar os pontos principais de ${subject} e confirmar se a tarefa combinada foi concluída.`,
    parent_message: `Olá! A aula de ${subject} foi registrada com foco em ${taught}. Recomenda-se acompanhar a tarefa combinada e reforçar os pontos indicados pelo professor.`,
  };
}
