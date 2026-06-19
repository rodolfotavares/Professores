'use client';

import { GlassCard } from '@/components/AppShell';

const androidSteps = [
  'Abra o Lumina no Chrome do Android.',
  'Toque nos tres pontinhos no canto superior direito.',
  'Escolha Instalar app ou Adicionar a tela inicial.',
  'Confirme em Instalar.',
  'Depois disso, abra o Lumina pelo icone criado na tela inicial.',
];

const iphoneSteps = [
  'Abra o Lumina no Safari do iPhone.',
  'Toque no botao Compartilhar, o icone de um quadrado com uma seta para cima.',
  'Role as opcoes e toque em Adicionar a Tela de Inicio.',
  'Confira o nome Lumina e toque em Adicionar.',
  'Depois disso, abra o Lumina pelo icone criado na tela inicial.',
];

const studentLoginSteps = [
  'O professor abre Configuracoes e copia o Codigo do professor.',
  'O professor envia esse codigo para o aluno pelo WhatsApp ou informa durante a aula.',
  'O aluno abre o Lumina e toca em Sou aluno ou Cadastro de aluno.',
  'O aluno preenche nome, e-mail, WhatsApp, senha e confirma a senha.',
  'No campo Codigo do professor, o aluno cola o codigo recebido.',
  'Depois do cadastro, o aluno entra pelo Login usando o e-mail e a senha criados.',
  'Se o aluno entrar no portal errado, oriente-o a sair e fazer login novamente com a conta correta.',
];

export function InstallTutorialPanel() {
  return (
    <div className="stack portal-tab">
      <div className="section-intro">
        <span className="eyebrow">Lumina</span>
        <h2>Instalar na tela inicial</h2>
        <p>Use este guia para transformar o Lumina em um app no celular, sem precisar baixar pela loja.</p>
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
          No iPhone, use o Safari. No Android, use o Chrome. Depois de instalado, o Lumina abre em tela cheia,
          como um aplicativo comum, mantendo login, agenda, atividades e mensagens sincronizados.
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
