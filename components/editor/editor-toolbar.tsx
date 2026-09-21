"use client";
import { Brush, Eraser, Hand, Sparkles } from "lucide-react";
import type { MaskTool } from "./mask-canvas";

export function EditorToolbar({ tool, onTool }: { tool: MaskTool; onTool: (tool: MaskTool) => void }) {
  return <div className="editor-toolbar" aria-label="Ferramentas da máscara">
    <button className="active"><Sparkles size={17} /> Detecção da IA</button>
    <button aria-pressed={tool === "paint"} onClick={() => onTool("paint")}><Brush size={17} /> Adicionar máscara</button>
    <button aria-pressed={tool === "erase"} onClick={() => onTool("erase")}><Eraser size={17} /> Apagar máscara</button>
    <button aria-pressed={tool === "pan"} onClick={() => onTool("pan")}><Hand size={17} /> Mover imagem</button>
  </div>;
}
