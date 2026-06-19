'use client';

import { useEffect } from 'react';

const dictionary: Record<string, string> = {
  Lumina: 'Lumina',
  Inicio: 'Home',
  'Início': 'Home',
  Painel: 'Dashboard',
  Home: 'Home',
  Turmas: 'Classes',
  Alunos: 'Students',
  Aluno: 'Student',
  Professor: 'Teacher',
  Atividades: 'Activities',
  Atividade: 'Activity',
  Tarefas: 'Tasks',
  Tarefa: 'Task',
  Notas: 'Grades',
  Nota: 'Grade',
  Frequencia: 'Attendance',
  'Frequência': 'Attendance',
  Presenca: 'Attendance',
  'Presença': 'Attendance',
  Agenda: 'Schedule',
  Calendario: 'Calendar',
  'Calendário': 'Calendar',
  Relatorios: 'Reports',
  'Relatórios': 'Reports',
  Mensagens: 'Messages',
  Materiais: 'Materials',
  Configuracoes: 'Settings',
  'Configurações': 'Settings',
  Perfil: 'Profile',
  Suporte: 'Support',
  Tutorial: 'Tutorial',
  Noticias: 'News',
  'Notícias': 'News',
  Financeiro: 'Finance',
  Administracao: 'Management',
  'Administração': 'Management',
  Conta: 'Account',
  'Portal do Professor': 'Teacher Portal',
  'Portal do Aluno': 'Student Portal',
  'Resumo do Professor': 'Teacher Summary',
  'Portal do professor': 'Teacher portal',
  'Portal do aluno': 'Student portal',

  Entrar: 'Sign in',
  'Entrando...': 'Signing in...',
  Login: 'Login',
  Senha: 'Password',
  'Confirmar senha': 'Confirm password',
  'Nova senha': 'New password',
  'Esqueci minha senha': 'Forgot my password',
  'Recuperar senha': 'Reset password',
  'Enviar link de recuperacao': 'Send reset link',
  'Enviar link de recuperação': 'Send reset link',
  'Cadastro do Professor': 'Teacher Registration',
  'Cadastro do Aluno': 'Student Registration',
  'Criar conta': 'Create account',
  Cadastrar: 'Register',
  Nome: 'Name',
  'Nome completo': 'Full name',
  Materias: 'Subjects',
  'Matérias': 'Subjects',
  Whatsapp: 'WhatsApp',
  WhatsApp: 'WhatsApp',
  'Código do professor': 'Teacher code',
  'Codigo do professor': 'Teacher code',
  'Código de acesso': 'Access code',
  'Codigo de acesso': 'Access code',
  'Sair e entrar novamente': 'Sign out and sign in again',

  Sair: 'Sign out',
  Compartilhar: 'Share',
  Copiado: 'Copied',
  'Link copiado': 'Link copied',
  Salvar: 'Save',
  Enviar: 'Send',
  Buscar: 'Search',
  Criar: 'Create',
  Editar: 'Edit',
  Excluir: 'Delete',
  Cancelar: 'Cancel',
  Confirmar: 'Confirm',
  Corrigir: 'Grade',
  Abrir: 'Open',
  Fechar: 'Close',
  Agendar: 'Schedule',
  'Agendar aula': 'Schedule class',
  'Editar aula': 'Edit class',
  'Salvar aula': 'Save class',

  Ativo: 'Active',
  Ativos: 'Active',
  Pausado: 'Paused',
  Pausados: 'Paused',
  Inativo: 'Inactive',
  Inativos: 'Inactive',
  Agendada: 'Scheduled',
  Agendadas: 'Scheduled',
  Realizada: 'Completed',
  Realizadas: 'Completed',
  Cancelada: 'Canceled',
  Canceladas: 'Canceled',
  Falta: 'Absence',
  Faltas: 'Absences',
  Pendente: 'Pending',
  Pendentes: 'Pending',
  Enviada: 'Submitted',
  Enviadas: 'Submitted',
  Corrigida: 'Graded',
  Corrigidas: 'Graded',
  Concluido: 'Completed',
  'Concluído': 'Completed',
  Concluidas: 'Completed',
  'Concluídas': 'Completed',
  Expiradas: 'Expired',
  Pago: 'Paid',
  Pagos: 'Paid',
  'Não pago': 'Unpaid',
  'Nao pago': 'Unpaid',
  'Não pagos': 'Unpaid',
  'Nao pagos': 'Unpaid',
  'Pagos no mês': 'Paid this month',
  'Pagos no mes': 'Paid this month',
  'Mês de referência': 'Reference month',
  'Mes de referencia': 'Reference month',

  'Idioma': 'Language',
  'Português': 'Portuguese',
  'Portugues': 'Portuguese',
  'Escolha o idioma de preferência do app neste dispositivo.': 'Choose the preferred app language on this device.',
  'Escolha o idioma de preferencia do app neste dispositivo.': 'Choose the preferred app language on this device.',

  'Alunos ativos': 'Active students',
  'Total de alunos': 'Total students',
  'Turmas ativas': 'Active classes',
  'Atividades pendentes': 'Pending activities',
  'Atividades corrigidas': 'Graded activities',
  'Para corrigir': 'To grade',
  'Atividade da Semana': 'Weekly Activity',
  'Visão Geral': 'Overview',
  'Visao Geral': 'Overview',
  'Média geral': 'Overall average',
  'Media geral': 'Overall average',
  Entregas: 'Submissions',
  'Pendências': 'Pending items',
  Pendencias: 'Pending items',
  'Agenda da Semana': 'Weekly Schedule',
  Resultado: 'Result',
  'desempenho médio': 'average performance',
  'desempenho medio': 'average performance',
  'Ótimo progresso': 'Great progress',
  'Otimo progresso': 'Great progress',
  'Previsão mensal': 'Monthly forecast',
  'Previsao mensal': 'Monthly forecast',
  Receita: 'Revenue',
  'Ganhos previstos': 'Expected earnings',
  'Total mensal': 'Monthly total',
  'Média por aluno': 'Average per student',
  'Media por aluno': 'Average per student',
  'Por aluno': 'By student',
  Distribuicao: 'Distribution',
  'Distribuição': 'Distribution',
  'Aulas por semana': 'Classes per week',
  'Valor por aula': 'Price per class',
  'com agenda vinculada': 'with linked schedule',
  'próximos encontros': 'upcoming meetings',
  'proximos encontros': 'upcoming meetings',
  publicadas: 'published',
  vinculadas: 'linked',

  'Minhas aulas': 'My classes',
  'Minhas Aulas': 'My Classes',
  Aulas: 'Classes',
  Aula: 'Class',
  Dias: 'Days',
  Dia: 'Day',
  Horario: 'Time',
  'Horário': 'Time',
  'Data': 'Date',
  'Prazo': 'Due date',
  Titulo: 'Title',
  'Título': 'Title',
  Descricao: 'Description',
  'Descrição': 'Description',
  Materia: 'Subject',
  'Matéria': 'Subject',
  Resposta: 'Answer',
  Feedback: 'Feedback',
  Arquivo: 'File',
  Arquivos: 'Files',
  Conversa: 'Conversation',
  'Digite um recado': 'Type a message',
  'Enviar recado': 'Send message',
  'Foto, vídeo ou arquivo': 'Photo, video or file',
  'Foto, video ou arquivo': 'Photo, video or file',
  'Abrir anexo': 'Open attachment',
  'Imagem enviada': 'Sent image',
  'Abrir vídeo': 'Open video',
  'Abrir video': 'Open video',
  'Você': 'You',
  Voce: 'You',
  'Arquivo da atividade': 'Activity file',
  'Arquivo da resposta': 'Answer file',
  'Entregar atividade': 'Submit activity',
  'Nova atividade': 'New activity',
  'Sem atividades pendentes': 'No pending activities',
  'Progresso das tarefas': 'Task progress',
  'Abra uma tarefa para responder e anexar arquivos.': 'Open a task to answer and attach files.',
  'Publique, receba arquivos e corrija entregas.': 'Publish, receive files and grade submissions.',
  'Veja suas aulas, tarefas e recados em um só lugar.': 'See your classes, tasks and messages in one place.',
  'Veja exatamente quando suas aulas acontecerão.': 'See exactly when your classes will happen.',
  'Veja exatamente quando suas aulas acontecerao.': 'See exactly when your classes will happen.',

  'Contato direto e ajuda rápida sobre as funções do Lumina.': 'Direct contact and quick help with Lumina features.',
  'Contato direto e ajuda rapida sobre as funcoes do Lumina.': 'Direct contact and quick help with Lumina features.',
  Atendimento: 'Support',
  'Atendimento Lumina': 'Lumina Support',
  'Fale com o suporte pelo WhatsApp para dúvidas sobre uso do app.': 'Contact support on WhatsApp for questions about using the app.',
  'Fale com o suporte pelo WhatsApp para duvidas sobre uso do app.': 'Contact support on WhatsApp for questions about using the app.',
  'Chamar no WhatsApp': 'Contact on WhatsApp',
  'Chat IA': 'AI Chat',
  'Ajuda sobre o app': 'App help',
  'Pergunte sobre uma função do Lumina': 'Ask about a Lumina feature',
  'Pergunte sobre uma funcao do Lumina': 'Ask about a Lumina feature',
  'Resposta da IA': 'AI answer',

  'Instalar na tela inicial': 'Install on home screen',
  'Adicionar à Tela de Início': 'Add to Home Screen',
  'Adicionar a Tela de Inicio': 'Add to Home Screen',
  Android: 'Android',
  iPhone: 'iPhone',
  Chrome: 'Chrome',
  Safari: 'Safari',
  'Como ajudar o aluno a entrar': 'How to help the student sign in',
  'Login do aluno': 'Student login',
  'Dica importante': 'Important tip',
  'Toque no botao Compartilhar, o icone de um quadrado com uma seta para cima.': 'Tap the Share button, the square icon with an upward arrow.',
  'Role as opcoes e toque em Adicionar a Tela de Inicio.': 'Scroll through the options and tap Add to Home Screen.',

  'Dados essenciais da conta e código para vincular alunos.': 'Essential account data and code to link students.',
  'Dados essenciais da conta e codigo para vincular alunos.': 'Essential account data and code to link students.',
  'Cadastre, edite a agenda e acompanhe valores.': 'Register students, edit schedules and track payments.',
  'Controle presenças, faltas e confirmações de aula.': 'Track attendance, absences and class confirmations.',
  'Controle presencas, faltas e confirmacoes de aula.': 'Track attendance, absences and class confirmations.',
  'Organize aulas e atualize status rapidamente.': 'Organize classes and update status quickly.',
  'Agenda vazia': 'Empty schedule',
  'Crie um aluno com dias e horario ou agende uma aula manualmente.': 'Create a student with days and time or schedule a class manually.',
  'Crie um aluno com dias e horário ou agende uma aula manualmente.': 'Create a student with days and time or schedule a class manually.',
  'Controle financeiro': 'Financial control',
  'Marcar pagamento': 'Mark payment',
  'Planejamento de aulas': 'Lesson planning',
  'Planos de aula': 'Lesson plans',
  'Planejar aula': 'Plan class',
  'Gerar plano': 'Generate plan',
  'Últimas notícias': 'Latest news',
  'Ultimas noticias': 'Latest news',
};

const sortedEntries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
const textOriginals = new WeakMap<Text, string>();
const translatedAttributes = ['placeholder', 'title', 'aria-label'];
const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

function translateText(original: string, language: string) {
  if (language !== 'en-US') return original;

  const trimmed = original.trim();
  if (!trimmed) return original;

  const direct = dictionary[trimmed];
  if (direct) {
    return original.replace(trimmed, direct);
  }

  let translated = original;
  for (const [source, target] of sortedEntries) {
    if (translated.includes(source)) {
      translated = translated.split(source).join(target);
    }
  }
  return translated;
}

function translateAttributes(root: ParentNode, language: string) {
  const selector = translatedAttributes.map((attribute) => `[${attribute}]`).join(',');
  const elements = root.querySelectorAll<HTMLElement>(selector);

  elements.forEach((element) => {
    translatedAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;

      const originalKey = `i18nOriginal${attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`;
      const storedOriginal = element.dataset[originalKey];
      const expectedCurrentValue = storedOriginal ? translateText(storedOriginal, language) : value;
      const original = storedOriginal && value === expectedCurrentValue ? storedOriginal : value;
      element.dataset[originalKey] = original;
      const translated = translateText(original, language);
      if (value !== translated) {
        element.setAttribute(attribute, translated);
      }
    });
  });
}

function translateTree(language: string) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = language === 'en-US' ? 'en' : 'pt-BR';
  translateAttributes(document, language);

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ignoredTags.has(parent.tagName) || !node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    const current = node.textContent || '';
    const storedOriginal = textOriginals.get(node);
    const expectedCurrentText = storedOriginal ? translateText(storedOriginal, language) : current;
    const original = storedOriginal && current === expectedCurrentText ? storedOriginal : current;
    textOriginals.set(node, original);
    const translated = translateText(original, language);
    if (node.textContent !== translated) {
      node.textContent = translated;
    }
  });
}

export function LanguageRuntime() {
  useEffect(() => {
    let language = window.localStorage.getItem('lumina-language') || 'pt-BR';
    let scheduled = false;

    function scheduleTranslation(nextLanguage = language) {
      language = nextLanguage;
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        translateTree(language);
      });
    }

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<string>;
      const nextLanguage = customEvent.detail || window.localStorage.getItem('lumina-language') || 'pt-BR';
      scheduleTranslation(nextLanguage);
    }

    const observer = new MutationObserver(() => scheduleTranslation());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    window.addEventListener('lumina-language-change', handleLanguageChange);
    scheduleTranslation(language);

    return () => {
      observer.disconnect();
      window.removeEventListener('lumina-language-change', handleLanguageChange);
    };
  }, []);

  return null;
}
