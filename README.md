# Professores - EduAssist Pro

App para professores e alunos, feito fora do Base44 com Next.js e Supabase.

## O que este app faz

- Cadastro de professor com codigo de acesso.
- Cadastro de aluno vinculado ao professor pelo codigo.
- Painel do professor com alunos, agenda, atividades e recados.
- Painel do aluno com agenda, atividades, entregas, notas e recados.
- Criacao de aluno pelo professor com dias e horario ja gerando aulas futuras na agenda.
- APIs centralizadas em `/api` para evitar divergencia de sincronizacao entre paginas.

## Configuracao local

1. Crie um projeto no Supabase.
2. Abra o SQL Editor no Supabase e rode `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
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
