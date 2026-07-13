'use client';

import { useEffect } from 'react';

const dictionary: Record<string, string> = {
  Lumina: 'LuminaAI',
  LuminaAI: 'LuminaAI',
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
  'Central de atividades': 'Activity center',
  'Fechar criacao': 'Close creation',
  'Fechar criação': 'Close creation',
  'Gestao de alunos': 'Student management',
  'Gestão de alunos': 'Student management',
  'Novo aluno': 'New student',
  'Fechar cadastro': 'Close registration',
  'Sem atividades pendentes': 'No pending activities',
  'Progresso das tarefas': 'Task progress',
  'Abra uma tarefa para responder e anexar arquivos.': 'Open a task to answer and attach files.',
  'Publique, receba arquivos e corrija entregas.': 'Publish, receive files and grade submissions.',
  'Veja suas aulas, tarefas e recados em um só lugar.': 'See your classes, tasks and messages in one place.',
  'Veja exatamente quando suas aulas acontecerão.': 'See exactly when your classes will happen.',
  'Veja exatamente quando suas aulas acontecerao.': 'See exactly when your classes will happen.',

  'Contato direto e ajuda rápida sobre as funções do Lumina.': 'Direct contact and quick help with LuminaAI features.',
  'Contato direto e ajuda rapida sobre as funcoes do Lumina.': 'Direct contact and quick help with LuminaAI features.',
  'Contato direto e ajuda rápida sobre as funções do LuminaAI.': 'Direct contact and quick help with LuminaAI features.',
  'Contato direto e ajuda rapida sobre as funcoes do LuminaAI.': 'Direct contact and quick help with LuminaAI features.',
  Atendimento: 'Support',
  'Atendimento Lumina': 'LuminaAI Support',
  'Atendimento LuminaAI': 'LuminaAI Support',
  'Fale com o suporte pelo WhatsApp para dúvidas sobre uso do app.': 'Contact support on WhatsApp for questions about using the app.',
  'Fale com o suporte pelo WhatsApp para duvidas sobre uso do app.': 'Contact support on WhatsApp for questions about using the app.',
  'Chamar no WhatsApp': 'Contact on WhatsApp',
  'Chat IA': 'AI Chat',
  'Ajuda sobre o app': 'App help',
  'Pergunte sobre uma função do Lumina': 'Ask about a LuminaAI feature',
  'Pergunte sobre uma funcao do Lumina': 'Ask about a LuminaAI feature',
  'Pergunte sobre uma função do LuminaAI': 'Ask about a LuminaAI feature',
  'Pergunte sobre uma funcao do LuminaAI': 'Ask about a LuminaAI feature',
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

Object.assign(dictionary, {
  'In\u00edcio': 'Home',
  'Frequ\u00eancia': 'Attendance',
  'Presen\u00e7a': 'Attendance',
  'Calend\u00e1rio': 'Calendar',
  'Relat\u00f3rios': 'Reports',
  'Configura\u00e7\u00f5es': 'Settings',
  'Not\u00edcias': 'News',
  'Administra\u00e7\u00e3o': 'Management',
  'Organiza\u00e7\u00e3o': 'Organization',
  Organizacao: 'Organization',
  'Avalia\u00e7\u00e3o': 'Assessment',
  Avaliacao: 'Assessment',
  'Comunica\u00e7\u00e3o': 'Communication',
  Comunicacao: 'Communication',
  'Instala\u00e7\u00e3o': 'Installation',
  Instalacao: 'Installation',
  Resultados: 'Results',
  Curadoria: 'Curation',
  'Vis\u00e3o premium das aulas, alunos e entregas.': 'Premium view of classes, students and submissions.',
  'Notifica\u00e7\u00f5es': 'Notifications',
  'Verificando permiss\u00e3o...': 'Checking permission...',
  'Entre com sua conta para acessar esta \u00e1rea.': 'Sign in with your account to access this area.',
  'Voc\u00ea est\u00e1 logado como aluno. Saia e entre com a conta do professor para usar esta \u00e1rea.': 'You are signed in as a student. Sign out and use the teacher account to access this area.',
  'Voc\u00ea est\u00e1 logado como professor. Use a \u00e1rea do professor para gerenciar alunos e aulas.': 'You are signed in as a teacher. Use the teacher area to manage students and classes.',
  '\u00c1rea': 'Area',
  area: 'area',
  '\u00c1rea do professor': 'Teacher area',
  'Salvar altera\u00e7\u00f5es': 'Save changes',
  'Cancelar edi\u00e7\u00e3o': 'Cancel editing',
  'Salvar e gerar agenda': 'Save and generate schedule',
  'Enviando...': 'Sending...',
  'Salvando...': 'Saving...',
  'Corrigindo...': 'Grading...',
  'Enviar e-mail': 'Send email',
  'N\u00e3o pago': 'Unpaid',
  'N\u00e3o pagos': 'Unpaid',
  'Pagos no m\u00eas': 'Paid this month',
  'M\u00eas de refer\u00eancia': 'Reference month',
  'por m\u00eas': 'per month',
  'por mes': 'per month',
  'Sem previs\u00e3o ainda': 'No forecast yet',
  'Sem previsao ainda': 'No forecast yet',
  'Veja a previs\u00e3o mensal por aluno.': 'See the monthly forecast by student.',
  'Cadastre alunos com aulas por semana e valor por aula.': 'Register students with classes per week and price per class.',
  'Distribui\u00e7\u00e3o': 'Distribution',
  'M\u00e9dia por aluno': 'Average per student',
  'Previs\u00e3o mensal': 'Monthly forecast',
  'Sem notas ainda': 'No grades yet',
  'Acompanhe entregas corrigidas, pendentes e desempenho m\u00e9dio.': 'Track graded submissions, pending work and average performance.',
  'Veja notas, feedbacks e atividades ainda aguardando corre\u00e7\u00e3o.': 'See grades, feedback and activities still awaiting grading.',
  'Entregue atividades para receber corre\u00e7\u00f5es do professor.': 'Submit activities to receive teacher feedback.',
  'M\u00e9dia': 'Average',
  'M\u00e9dia geral': 'Overall average',
  'Sem m\u00e9dia': 'No average',
  'Sem feedback ainda': 'No feedback yet',
  'com nota lan\u00e7ada': 'with grades posted',
  'desempenho geral': 'overall performance',
  'resultado atual': 'current result',
  'Organiza\u00e7\u00e3o visual das mat\u00e9rias, alunos ativos e pr\u00f3ximas aulas.': 'Visual organization of subjects, active students and upcoming classes.',
  'Mat\u00e9rias': 'Subjects',
  'Sem mat\u00e9ria': 'No subject',
  'Sem materia': 'No subject',
  'turmas em acompanhamento': 'classes being tracked',
  'sem hor\u00e1rio': 'no time set',
  'sem horario': 'no time set',
  'Aulas \u00e0s': 'Classes at',
  'Hor\u00e1rio n\u00e3o definido': 'Time not set',
  'Horario nao definido': 'Time not set',
  'Previs\u00e3o mensal:': 'Monthly forecast:',
  'Recriar aulas futuras com estes dias e hor\u00e1rio': 'Recreate future classes with these days and time',
  'Nenhum aluno ainda': 'No students yet',
  'Cadastre ou pe\u00e7a para o aluno usar o c\u00f3digo do professor.': 'Register a student or ask them to use the teacher code.',
  'C\u00f3digo do professor': 'Teacher code',
  'Use este c\u00f3digo no cadastro do aluno para criar o v\u00ednculo automaticamente.': 'Use this code in the student registration to create the link automatically.',
  'Dados essenciais da conta e c\u00f3digo para vincular alunos.': 'Essential account data and code to link students.',
  'Seu portal est\u00e1 conectado ao Supabase e sincroniza alunos, agenda, atividades e mensagens.': 'Your portal is connected to Supabase and syncs students, schedules, activities and messages.',
  'Informa\u00e7\u00f5es do seu cadastro e v\u00ednculo com o professor.': 'Your registration information and link with the teacher.',
  'E-mail n\u00e3o informado': 'Email not provided',
  'Mat\u00e9ria n\u00e3o definida': 'Subject not set',
  'N\u00e3o definido': 'Not set',
  'Veja suas pr\u00f3ximas aulas e mat\u00e9rias.': 'See your next classes and subjects.',
  'Acompanhe presen\u00e7as e confirma\u00e7\u00f5es.': 'Track attendance and confirmations.',
  'Pr\u00f3xima aula': 'Next class',
  'Confirmar presen\u00e7a': 'Confirm attendance',
  Confirmada: 'Confirmed',
  'confirmadas por voc\u00ea': 'confirmed by you',
  'marcadas como conclu\u00eddas': 'marked as completed',
  conclu\u00eddas: 'completed',
  'Data n\u00e3o definida': 'Date not set',
  'Data n\u00e3o informada': 'Date not provided',
  'sem prazo': 'no due date',
  prazo: 'due date',
  'Nenhuma atividade': 'No activities',
  'Nenhuma atividade corrigida': 'No graded activities',
  'Nada para corrigir': 'Nothing to grade',
  'Crie uma atividade para todos os alunos ou para um aluno espec\u00edfico.': 'Create an activity for all students or for a specific student.',
  'As novas entregas dos alunos aparecer\u00e3o aqui.': 'New student submissions will appear here.',
  'Todas as atividades publicadas j\u00e1 receberam entrega.': 'All published activities have already received submissions.',
  'As atividades corrigidas ficar\u00e3o registradas aqui.': 'Graded activities will stay recorded here.',
  'Quando o professor publicar atividades, elas aparecem aqui.': 'When the teacher publishes activities, they appear here.',
  'Sem resposta em texto.': 'No text answer.',
  'Entrega enviada.': 'Submission sent.',
  'Corre\u00e7\u00e3o enviada.': 'Grade sent.',
  'Sem feedback registrado.': 'No feedback recorded.',
  'Sem texto enviado.': 'No text sent.',
  'Arquivo entregue pelo aluno': 'File submitted by student',
  'Abrir arquivo da atividade': 'Open activity file',
  'Arquivo enviado': 'File sent',
  'aguardando entrega': 'waiting for submission',
  Expirada: 'Expired',
  Todos: 'All',
  'Sem recados': 'No messages',
  'As mensagens trocadas com o aluno aparecem aqui.': 'Messages exchanged with the student appear here.',
  'As mensagens do professor aparecem aqui.': 'Teacher messages appear here.',
  'Converse com cada aluno em um hist\u00f3rico simples.': 'Talk with each student in a simple history.',
  'Envie mensagens e acompanhe respostas do professor.': 'Send messages and follow teacher replies.',
  'Foto, v\u00eddeo ou arquivo': 'Photo, video or file',
  'Abrir v\u00eddeo': 'Open video',
  'Voc\u00ea': 'You',
  'Ol\u00e1! Sou o assistente do Lumina. Posso ajudar com fun\u00e7\u00f5es do app, como alunos, agenda, atividades, notas e mensagens.': 'Hi! I am the LuminaAI assistant. I can help with app features like students, schedule, activities, grades and messages.',
  'Ol\u00e1! Sou o assistente do LuminaAI. Posso ajudar com fun\u00e7\u00f5es do app, como alunos, agenda, atividades, notas e mensagens.': 'Hi! I am the LuminaAI assistant. I can help with app features like students, schedule, activities, grades and messages.',
  'Posso ajudar somente com fun\u00e7\u00f5es do Lumina: alunos, agenda, atividades, notas, frequ\u00eancia, mensagens, financeiro, instala\u00e7\u00e3o e configura\u00e7\u00f5es.': 'I can only help with LuminaAI features: students, schedule, activities, grades, attendance, messages, finance, installation and settings.',
  'Posso ajudar somente com fun\u00e7\u00f5es do LuminaAI: alunos, agenda, atividades, notas, frequ\u00eancia, mensagens, financeiro, instala\u00e7\u00e3o e configura\u00e7\u00f5es.': 'I can only help with LuminaAI features: students, schedule, activities, grades, attendance, messages, finance, installation and settings.',
  'A previs\u00e3o financeira usa o n\u00famero de aulas por semana e o valor por aula definidos no cadastro do aluno.': 'The financial forecast uses the number of classes per week and the price per class set in the student profile.',
  'Para vincular um aluno, o professor deve abrir Configura\u00e7\u00f5es, copiar o c\u00f3digo do professor e pedir para o aluno usar esse c\u00f3digo no cadastro.': 'To link a student, the teacher should open Settings, copy the teacher code and ask the student to use that code during registration.',
  'A agenda nasce dos dias e hor\u00e1rios cadastrados no aluno. O professor pode editar a agenda em Alunos ou Agenda, e o aluno visualiza os pr\u00f3ximos encontros na aba Agenda.': 'The schedule is created from the days and times registered for the student. The teacher can edit it in Students or Schedule, and the student sees upcoming meetings in Schedule.',
  'As atividades ficam na aba Atividades. Entregas novas aparecem em Para corrigir, atividades sem entrega ficam em Pendentes e avalia\u00e7\u00f5es conclu\u00eddas ficam em Corrigidas.': 'Activities stay in the Activities tab. New submissions appear in To grade, activities without submissions stay in Pending, and completed grading stays in Graded.',
  'Use a aba Mensagens para conversar com cada aluno. Selecione o aluno, escreva o recado e envie.': 'Use the Messages tab to talk with each student. Select the student, write the message and send it.',
  'Controle financeiro': 'Financial control',
  'Marcar pagamento': 'Mark payment',
  'Planos de aula': 'Lesson plans',
  'Monte uma estrutura objetiva para a pr\u00f3xima aula.': 'Build an objective structure for the next class.',
  'Busque assuntos recentes para enriquecer suas aulas.': 'Search recent topics to enrich your classes.',
  'Not\u00edcias por mat\u00e9ria': 'News by subject',
  'Atualiza\u00e7\u00f5es para preparar aulas': 'Updates to prepare classes',
  'Nenhuma not\u00edcia encontrada': 'No news found',
  'Tente outra mat\u00e9ria ou palavra-chave.': 'Try another subject or keyword.',
  'Ex.: matem\u00e1tica, biologia, portugu\u00eas': 'Ex.: math, biology, Portuguese',
  'Matem\u00e1tica': 'Math',
  'matem\u00e1tica': 'math',
  Biologia: 'Biology',
  biologia: 'biology',
  'Portugu\u00eas': 'Portuguese',
  'portugu\u00eas': 'Portuguese',
  'Supabase n\u00e3o configurado. Configure as vari\u00e1veis de ambiente antes de usar login.': 'Supabase is not configured. Set the environment variables before using login.',
  'Supabase n\u00e3o configurado. Configure as vari\u00e1veis de ambiente antes de recuperar senha.': 'Supabase is not configured. Set the environment variables before resetting password.',
  'Supabase n\u00e3o configurado. Configure as vari\u00e1veis de ambiente antes de alterar senha.': 'Supabase is not configured. Set the environment variables before changing password.',
  'Supabase n\u00e3o configurado. Configure as vari\u00e1veis de ambiente antes de cadastrar usu\u00e1rios.': 'Supabase is not configured. Set the environment variables before registering users.',
  'N\u00e3o foi poss\u00edvel enviar o e-mail de recupera\u00e7\u00e3o.': 'Could not send the recovery email.',
  'N\u00e3o foi poss\u00edvel alterar a senha.': 'Could not change the password.',
  'Professor criado. C\u00f3digo de acesso:': 'Teacher created. Access code:',
  'Aluno criado e vinculado ao professor.': 'Student created and linked to the teacher.',
  'Conta criada, mas n\u00e3o foi poss\u00edvel entrar automaticamente. Tente fazer login.': 'Account created, but automatic login was not possible. Try signing in.',
  'Cadastro criado, mas o perfil n\u00e3o foi reconhecido como aluno. Entre em contato com o suporte.': 'Registration created, but the profile was not recognized as a student. Contact support.',
  'Cadastro criado, mas o perfil n\u00e3o foi reconhecido como professor. Entre em contato com o suporte.': 'Registration created, but the profile was not recognized as a teacher. Contact support.',
  'C\u00f3digo do professor inv\u00e1lido.': 'Invalid teacher code.',
  'Erro ao criar usu\u00e1rio.': 'Error creating user.',
  'Aluno n\u00e3o encontrado.': 'Student not found.',
  'Atividade n\u00e3o encontrada.': 'Activity not found.',
  'Atividade n\u00e3o pertence ao aluno.': 'Activity does not belong to the student.',
  'Sem permiss\u00e3o.': 'No permission.',
  'Arquivo n\u00e3o enviado.': 'File not sent.',
  'Central de lembretes': 'Reminder center',
  alerta: 'alert',
  alertas: 'alerts',
  'Nenhum lembrete urgente no momento.': 'No urgent reminders right now.',
  'Aula nas proximas 24h': 'Class in the next 24h',
  'Aula nas pr\u00f3ximas 24h': 'Class in the next 24h',
  'Atividade para corrigir': 'Activity to grade',
  'Mensagem de aluno': 'Student message',
  'Mensagem do professor': 'Teacher message',
  'Atividade perto do prazo': 'Activity close to deadline',
  'Voce recebeu um novo recado.': 'You received a new message.',
  'Voc\u00ea recebeu um novo recado.': 'You received a new message.',
  'Exportar agenda': 'Export schedule',
  'Ativar lembretes': 'Enable reminders',
  'Google Agenda': 'Google Calendar',
  'Conta conectada': 'Connected account',
  'Sincronizacao externa': 'External sync',
  'Sincroniza\u00e7\u00e3o externa': 'External sync',
  'Conectado': 'Connected',
  'Nao conectado': 'Not connected',
  'N\u00e3o conectado': 'Not connected',
  'Conectar Google Agenda': 'Connect Google Calendar',
  'Reconectar Google Agenda': 'Reconnect Google Calendar',
  'Sincronizar aulas': 'Sync classes',
  'Sincronizando...': 'Syncing...',
  'Google Agenda conectado com sucesso.': 'Google Calendar connected successfully.',
  'Nao foi possivel conectar o Google Agenda.': 'Could not connect Google Calendar.',
  'N\u00e3o foi poss\u00edvel conectar o Google Agenda.': 'Could not connect Google Calendar.',
  'Falha ao iniciar conexao com Google Agenda.': 'Failed to start Google Calendar connection.',
  'Falha ao iniciar conex\u00e3o com Google Agenda.': 'Failed to start Google Calendar connection.',
  'Falha ao sincronizar Google Agenda.': 'Failed to sync Google Calendar.',
  'Conecte sua conta Google para enviar as aulas agendadas para o calendario do professor.': 'Connect your Google account to send scheduled classes to the teacher calendar.',
  'Conecte sua conta Google para enviar as aulas agendadas para o calend\u00e1rio do professor.': 'Connect your Google account to send scheduled classes to the teacher calendar.',
  'Baixar recibo': 'Download receipt',
  'Cobrar no WhatsApp': 'Charge on WhatsApp',
  'Pagar com Mercado Pago': 'Pay with Mercado Pago',
  'Assinatura do app': 'App subscription',
  'LuminaAI Pro': 'LuminaAI Pro',
  'O professor paga apenas pelo uso do LuminaAI. Os alunos nao pagam assinatura do app.': 'The teacher only pays for using LuminaAI. Students do not pay an app subscription.',
  'Mensalidade': 'Monthly fee',
  'Mes': 'Month',
  'M\u00eas': 'Month',
  'Ativa': 'Active',
  'Isento': 'Exempt',
  'Liberada': 'Unlocked',
  'Professor isento': 'Teacher exempt',
  'Assinatura paga': 'Subscription paid',
  'Pagar R$ 19,90': 'Pay R$ 19.90',
  'Gerando...': 'Generating...',
  'Falha ao gerar pagamento.': 'Failed to create payment.',
  'Mercado Pago nao configurado.': 'Mercado Pago is not configured.',
  'Mercado Pago não configurado.': 'Mercado Pago is not configured.',
  'Configure o valor por aula e aulas por semana antes de cobrar.': 'Set the price per class and classes per week before charging.',
  'Recibo de mensalidade': 'Monthly receipt',
  'Lembretes ativados neste dispositivo.': 'Reminders enabled on this device.',
  'LuminaAI - Recibo de mensalidade': 'LuminaAI - Monthly receipt',
  'Acesse o LuminaAI para professores e alunos.': 'Access LuminaAI for teachers and students.',
  'Este navegador nao suporta notificacoes locais.': 'This browser does not support local notifications.',
  'Este navegador n\u00e3o suporta notifica\u00e7\u00f5es locais.': 'This browser does not support local notifications.',
});

Object.assign(dictionary, {
  'Bem-vindo ao LuminaAI': 'Welcome to LuminaAI',
  'Você tem 7 dias grátis para testar o app. Depois desse período, a mensalidade de R$ 19,90 libera o acesso completo.': 'You have 7 free days to test the app. After that period, the R$ 19.90 monthly fee unlocks full access.',
  'Use esse tempo para cadastrar alunos e validar sua rotina.': 'Use this time to register students and validate your routine.',
  'Cadastre seus alunos': 'Register your students',
  'Entre em Alunos para criar o perfil, definir dias, horários, valor por aula e dados do responsável.': 'Go to Students to create the profile, set days, times, class price and guardian information.',
  'Depois de salvar, copie o link de acesso do aluno e envie pelo WhatsApp. O código antigo continua funcionando.': 'After saving, copy the student access link and send it through WhatsApp. The old code still works.',
  'Organize a agenda': 'Organize the schedule',
  'No Início, arraste aulas no calendário, confirme, reagende ou desmarque encontros sem sair da tela principal.': 'On Home, drag classes on the calendar, confirm, reschedule or cancel meetings without leaving the main screen.',
  'A agenda é o centro do uso diário do professor.': 'The schedule is the center of the teacher daily workflow.',
  'Use a Aula Inteligente': 'Use Smart Class',
  'Ao fim da aula, registre o resumo. A IA ajuda a gerar relatório, mensagem para responsável e evolução do aluno.': 'At the end of the class, record the summary. AI helps generate a report, a message for the guardian and the student progress.',
  'Quanto melhor o relato, mais fiel fica a análise.': 'The better the note, the more accurate the analysis becomes.',
  'Acompanhe o financeiro': 'Track finances',
  'Em Financeiro você controla pagamentos dos alunos e também paga a assinatura do app quando o teste acabar.': 'In Finance, you manage student payments and also pay the app subscription when the trial ends.',
  'Professores já cadastrados como isentos continuam liberados.': 'Teachers already registered as exempt remain unlocked.',
  'Seu portal mostra aulas, mensagens e sua evolução conforme o professor registra os relatórios.': 'Your portal shows classes, messages and your progress as the teacher records reports.',
  'Alunos não pagam assinatura do app.': 'Students do not pay for the app subscription.',
  'Veja sua próxima aula': 'See your next class',
  'No Início você acompanha horário, matéria e status da próxima aula cadastrada pelo professor.': 'On Home, you can see the time, subject and status of the next class registered by the teacher.',
  'Use o botão de confirmar aula quando estiver tudo certo.': 'Use the confirm class button when everything is correct.',
  'Vincule novos professores': 'Link new teachers',
  'Se outro professor enviar um convite, abra o link ou cole o token em Perfil para conectar a mesma conta.': 'If another teacher sends an invitation, open the link or paste the token in Profile to connect the same account.',
  'Assim você pode ter mais de um professor sem criar outro login.': 'This way you can have more than one teacher without creating another login.',
  'Use Mensagens para tirar dúvidas, enviar combinados e manter o histórico organizado.': 'Use Messages to ask questions, send agreements and keep the history organized.',
  'Guia rápido': 'Quick guide',
  'Pular tutorial': 'Skip tutorial',
  'Pular': 'Skip',
  'Voltar': 'Back',
  'Próximo': 'Next',
  'Começar a usar': 'Start using',
  'Receba lembretes mesmo fora do app.': 'Receive reminders even outside the app.',
  'Este navegador não suporta push notification.': 'This browser does not support push notifications.',
  'Este navegador não suporta notificações push.': 'This browser does not support push notifications.',
  'Notificações push': 'Push notifications',
  'Permissão bloqueada no navegador.': 'Permission blocked in the browser.',
  'Preparando notificações...': 'Preparing notifications...',
  'As chaves de push ainda não foram configuradas no servidor.': 'Push keys have not been configured on the server yet.',
  'Permissão não concedida.': 'Permission not granted.',
  'Push ativado. Enviamos um teste para este dispositivo.': 'Push enabled. We sent a test to this device.',
  'Não foi possível ativar notificações.': 'Could not enable notifications.',
  'Quer praticidade? contate-me!': 'Want practicality? Contact me!',
  'Lumi Assistente': 'Lumi Assistant',
  'Conectar assistente': 'Connect assistant',
  'Gerenciar assistente': 'Manage assistant',
  'Conecte o Lumi Assistente para organizar agenda e pagamentos pelo Telegram.': 'Connect Lumi Assistant to organize schedule and payments through Telegram.',
  'Conecte o Lumi Assistente para consultar agenda, acompanhar pagamentos, gerar relatórios, criar planilhas e organizar sua rotina de professor sem abrir o painel.': 'Connect Lumi Assistant to check schedules, track payments, generate reports, create spreadsheets and organize your teaching routine without opening the dashboard.',
  'Cada aula recebe uma sala exclusiva para professor e aluno entrarem.': 'Each class receives an exclusive room for teacher and student to join.',
  'O professor pode adicionar a aula ao calendário usando um link seguro de template.': 'The teacher can add the class to the calendar using a secure template link.',
  'Confirme sua senha atual antes de criar uma nova senha de acesso.': 'Confirm your current password before creating a new access password.',
  'Senha atual': 'Current password',
  'Confirmar nova senha': 'Confirm new password',
  'Alterar senha': 'Change password',
  'Alterando...': 'Changing...',
  'Senha alterada com segurança.': 'Password changed securely.',
  'A confirmação da senha precisa ser igual a nova senha.': 'Password confirmation must match the new password.',
  'Não foi possível confirmar sua sessão.': 'Could not confirm your session.',
  'Senha atual incorreta.': 'Current password is incorrect.',
  'Contato direto e ajuda rápida sobre as funções do LuminaAI.': 'Direct contact and quick help with LuminaAI features.',
  'Ajuda rápida para usar o portal do aluno no LuminaAI.': 'Quick help for using the student portal in LuminaAI.',
  'Fale com o suporte pelo WhatsApp para dúvidas sobre uso do app.': 'Contact support on WhatsApp for questions about using the app.',
  'Pergunte sobre uma função do LuminaAI': 'Ask about a LuminaAI feature',
  'Ferramentas secundárias': 'Secondary tools',
  'Atalhos úteis': 'Useful shortcuts',
  'Tutorial de instalação': 'Installation tutorial',
  'Como colocar o app na tela inicial.': 'How to add the app to the home screen.',
  'Contato e assistente de ajuda do LuminaAI.': 'LuminaAI contact and help assistant.',
  'Cole o token do convite ou abra o link enviado pelo professor para conectar esta conta a outra aula.': 'Paste the invitation token or open the link sent by the teacher to connect this account to another class.',
  'Token do convite': 'Invitation token',
  'Cole o código do link recebido': 'Paste the code from the received link',
  'Vincular professor': 'Link teacher',
  'Vinculando...': 'Linking...',
  'Professor vinculado com sucesso.': 'Teacher linked successfully.',
});

const fallbackWords: Record<string, string> = {
  professor: 'teacher',
  professores: 'teachers',
  aluno: 'student',
  alunos: 'students',
  aula: 'class',
  aulas: 'classes',
  agenda: 'schedule',
  financeiro: 'finance',
  pagamento: 'payment',
  pagamentos: 'payments',
  mensagem: 'message',
  mensagens: 'messages',
  relatório: 'report',
  relatórios: 'reports',
  evolução: 'progress',
  frequência: 'attendance',
  configuração: 'setting',
  configurações: 'settings',
  suporte: 'support',
  responsável: 'guardian',
  responsáveis: 'guardians',
  matéria: 'subject',
  matérias: 'subjects',
  horário: 'time',
  horários: 'times',
  próximo: 'next',
  próxima: 'next',
  pendente: 'pending',
  pendentes: 'pending',
};

const sortedEntries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
const textOriginals = new WeakMap<Text, string>();
const translatedAttributes = ['placeholder', 'title', 'aria-label'];
const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  for (const [source, target] of Object.entries(fallbackWords)) {
    translated = translated.replace(new RegExp(`\\b${escapeRegex(source)}\\b`, 'gi'), target);
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
