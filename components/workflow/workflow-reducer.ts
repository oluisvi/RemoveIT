export type ReviewJob = { jobId: string; status: "review"; imageUrl: string; maskUrl: string; confidence: number; warnings: string[] };
export type WorkflowState = { phase: "idle" | "uploading" | "review" | "processing" | "result" | "error"; job?: ReviewJob; resultUrl?: string; message?: string };
export type WorkflowEvent =
  | { type: "UPLOAD_STARTED" }
  | { type: "DETECTION_READY"; job: ReviewJob }
  | { type: "PROCESS_STARTED" }
  | { type: "PROCESS_COMPLETE"; resultUrl: string }
  | { type: "RECOVERABLE_ERROR"; message: string }
  | { type: "RESET" };

export const initialWorkflowState: WorkflowState = { phase: "idle" };

export function workflowReducer(state: WorkflowState, event: WorkflowEvent): WorkflowState {
  switch (event.type) {
    case "UPLOAD_STARTED": return { phase: "uploading" };
    case "DETECTION_READY": return { phase: "review", job: event.job };
    case "PROCESS_STARTED": if (!state.job) return state; return { ...state, phase: "processing", message: undefined };
    case "PROCESS_COMPLETE": if (!state.job) return state; return { ...state, phase: "result", resultUrl: event.resultUrl, message: undefined };
    case "RECOVERABLE_ERROR": return state.job ? { ...state, phase: "review", message: event.message } : { phase: "error", message: event.message };
    case "RESET": return initialWorkflowState;
  }
}
