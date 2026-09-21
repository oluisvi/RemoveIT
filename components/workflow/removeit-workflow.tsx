"use client";
import { useReducer, useRef } from "react";
import { UploadPanel } from "@/components/upload/upload-panel";
import { MaskEditor } from "@/components/editor/mask-editor";
import { ResultView } from "@/components/result/result-view";
import { initialWorkflowState, workflowReducer } from "@/components/workflow/workflow-reducer";

export function RemoveItWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialWorkflowState);
  const activeRequest = useRef<AbortController | null>(null);
  if (state.phase === "result" && state.job && state.resultUrl) return <ResultView jobId={state.job.jobId} originalUrl={state.job.imageUrl} resultUrl={state.resultUrl} onEdit={() => dispatch({ type: "DETECTION_READY", job: state.job! })} onReset={() => dispatch({ type: "RESET" })} />;
  if (state.job) return <MaskEditor imageUrl={state.job.imageUrl} maskUrl={state.job.maskUrl} confidence={state.job.confidence} busy={state.phase === "processing"} message={state.message} onCancel={async()=>{activeRequest.current?.abort();await fetch(`/api/jobs/${state.job!.jobId}`,{method:"DELETE"});dispatch({type:"RESET"})}} onProcess={async (mask) => { dispatch({ type: "PROCESS_STARTED" }); const controller=new AbortController();activeRequest.current=controller;try { if(mask){const saved=await fetch(`/api/jobs/${state.job!.jobId}/mask`,{method:"PUT",body:mask,signal:controller.signal});if(!saved.ok)throw new Error("Não foi possível salvar a máscara.")} const response = await fetch(`/api/jobs/${state.job!.jobId}/process`, { method: "POST",signal:controller.signal }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); dispatch({ type: "PROCESS_COMPLETE", resultUrl: payload.resultUrl }); } catch (error) { if((error as Error).name!=="AbortError")dispatch({ type: "RECOVERABLE_ERROR", message: (error as Error).message }); } }} />;
  return <UploadPanel onUploading={() => dispatch({ type: "UPLOAD_STARTED" })} onCreated={(job) => dispatch({ type: "DETECTION_READY", job })} />;
}
