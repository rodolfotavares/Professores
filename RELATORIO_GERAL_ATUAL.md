# Relatorio geral atual do LuminaAI

Atualizado em: 2026-06-25

## Resumo do sistema

LuminaAI e um aplicativo web/PWA feito em Next.js para professores particulares e alunos. O sistema usa Supabase para autenticacao, banco de dados, arquivos e vinculo entre professor e aluno. A interface principal foi organizada em dois portais: professor e aluno.

## Stack tecnica

- Frontend e backend: Next.js 15 com App Router.
- Interface: React 18 e CSS global em `src/app/globals.css`.
- Banco e autenticacao: Supabase.
- Validacao: Zod.
- Pagamento: Mercado Pago.
- Agenda externa: Google Calendar.
- PWA: manifest, service worker e botao de compartilhar/instalar.

## Paginas publicas

- `/`: pagina inicial comercial do LuminaAI.
- `/login`: login de professor e aluno.
- `/forgot-password`: recuperacao de senha.
- `/reset-password`: redefinicao de senha.
- `/register/teacher`: cadastro de professor.
- `/register/student`: cadastro de aluno com codigo do professor.
- `/privacy`: politica de privacidade.
- `/terms`: termos de uso.
- `/demo`: central de demonstracao.
- `/demo/professor`: demonstracao do portal do professor.
- `/demo/aluno`: demonstracao do portal do aluno.

## Portal do professor

Rotas principais visiveis no menu:

- `/teacher`: inicio do professor com resumo, alunos, aulas e indicadores.
- `/teacher/students`: gerenciamento de alunos, cadastro, edicao, exclusao e agenda do aluno.
- `/teacher/activities`: criacao, acompanhamento e correcao de atividades.
- `/teacher/smart-lesson`: Aula Inteligente com relatorios e analise por IA.
- `/teacher/messages`: mensagens com alunos e anexos.
- `/teacher/finance`: assinatura do app, ganhos, pagamentos e previsao financeira.
- `/teacher/support`: suporte, WhatsApp e assistente de ajuda do app.

Rotas secundarias ainda existentes para compatibilidade:

- `/teacher/classes`: visao de turmas/materias.
- `/teacher/grades`: notas organizadas por aluno.
- `/teacher/frequency`: frequencia e historico de aulas.
- `/teacher/schedule`: agenda tecnica do professor.
- `/teacher/planner`: planejador de aula.
- `/teacher/news`: noticias educacionais.
- `/teacher/settings`: configuracoes da conta e codigo do professor.
- `/teacher/tutorial`: tutorial de instalacao e uso.

## Portal do aluno

Rotas principais visiveis no menu:

- `/student`: inicio do aluno com proxima aula, atividades e progresso.
- `/student/activities`: atividades expansivas, respostas, upload e evolucao por IA.
- `/student/lesson-history`: historico de aulas e relatorios publicados.
- `/student/messages`: mensagens com o professor e anexos.
- `/student/settings`: perfil do aluno, dados do vinculo e idioma.

Rotas secundarias/legadas:

- `/student/schedule`: redireciona para `/student`.
- `/student/classes`: resumo tecnico de aulas.
- `/student/grades`: notas e feedbacks.
- `/student/frequency`: presencas e confirmacoes.
- `/student/materials`: arquivos e materiais antigos.
- `/student/tutorial`: tutorial de instalacao e login.

## APIs principais

Autenticacao e usuario:

- `GET /api/me`
- `POST /api/auth/register-teacher`
- `POST /api/auth/register-student`

Professor:

- `GET/POST /api/teacher/students`
- `GET/PATCH/DELETE /api/teacher/students/[id]`
- `GET/POST /api/teacher/schedule`
- `PATCH/DELETE /api/teacher/schedule/[id]`
- `PATCH /api/teacher/schedule/[id]/status`
- `POST /api/teacher/schedule/[id]/smart`
- `GET/POST /api/teacher/activities`
- `GET /api/teacher/submissions`
- `PATCH /api/teacher/submissions/[id]/correct`
- `GET /api/teacher/profile`
- `GET /api/teacher/subscription`
- `GET/POST /api/teacher/smart-lessons`
- `GET/PATCH /api/teacher/smart-lessons/[id]`
- `POST /api/teacher/lesson-plan`
- `GET /api/teacher/news`

Aluno:

- `GET /api/student/me`
- `GET /api/student/schedule`
- `PATCH /api/student/schedule/[id]/confirm`
- `GET /api/student/activities`
- `POST /api/student/activities/[id]/submit`
- `GET /api/student/lesson-reports`

Mensagens, arquivos e notificacoes:

- `GET/POST /api/messages`
- `POST /api/upload`
- `GET /api/notifications`

Integracoes:

- `GET /api/google/calendar/status`
- `GET /api/google/calendar/auth`
- `GET /api/google/calendar/callback`
- `POST /api/google/calendar/sync`
- `POST /api/payments/mercadopago/preference`
- `POST /api/payments/mercadopago/webhook`

## Tabelas do banco

Tabelas declaradas em `supabase/schema.sql`:

- `profiles`: perfil base do usuario.
- `teacher_profiles`: dados do professor e codigo de vinculo.
- `students`: alunos vinculados ao professor.
- `class_schedules`: aulas, datas, horarios, presenca e status.
- `lesson_reports`: relatorios da Aula Inteligente.
- `activities`: atividades criadas pelo professor.
- `activity_submissions`: entregas, notas e feedbacks.
- `messages`: chat entre professor e aluno.
- `payments`: registros de pagamentos.
- `app_subscriptions`: assinatura mensal do professor.
- `google_oauth_states`: estados temporarios do OAuth Google.
- `google_calendar_connections`: conexao Google Calendar do professor.
- `google_calendar_events`: eventos sincronizados no Google Calendar.
- `notifications`: estrutura de notificacoes.

## Modulos e componentes

- `AppShell`: estrutura principal dos portais.
- `AppNav`: navegacao lateral do professor e do aluno.
- `AuthForm`: login, cadastro, senha e mascara de WhatsApp.
- `TeacherHome`: tela inicial do professor.
- `TeacherStudentsBoard`: cadastro, edicao e gestao de alunos.
- `TeacherActivitiesBoard`: atividades, entregas e correcao.
- `TeacherFinanceBoard`: assinatura e financeiro.
- `TeacherPanels`: paineis secundarios do professor.
- `SmartLessonPanels`: Aula Inteligente e relatorios.
- `StudentHome`: inicio do aluno.
- `StudentPanels`: atividades, mensagens e paineis do aluno.
- `PortalUtilityPanels`: suporte, configuracoes, turmas, notas, frequencia e materiais.
- `InstallTutorialPanel`: instalacao em Android/iPhone e login do aluno.
- `MessageThread`: chat com anexos.
- `PanelState`: estados de carregamento, erro e vazio.
- `PwaRegister`: registro do PWA.
- `LanguageRuntime`: idioma em portugues/ingles.

## Funcionalidades atuais

- Cadastro de professor com senha forte e confirmacao de senha.
- Cadastro de aluno usando codigo do professor.
- Vinculo automatico aluno-professor.
- Mascara de WhatsApp brasileiro.
- Campo de WhatsApp do responsavel do aluno.
- Edicao e exclusao de alunos.
- Controle de dias, horario, valor da aula e aulas por semana.
- Criacao automatica de agenda a partir do cadastro do aluno.
- Confirmacao, reagendamento e cancelamento de aulas.
- Criacao de atividades dentro de modal/botao.
- Upload de arquivos em atividades e respostas.
- Correcao com nota e feedback.
- Separacao de atividades por estado.
- Mensagens professor-aluno com anexos.
- Aula Inteligente com relatorios, pontos de reforco e analise.
- Evolucao do aluno na aba Atividades.
- Relatorios com mensagem para WhatsApp do responsavel.
- Financeiro do professor e previsao mensal por aluno.
- Assinatura do professor via Mercado Pago.
- Professores antigos podem ficar isentos conforme regra de assinatura.
- Integracao Google Calendar.
- PWA instalavel no celular.
- Suporte com WhatsApp e chat de ajuda restrito ao app.
- Idioma portugues/ingles com troca no dispositivo.

## Limpeza feita neste ciclo

- Removidos componentes antigos e nao utilizados do portal do aluno:
  - `StudentDashboard`
  - `StudentSchedulePanel`
  - `ActivityChart`
  - `ChartLegend`
- Removidos imports que ficaram sem uso em `StudentPanels.tsx`.
- Corrigidos atalhos da configuracao do professor para nao apontarem mais para paginas antigas do aluno.
- Atualizados textos do assistente de suporte para refletir o fluxo atual: aluno ve aulas no Inicio e professor gerencia aulas pelo cadastro do aluno.

## Pontos de atencao

- Algumas rotas secundarias continuam existindo para compatibilidade, mesmo quando nao aparecem no menu principal.
- A integracao Google Calendar depende da verificacao/configuracao do app no Google Cloud.
- O Mercado Pago depende das credenciais e webhook configurados no painel do Mercado Pago.
- A analise de IA depende da qualidade dos relatorios e mensagens registradas nas aulas.

