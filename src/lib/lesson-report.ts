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

const difficultySignals = [
  'dificuldade',
  'duvida',
  'duvidas',
  'confusao',
  'confundiu',
  'errou',
  'erro',
  'travou',
  'nao entendeu',
  'nao conseguiu',
  'precisa reforcar',
  'reforcar',
  'revisar',
  'atencao',
  'lento',
  'inseguro',
];

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|;\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectDifficulty(text: string) {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const matches = difficultySignals.filter((signal) => normalized.includes(signal));
  const sentences = splitSentences(text).filter((sentence) => {
    const cleanSentence = sentence.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return difficultySignals.some((signal) => cleanSentence.includes(signal));
  });

  return {
    hasDifficulty: matches.length > 0,
    signals: matches,
    notes: sentences.slice(0, 3),
  };
}

function hasRecurringDifficulty(currentNotes: string[], previousPoints: string[]) {
  if (!currentNotes.length || !previousPoints.length) return false;
  const current = currentNotes.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return previousPoints.some((point) => {
    const words = point
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4);
    return words.some((word) => current.includes(word));
  });
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
  const difficulty = detectDifficulty(classNotes);
  const recurringDifficulty = hasRecurringDifficulty(difficulty.notes, history.reinforcementPoints);
  const previousReinforcement = history.reinforcementPoints[0] || 'nao havia ponto recorrente registrado anteriormente';
  const previousRecommendation = history.previousRecommendations[0] || `continuar acompanhando a evolucao em ${subject}`;
  const detectedDifficulty = difficulty.notes[0] || (difficulty.hasDifficulty ? classNotes : '');
  const currentReinforcement = detectedDifficulty || `consolidar ${taught}`;

  const learningProgress = hadHistory
    ? recurringDifficulty
      ? `A inteligencia identificou dificuldade recorrente em ${subject}. O ponto atual ("${currentReinforcement}") se conecta a registros anteriores: ${previousReinforcement}.`
      : `A inteligencia comparou esta aula com os ultimos registros e nao encontrou repeticao clara de dificuldade. Ha evolucao ou novo ponto de acompanhamento em: ${currentReinforcement}.`
    : difficulty.hasDifficulty
      ? `A inteligencia identificou um primeiro ponto de dificuldade em ${subject}: ${currentReinforcement}. Esse registro sera usado para acompanhar recorrencia nas proximas aulas.`
      : `Este e o primeiro registro inteligente recente de ${subject} para este aluno. Nao foi detectada dificuldade recorrente neste texto.`;

  const nextLessonSuggestion = recurringDifficulty || difficulty.hasDifficulty
    ? `Iniciar retomando ${currentReinforcement}, fazer 2 exemplos guiados e depois propor exercicios curtos para confirmar autonomia.`
    : hadHistory
      ? `Comecar verificando a tarefa anterior e avancar para exercicios ligados a ${taught}.`
      : `Retomar os pontos principais de ${taught}, verificar a tarefa combinada e propor exercicios curtos para confirmar autonomia do aluno.`;

  const guardianMessage = `Ola! A aula de ${subject} foi registrada com foco em ${taught}. ${classNotes} Tarefa combinada: ${homework}. Proxima orientacao: ${nextLessonSuggestion}`;

  return {
    title: `Relatorio de ${subject} - ${input.student}`,
    summary: `Aula de ${subject} com duracao aproximada de ${input.duration || 60} minutos. ${classNotes}`,
    taught_content: taught,
    student_questions: classNotes.includes('?')
      ? 'O professor registrou duvidas durante a aula. Recomenda-se revisar os pontos citados no relato.'
      : difficulty.hasDifficulty
        ? `A inteligencia detectou possivel duvida/dificuldade em: ${currentReinforcement}`
        : 'Nenhuma duvida especifica foi registrada de forma separada.',
    reinforcement_points: recurringDifficulty
      ? `Dificuldade recorrente detectada: ${currentReinforcement}. Registro anterior relacionado: ${previousReinforcement}.`
      : difficulty.hasDifficulty
        ? `Ponto detectado para reforco: ${currentReinforcement}.`
        : `Manter acompanhamento de ${taught}.`,
    exercises_done: 'Exercicios e exemplos mencionados pelo professor foram considerados no acompanhamento pedagogico.',
    homework,
    next_recommendation: previousRecommendation,
    learning_progress: learningProgress,
    next_lesson_suggestion: nextLessonSuggestion,
    guardian_message: guardianMessage,
  };
}
