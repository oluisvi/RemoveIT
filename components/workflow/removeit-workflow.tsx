"use client";
import { useReducer } from "react";
import { UploadPanel } from "@/components/upload/upload-panel";
import { initialWorkflowState, workflowReducer } from "@/components/workflow/workflow-reducer";

export function RemoveItWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialWorkflowState);
  if (state.job) return <section className="workflow-card" aria-live="polite"><p>Detecção concluída</p><h2>Revise a área encontrada</h2><span>{Math.round(state.job.confidence * 100)}% de confiança</span><button onClick={() => dispatch({ type: "RESET" })}>Escolher outra imagem</button></section>;
  return <UploadPanel onUploading={() => dispatch({ type: "UPLOAD_STARTED" })} onCreated={(job) => dispatch({ type: "DETECTION_READY", job })} />;
}
