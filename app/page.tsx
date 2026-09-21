import { ArrowUpRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { RemoveItWorkflow } from "@/components/workflow/removeit-workflow";

export default function Home() {
  return (
    <main className="landing-shell">
      <nav className="site-nav" aria-label="Navegação principal">
        <a className="brand" href="#top" aria-label="RemoveIT, página inicial">
          <span className="brand-mark"><Sparkles size={16} /></span>
          <span>Remove<span>IT</span></span>
        </a>
        <div className="nav-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="#privacidade">Privacidade</a>
        </div>
        <a className="nav-cta" href="#upload">Começar <ArrowUpRight size={14} /></a>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> Edição inteligente de imagens</div>
        <h1>Fotos limpas.<br /><em>Em poucos segundos.</em></h1>
        <p>A IA encontra marcas d&apos;água, reconstrói o fundo e mantém você no controle de cada detalhe.</p>

        <RemoveItWorkflow />

        <div className="trust-row" id="privacidade">
          <span><ShieldCheck size={16} /> Processamento seguro</span>
          <span><Check size={16} /> Exclusão automática</span>
          <span><Check size={16} /> Sem perda de resolução</span>
        </div>
      </section>

      <section className="steps-preview" id="como-funciona" aria-label="Como funciona">
        <article><b>01</b><h3>Envie</h3><p>Escolha uma imagem sua ou que você tenha autorização para editar.</p></article>
        <article><b>02</b><h3>Revise</h3><p>A IA destaca a marca e você pode ajustar a seleção com precisão.</p></article>
        <article><b>03</b><h3>Baixe</h3><p>Compare o antes e depois e salve a imagem reconstruída.</p></article>
      </section>
    </main>
  );
}
