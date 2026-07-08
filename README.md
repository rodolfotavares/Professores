# Professores - LuminaAI

App para professores e alunos, feito fora do Base44 com Next.js e Supabase.

## O que este app faz

- Cadastro de professor com codigo de acesso.
- Cadastro de aluno vinculado ao professor pelo codigo.
- Painel do professor com alunos, agenda, atividades e recados.
- Painel do aluno com agenda, atividades, entregas, notas e recados.
- Criacao de aluno pelo professor com dias e horario ja gerando aulas futuras na agenda.
- LuminaBot no Telegram para consultar agenda, listar alunos e registrar acoes rapidas com confirmacao.
- APIs centralizadas em `/api` para evitar divergencia de sincronizacao entre paginas.

## Configuracao local

1. Crie um projeto no Supabase.
2. Abra o SQL Editor no Supabase e rode `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN` opcional para LuminaBot
   - `TELEGRAM_WEBHOOK_SECRET` opcional para proteger o webhook do Telegram
   - `LLM_PROVIDER`, `LLM_API_KEY`, `GROQ_API_KEY`, `LLM_MODEL` opcionais para respostas de IA no LuminaBot
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` opcional para exibir o link do bot no painel
5. Instale e rode:

```bash
npm install
npm run dev
```

O app abre em `http://localhost:3000` por padrao. Nesta maquina ele foi testado em `http://localhost:3001`.

## Publicacao

Use o GitHub para armazenar o codigo.

Para hospedar o app funcionando com login, banco e rotas `/api`, use Vercel, Render ou outro servidor Node.js. GitHub Pages nao e recomendado para este projeto porque ele nao executa as APIs do Next.js.

### Vercel recomendado

1. Suba este projeto para um repositorio novo no GitHub.
2. Importe o repositorio na Vercel.
3. Configure as mesmas variaveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy.

## LuminaBot no Telegram

1. No Telegram, fale com `@BotFather`.
2. Use `/newbot`, escolha nome e usuario do bot.
3. Copie o token gerado e configure na Vercel como `TELEGRAM_BOT_TOKEN`.
4. Crie um segredo forte e configure como `TELEGRAM_WEBHOOK_SECRET`.
5. Configure o usuario publico do bot em `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, por exemplo `LuminaAIProBot`.
6. Depois do deploy, configure o webhook:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://luminaipro.com.br/api/telegram/webhook\",\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

No painel do professor, abra `/teacher/telegram` e clique em **Conectar meu Telegram**. A LuminaAI gera um link seguro do tipo `https://t.me/<bot>?start=<token>`; esse token e temporario, expira em 10 minutos e so pode ser usado uma vez. Ao abrir o link, o LuminaBot valida o token, vincula o Telegram ID do professor e registra a conexao nos logs de auditoria. Depois disso, o professor pode usar comandos como `/agenda`, `/alunos`, `/pendentes`, `Marcar aula com Ana amanha as 15h`, `Registrar pagamento do Joao de R$100` e `Maria faltou hoje`.

Se o professor quiser remover o vinculo, use o botao **Desconectar Telegram** na mesma pagina.

O LuminaBot tem uma camada conversacional preparada para IA. Sem chave de IA, ele continua funcionando por regras para agenda, alunos, pagamentos, textos para responsaveis, relatorios e acoes com confirmacao.

Para usar Groq, configure:

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=<sua-chave-groq>
LLM_MODEL=llama-3.3-70b-versatile
```

Tambem e possivel usar `LLM_PROVIDER=openai` ou `openai-compatible` com `LLM_API_KEY`, `LLM_MODEL` e opcionalmente `LLM_API_URL`. A IA melhora as respostas livres, mas a logica de seguranca continua igual: acoes sensiveis exigem confirmacao e o bot usa apenas dados do professor conectado.

## Primeiro teste recomendado

1. Acesse `/register/teacher` e crie o professor.
2. Copie o codigo `PROF-0000` exibido.
3. Acesse `/register/student` e crie um aluno com esse codigo.
4. Entre no painel do professor e crie:
   - um aluno manual com dias e horario para testar agenda automatica;
   - uma aula;
   - uma atividade;
   - um recado.
5. Entre no painel do aluno e confira:
   - agenda;
   - atividade;
   - entrega;
   - recados;
   - nota depois da correcao do professor.

## Validacao feita

- `npm run build` passando.
- Rotas principais carregando localmente:
  - `/`
  - `/login`
  - `/register/teacher`
  - `/register/student`
  - `/teacher`
  - `/student`
- API retorna aviso claro quando as variaveis do Supabase ainda nao estao configuradas.
