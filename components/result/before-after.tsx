"use client";
import { useState } from "react";

export function BeforeAfter({ originalUrl, resultUrl }: { originalUrl: string; resultUrl: string }) {
  const [split, setSplit] = useState(50);
  return <div className="comparison"><div className="comparison-images">
    {/* eslint-disable-next-line @next/next/no-img-element */}<img src={originalUrl} alt="Imagem original" />
    <div className="result-clip" style={{ width: `${split}%` }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={resultUrl} alt="Imagem sem marca d'água" /></div>
    <span className="comparison-line" style={{ left: `${split}%` }} />
  </div><input type="range" min="0" max="100" value={split} aria-label="Comparar imagem original e resultado" onChange={(e) => setSplit(Number(e.currentTarget.value))} /></div>;
}
