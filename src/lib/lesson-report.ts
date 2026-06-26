export type StudentLearningHistoryItem = {
  summary?: string | null;
  reinforcement_points?: string | null;
  homework?: string | null;
  next_recommendation?: string | null;
  learning_progress?: string | null;
  next_lesson_suggestion?: string | null;
  published_at?: string | null;
};

type GenerateLessonReportInput = {
  professor: string;
  student: string;
  subject: string;
  duration: number;
  taughtContent: string;
  classNotes: string;
  homework: string;
  history?: StudentLearningHistoryItem[];
};

function clean(value?: string | null) {
  return value?.trim() || '';
}

function fallback(value: string | undefined | null, empty = 'Nao informado pelo professor.') {
  return clean(value) || empty;
}

function joinHistory(history: StudentLearningHistoryItem[] = [], field: keyof StudentLearningHistoryItem) {
  return history
    .map((item) => clean(item[field] as string | null))
    .filter(Boolean)
    .slice(0, 5);
}

export function getStudentLearningHistory(history: StudentLearningHistoryItem[] = []) {
  return {
    reports: history.slice(0, 5),
    reinforcementPoints: joinHistory(history, 'reinforcement_points'),
    previousHomework: joinHistory(history, 'homework'),
    previousRecommendations: joinHistory(history, 'next_recommendation'),
    previousProgress: joinHistory(history, 'learning_progress'),
  };
}

export function generateLessonReport(input: GenerateLessonReportInput) {
  const subject = fallback(input.subject, 'Aula particular');
  const taught = fallback(input.taughtContent);
  const classNotes = fallback(input.classNotes, 'A aula foi registrada sem detalhes adicionais.');
  const homework = fallback(input.homework, 'Nenhuma tarefa combinada foi informada.');
  const history = getStudentLearningHistory(input.history || []);
  const hadHistory = history.reports.length > 0;
  const previousReinforcement = history.reinforcementPoints[0] || 'nao havia ponto recorrente registrado anteriormente';
  const previousRecommendation = history.previousRecommendations[0] || `continuar acompanhando a evolucao em ${subject}`;

  const learningProgress = hadHistory
    ? `Comparando com os ultimos registros, o aluno demonstra continuidade no estudo de ${subject}. O principal ponto anterior era ${previousReinforcement}; nesta aula, o professor registrou: ${classNotes}`
    : `Este e o primeiro registro inteligente recente de ${subject} para este aluno. Ele passa a servir como base para acompanhar evolucao, dificuldades recorrentes e proximas decisoes pedagogicas.`;

  const nextLessonSuggestion = hadHistory
    ? `Comecar retomando rapidamente ${previousReinforcement}, verificar a tarefa anterior e avancar para exercicios guiados ligados a ${taught}.`
    : `Retomar os pontos principais de ${taught}, verificar a tarefa combinada e propor exercicios curtos para confirmar autonomia do aluno.`;

  const guardianMessage = `Ola! A aula de ${subject} foi registrada com foco em ${taught}. ${classNotes} Tarefa combinada: ${homework}. Proxima orientacao: ${nextLessonSuggestion}`;

  return {
    title: `Relatorio de ${subject} - ${input.student}`,
    summary: `Aula de ${subject} com duracao aproximada de ${input.duration || 60} minutos. ${classNotes}`,
    taught_content: taught,
    student_questions: classNotes.includes('?')
      ? 'O professor registrou duvidas durante a aula. Recomenda-se revisar os pontos citados no relato.'
      : 'Nenhuma duvida especifica foi registrada de forma separada.',
    reinforcement_points: hadHistory
      ? `Reforcar: ${previousReinforcement}. Observacao da aula atual: ${classNotes}`
      : classNotes,
    exercises_done: 'Exercicios e exemplos mencionados pelo professor foram considerados no acompanhamento pedagogico.',
    homework,
    next_recommendation: previousRecommendation,
    learning_progress: learningProgress,
    next_lesson_suggestion: nextLessonSuggestion,
    guardian_message: guardianMessage,
  };
}
