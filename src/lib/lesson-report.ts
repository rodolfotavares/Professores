export type StudentLearningHistoryItem = {
  title?: string | null;
  summary?: string | null;
  taught_content?: string | null;
  reinforcement_points?: string | null;
  homework?: string | null;
  next_recommendation?: string | null;
  learning_progress?: string | null;
  next_lesson_suggestion?: string | null;
  detected_doubts?: string | null;
  learning_score?: number | null;
  learning_evidence?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  class_schedules?: { class_date?: string | null; class_time?: string | null; subject?: string | null } | null;
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
  teacherGuidance?: string;
};

type GenerateMonthlyStudentReportInput = {
  student: string;
  subject?: string | null;
  period: string;
  reports: StudentLearningHistoryItem[];
  teacherGuidance?: string;
};

function clean(value?: string | null) {
  return value?.trim() || '';
}

function fallback(value: string | undefined | null, empty = 'Nao informado pelo professor.') {
  return clean(value) || empty;
}

function guidanceText(value?: string | null) {
  const text = clean(value);
  return text ? `Orientacao do professor considerada: ${text}` : '';
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

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function extractDoubtTopics(notes: string[], taught: string) {
  const source = normalizeText([...notes, taught].join(' '));
  const ignored = new Set([
    'aluno', 'aula', 'teve', 'duvida', 'duvidas', 'dificuldade', 'dificuldades', 'parte',
    'principal', 'identificar', 'entendeu', 'trabalhamos', 'fizemos', 'exercicios', 'precisa',
    'reforcar', 'revisar', 'conteudo', 'assunto', 'professor',
  ]);
  const words = source
    .split(/\W+/)
    .filter((word) => word.length >= 5 && !ignored.has(word));
  const unique = Array.from(new Set(words)).slice(0, 5);
  return unique.length ? unique : [normalizeText(taught).split(/\W+/).find((word) => word.length >= 5) || 'conteudo'];
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

function scoreEvolution(currentDoubts: string[], history: StudentLearningHistoryItem[]) {
  const previousScores = history
    .map((item) => typeof item.learning_score === 'number' ? item.learning_score : null)
    .filter((item): item is number => item !== null);
  const previousScore = previousScores[0] ?? 62;
  const previousDoubts = history
    .flatMap((item) => clean(item.detected_doubts).split(',').map((part) => normalizeText(part.trim())).filter(Boolean))
    .slice(0, 12);
  const resolvedDoubts = previousDoubts.filter((doubt) => !currentDoubts.some((current) => current.includes(doubt) || doubt.includes(current)));
  const recurringDoubts = currentDoubts.filter((current) => previousDoubts.some((doubt) => current.includes(doubt) || doubt.includes(current)));

  let score = previousScore;
  if (recurringDoubts.length) score = Math.max(22, previousScore - 8);
  else if (currentDoubts.length && previousDoubts.length) score = Math.max(42, Math.min(74, previousScore - 2));
  else if (currentDoubts.length) score = Math.min(previousScore, 58);
  else if (resolvedDoubts.length) score = Math.min(92, previousScore + Math.min(18, resolvedDoubts.length * 6));
  else score = Math.min(82, previousScore + 3);

  const evidence = recurringDoubts.length
    ? `A nota caiu porque a IA encontrou duvida recorrente em: ${recurringDoubts.join(', ')}.`
    : resolvedDoubts.length
      ? `A nota subiu porque duvidas anteriores deixaram de aparecer nos relatos: ${resolvedDoubts.slice(0, 4).join(', ')}.`
      : currentDoubts.length
        ? `A nota ficou cautelosa porque surgiram duvidas novas em: ${currentDoubts.join(', ')}.`
        : 'A nota subiu pouco porque nao apareceram duvidas claras no relato atual, mas ainda ha pouco historico para afirmar dominio completo.';

  return { score, recurringDoubts, resolvedDoubts, evidence };
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
  const guidance = guidanceText(input.teacherGuidance);
  const history = getStudentLearningHistory(input.history || []);
  const hadHistory = history.reports.length > 0;
  const difficulty = detectDifficulty(classNotes);
  const recurringDifficulty = hasRecurringDifficulty(difficulty.notes, history.reinforcementPoints);
  const currentDoubtTopics = difficulty.hasDifficulty ? extractDoubtTopics(difficulty.notes, taught) : [];
  const evolution = scoreEvolution(currentDoubtTopics, history.reports);
  const previousReinforcement = history.reinforcementPoints[0] || 'nao havia ponto recorrente registrado anteriormente';
  const previousRecommendation = history.previousRecommendations[0] || `continuar acompanhando a evolucao em ${subject}`;
  const detectedDifficulty = difficulty.notes[0] || (difficulty.hasDifficulty ? classNotes : '');
  const currentReinforcement = detectedDifficulty || `consolidar ${taught}`;

  const learningProgress = hadHistory
    ? recurringDifficulty || evolution.recurringDoubts.length
      ? `A inteligencia identificou dificuldade recorrente em ${subject}. O ponto atual ("${currentReinforcement}") se conecta a registros anteriores: ${previousReinforcement}. Pontuacao sincera: ${evolution.score}/100.`
      : `A inteligencia comparou esta aula com os ultimos registros. ${evolution.evidence} Pontuacao sincera: ${evolution.score}/100.`
    : difficulty.hasDifficulty
      ? `A inteligencia identificou um primeiro ponto de dificuldade em ${subject}: ${currentReinforcement}. Esse registro sera usado para acompanhar recorrencia nas proximas aulas.`
      : `Este e o primeiro registro inteligente recente de ${subject} para este aluno. Nao foi detectada dificuldade recorrente neste texto.`;

  const nextLessonSuggestion = recurringDifficulty || difficulty.hasDifficulty
    ? `Iniciar retomando ${currentReinforcement}, fazer 2 exemplos guiados e depois propor exercicios curtos para confirmar autonomia.`
    : hadHistory
      ? `Comecar verificando a tarefa anterior e avancar para exercicios ligados a ${taught}.`
      : `Retomar os pontos principais de ${taught}, verificar a tarefa combinada e propor exercicios curtos para confirmar autonomia do aluno.`;

  const guardianMessage = `Ola! A aula de ${subject} foi registrada com foco em ${taught}. ${classNotes} Tarefa combinada: ${homework}. Proxima orientacao: ${nextLessonSuggestion}${guidance ? ` ${guidance}` : ''}`;

  return {
    title: `Relatorio de ${subject} - ${input.student}`,
    summary: `Aula de ${subject} com duracao aproximada de ${input.duration || 60} minutos. ${classNotes}${guidance ? ` ${guidance}` : ''}`,
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
    exercises_done: guidance
      ? `Exercicios, exemplos e a orientacao do professor foram considerados no acompanhamento pedagogico. ${guidance}`
      : 'Exercicios e exemplos mencionados pelo professor foram considerados no acompanhamento pedagogico.',
    homework,
    next_recommendation: previousRecommendation,
    learning_progress: learningProgress,
    next_lesson_suggestion: nextLessonSuggestion,
    guardian_message: guardianMessage,
    learning_score: evolution.score,
    detected_doubts: currentDoubtTopics.join(', '),
    learning_evidence: evolution.evidence,
  };
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function uniqueList(values: Array<string | null | undefined>, limit = 8) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const parts = clean(value).split(/[,;]\s*|\n+/).map((item) => item.trim()).filter(Boolean);
    for (const part of parts) {
      const key = normalizeText(part);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(part);
      }
      if (result.length >= limit) return result;
    }
  }
  return result;
}

function trendLabel(scores: number[]) {
  if (scores.length < 2) return 'Ainda ha poucos registros para medir tendencia com seguranca.';
  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  if (delta >= 10) return `Evolucao positiva consistente, com aumento de ${delta} pontos no periodo.`;
  if (delta <= -10) return `Queda de ${Math.abs(delta)} pontos no periodo, exigindo atencao nas proximas aulas.`;
  if (delta > 0) return `Evolucao leve, com aumento de ${delta} pontos no periodo.`;
  if (delta < 0) return `Oscilacao leve, com reducao de ${Math.abs(delta)} pontos no periodo.`;
  return 'Desempenho estavel no periodo.';
}

export function generateMonthlyStudentReport(input: GenerateMonthlyStudentReportInput) {
  const reports = [...input.reports].sort((a, b) => {
    const left = a.class_schedules?.class_date || a.published_at || a.created_at || '';
    const right = b.class_schedules?.class_date || b.published_at || b.created_at || '';
    return left.localeCompare(right);
  });
  const subject = input.subject || reports[0]?.class_schedules?.subject || 'Aula particular';
  const scores = reports
    .map((item) => typeof item.learning_score === 'number' ? Math.max(0, Math.min(100, item.learning_score)) : null)
    .filter((item): item is number => item !== null);
  const avg = average(scores);
  const doubts = uniqueList(reports.map((item) => item.detected_doubts || item.reinforcement_points), 10);
  const contents = uniqueList(reports.map((item) => item.taught_content || item.title), 10);
  const homework = uniqueList(reports.map((item) => item.homework), 6);
  const progress = reports.map((item) => clean(item.learning_progress || item.learning_evidence || item.summary)).filter(Boolean);
  const guidance = guidanceText(input.teacherGuidance);
  const firstScore = scores[0] ?? null;
  const lastScore = scores[scores.length - 1] ?? null;
  const trend = trendLabel(scores);

  const executiveSummary = reports.length
    ? `${input.student} teve ${reports.length} relatorio(s) analisado(s) em ${input.period}. ${avg !== null ? `A media pedagogica foi ${avg}/100.` : 'Ainda nao ha pontuacao numerica suficiente.'} ${trend}`
    : `Ainda nao ha relatorios publicados para ${input.student} em ${input.period}.`;

  const progressAnalysis = progress.length
    ? progress.slice(-5).join(' ')
    : 'Os relatorios do periodo ainda nao trazem observacoes suficientes para uma analise profunda.';

  const recommendedPlan = doubts.length
    ? `Nas proximas aulas, priorizar ${doubts.slice(0, 3).join(', ')} com exemplos guiados, exercicios curtos e verificacao de autonomia ao final.`
    : `Manter revisoes curtas de ${contents.slice(0, 3).join(', ') || subject} e registrar evidencias mais detalhadas nas proximas aulas.`;

  const guardianMessage = `Ola! Segue um resumo mensal de ${input.student}. ${executiveSummary} Conteudos trabalhados: ${contents.slice(0, 5).join(', ') || subject}. Pontos de atencao: ${doubts.slice(0, 5).join(', ') || 'nenhum ponto recorrente forte foi identificado'}. Proximo passo: ${recommendedPlan}`;

  return {
    student: input.student,
    subject,
    period: input.period,
    total_reports: reports.length,
    average_score: avg,
    first_score: firstScore,
    last_score: lastScore,
    trend,
    executive_summary: guidance ? `${executiveSummary} ${guidance}` : executiveSummary,
    content_worked: contents,
    recurring_difficulties: doubts,
    homework_summary: homework,
    progress_analysis: guidance ? `${progressAnalysis} ${guidance}` : progressAnalysis,
    recommended_plan: recommendedPlan,
    guardian_message: guidance ? `${guardianMessage} ${guidance}` : guardianMessage,
    full_text: [
      `Relatorio mensal completo - ${input.student}`,
      `Periodo: ${input.period}`,
      `Materia: ${subject}`,
      '',
      'Resumo executivo:',
      guidance ? `${executiveSummary} ${guidance}` : executiveSummary,
      '',
      'Conteudos trabalhados:',
      contents.length ? contents.map((item) => `- ${item}`).join('\n') : '- Sem conteudo detalhado no periodo.',
      '',
      'Analise de evolucao:',
      progressAnalysis,
      '',
      'Pontos de atencao:',
      doubts.length ? doubts.map((item) => `- ${item}`).join('\n') : '- Nenhuma dificuldade recorrente forte foi identificada.',
      '',
      'Plano recomendado:',
      recommendedPlan,
      '',
      'Mensagem para responsavel:',
      guardianMessage,
    ].join('\n'),
  };
}
