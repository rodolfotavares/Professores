'use client';

import { GlassCard } from '@/components/AppShell';

const androidSteps = [
  'Abra o LuminaAI no Chrome do Android.',
  'Toque nos tres pontos no canto superior direito.',
  'Escolha Instalar app ou Adicionar a tela inicial.',
  'Confirme em Instalar.',
  'Depois disso, abra o LuminaAI pelo icone criado na tela inicial.',
];

const iphoneSteps = [
  'Abra o LuminaAI no Safari do iPhone.',
  'Toque no botao Compartilhar, o icone de um quadrado com uma seta para cima.',
  'Role as opcoes e toque em Adicionar a Tela de Inicio.',
  'Confira o nome LuminaAI e toque em Adicionar.',
  'Depois disso, abra o LuminaAI pelo icone criado na tela inicial.',
];

const studentLoginSteps = [
  'O professor abre a aba Alunos, seleciona o aluno ou cria um novo cadastro.',
  'No painel lateral, o professor clica em Copiar link de acesso do aluno.',
  'O professor envia esse link pelo WhatsApp para o aluno ou responsavel.',
  'Se o aluno ainda nao tiver conta, ele abre o link e cria a conta de aluno normalmente.',
  'Se o aluno ja tiver conta, ele entra no portal do aluno e cola o token do convite em Perfil > Vincular convite.',
  'O codigo antigo do professor continua funcionando como alternativa no cadastro.',
  'Depois do cadastro, o aluno entra pelo Login usando o e-mail e a senha criados.',
];

export function InstallTutorialPanel() {
  return (
    <div className="stack portal-tab">
      <div className="section-intro">
        <span className="eyebrow">LuminaAI</span>
        <h2>Instalar na tela inicial</h2>
        <p>Use este guia para transformar o LuminaAI em um app no celular, sem precisar baixar pela loja.</p>
      </div>

      <div className="grid grid-2">
        <TutorialCard title="Android" subtitle="Chrome" steps={androidSteps} />
        <TutorialCard title="iPhone" subtitle="Safari" steps={iphoneSteps} />
      </div>

      <TutorialCard title="Como ajudar o aluno a entrar" subtitle="Login do aluno" steps={studentLoginSteps} />

      <GlassCard className="portal-summary-card install-note-card">
        <div className="glass-card-head">
          <strong>Dica importante</strong>
          <span>PWA</span>
        </div>
        <p className="muted">
          No iPhone, use o Safari. No Android, use o Chrome. Depois de instalado, o LuminaAI abre em tela cheia,
          como um aplicativo comum, mantendo login, agenda, evolução e mensagens sincronizados.
        </p>
      </GlassCard>
    </div>
  );
}

function TutorialCard({ title, subtitle, steps }: { title: string; subtitle: string; steps: string[] }) {
  return (
    <GlassCard className="tutorial-card">
      <div className="glass-card-head">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <ol className="tutorial-steps">
        {steps.map((step) => (
          <li key={step}>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

