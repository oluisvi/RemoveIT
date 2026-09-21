"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./editor-toolbar";
import type { MaskTool } from "./mask-canvas";

type Props = { imageUrl: string; maskUrl: string; confidence: number; onProcess: (mask?: Blob) => void; busy?: boolean; message?: string };

export function MaskEditor({ imageUrl, maskUrl, confidence, onProcess, busy, message }: Props) {
  const [tool, setTool] = useState<MaskTool>("paint");
  const [brush, setBrush] = useState(32);
  const level = confidence >= .75 ? "alta" : confidence >= .4 ? "média" : "baixa";
  return <section className="editor-shell" data-testid="mask-editor">
    <header className="editor-header"><div><span>Etapa 2 de 3</span><h2>Revise a área detectada</h2></div><div className={`confidence confidence-${level}`}><CheckCircle2 size={16} /> Confiança {level} · {Math.round(confidence * 100)}%</div></header>
    <div className="editor-grid">
      <EditorToolbar tool={tool} onTool={setTool} />
      <div className="image-stage" aria-label="Prévia da imagem e máscara">
        {/* The overlay is intentionally visible and editable controls remain outside the bitmap. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageUrl} alt="Imagem original para edição" />
        {/* eslint-disable-next-line @next/next/no-img-element */}<img className="mask-overlay" src={maskUrl} alt="Máscara detectada pela IA" />
      </div>
      <aside className="editor-controls"><div className="ai-notice"><strong>Marca d&apos;água encontrada</strong><p>A área em roxo será reconstruída. Use as ferramentas para corrigir.</p></div><label>Tamanho do pincel <output>{brush} px</output><input type="range" min="4" max="96" value={brush} onChange={(e) => setBrush(Number(e.target.value))} /></label><Button onClick={() => onProcess()} disabled={busy}>{busy ? "Reconstruindo…" : "Remover marca d'água"}</Button><button className="text-action"><RotateCcw size={14} /> Redetectar</button><p role="status">{message}</p></aside>
    </div>
  </section>;
}
