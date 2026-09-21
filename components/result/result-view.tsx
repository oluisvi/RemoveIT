"use client";
import { Download, Pencil, Plus } from "lucide-react";
import { BeforeAfter } from "./before-after";

export function ResultView({ originalUrl, resultUrl, onEdit, onReset }: { originalUrl: string; resultUrl: string; onEdit: () => void; onReset: () => void }) {
  return <section className="result-shell"><header><span>Etapa 3 de 3</span><h2>Sua imagem está pronta.</h2><p>Arraste o controle para comparar o antes e depois.</p></header><BeforeAfter originalUrl={originalUrl} resultUrl={resultUrl} /><div className="result-actions"><a className="download-button" href={resultUrl} download="removeit-resultado.png"><Download size={17} /> Baixar resultado</a><button onClick={onEdit}><Pencil size={16} /> Ajustar máscara</button><button onClick={onReset}><Plus size={16} /> Nova imagem</button></div></section>;
}
