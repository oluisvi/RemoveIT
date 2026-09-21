"use client";
import { useReducer } from "react";
import { UploadPanel } from "@/components/upload/upload-panel";
import { MaskEditor } from "@/components/editor/mask-editor";
import { ResultView } from "@/components/result/result-view";
import { initialWorkflowState, workflowReducer } from "@/components/workflow/workflow-reducer";

export function RemoveItWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialWorkflowState);
  if (state.phase === "result" && state.job && state.resultUrl) return <ResultView originalUrl={state.job.imageUrl} resultUrl={state.resultUrl} onEdit={() => dispatch({ type: "DETECTION_READY", job: state.job! })} onReset={() => dispatch({ type: "RESET" })} />;
  if (state.job) return <MaskEditor imageUrl={state.job.imageUrl} maskUrl={state.job.maskUrl} confidence={state.job.confidence} busy={state.phase === "processing"} message={state.message} onProcess={async () => { dispatch({ type: "PROCESS_STARTED" }); try { const response = await fetch(`/api/jobs/${state.job!.jobId}/process`, { method: "POST" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); dispatch({ type: "PROCESS_COMPLETE", resultUrl: payload.resultUrl }); } catch (error) { dispatch({ type: "RECOVERABLE_ERROR", message: (error as Error).message }); } }} />;
  return <UploadPanel onUploading={() => dispatch({ type: "UPLOAD_STARTED" })} onCreated={(job) => dispatch({ type: "DETECTION_READY", job })} />;
}
