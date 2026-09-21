"use client";
import { useEffect, useState } from "react";

const eventName = "removeit-history-change";
export function SessionHistory({ jobId, onOpen }: { jobId: string; onOpen?: (id: string) => void }) {
  const [ids, setIds] = useState<string[]>([jobId]);
  useEffect(() => {
    const listener = (event: Event) => setIds((event as CustomEvent<string[]>).detail);
    window.addEventListener(eventName, listener);
    const stored = JSON.parse(sessionStorage.getItem("removeit_jobs") || "[]") as string[];
    const next = [jobId, ...stored.filter((id) => id !== jobId)].slice(0, 8);
    sessionStorage.setItem("removeit_jobs", JSON.stringify(next));
    queueMicrotask(() => window.dispatchEvent(new CustomEvent(eventName, { detail: next })));
    return () => window.removeEventListener(eventName, listener);
  }, [jobId]);
  if (ids.length < 2) return null;
  return <aside className="session-history"><strong>Nesta sessão</strong>{ids.map((id) => <button key={id} onClick={() => onOpen?.(id)}>Imagem {id.slice(0, 6)}</button>)}</aside>;
}
