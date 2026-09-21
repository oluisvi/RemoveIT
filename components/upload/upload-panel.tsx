"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewJob } from "@/components/workflow/workflow-reducer";

type Props = { onCreated: (job: ReviewJob) => void; onUploading?: () => void; fetcher?: typeof fetch };

export function UploadPanel({ onCreated, onUploading, fetcher = fetch }: Props) {
  const [file, setFile] = useState<File>();
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file) { setMessage("Escolha uma imagem para continuar."); return; }
    if (!authorized) { setMessage("Confirme que possui ou tem autorização para editar esta imagem."); return; }
    if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 20 * 1024 * 1024) { setMessage("Use JPG, PNG ou WebP de até 20 MB."); return; }
    setBusy(true); setMessage("Analisando a imagem…"); onUploading?.();
    const body = new FormData(); body.set("image", file); body.set("authorized", "true");
    try {
      const response = await fetcher("/api/jobs", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível analisar a imagem.");
      onCreated(payload as ReviewJob);
    } catch (error) { setMessage((error as Error).message); setBusy(false); }
  }

  return <div className="upload-card" id="upload" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const next = e.dataTransfer.files[0]; if (next) setFile(next); }}>
    <div className="upload-orbit"><ImageIcon size={28} /></div>
    <h2>{file ? file.name : "Solte sua imagem aqui"}</h2>
    <p>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "ou escolha um arquivo do seu dispositivo"}</p>
    <input ref={inputRef} id="image-upload" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher imagem" onChange={(e) => setFile(e.target.files?.[0])} />
    {!file && <Button onClick={() => inputRef.current?.click()}>Escolher imagem <ArrowUpRight size={16} /></Button>}
    {file && <Button onClick={submit} disabled={busy}>{busy ? "Analisando…" : "Analisar imagem"} <ArrowUpRight size={16} /></Button>}
    <label className="consent"><input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} /> Confirmo que possuo ou tenho autorização para editar esta imagem.</label>
    <small>JPG, PNG ou WebP · até 20 MB</small>
    <p className="upload-message" role="status" aria-live="polite">{message}</p>
  </div>;
}
