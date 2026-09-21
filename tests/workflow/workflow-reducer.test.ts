import { expect, it } from "vitest";
import { initialWorkflowState, workflowReducer } from "@/components/workflow/workflow-reducer";

it("preserva o trabalho ao receber erro recuperável", () => {
  const review = workflowReducer(initialWorkflowState, { type: "DETECTION_READY", job: { jobId: "j1", status: "review", imageUrl: "/i", maskUrl: "/m", confidence: .8, warnings: [] } });
  const errored = workflowReducer(review, { type: "RECOVERABLE_ERROR", message: "Falhou" });
  expect(errored).toMatchObject({ phase: "review", job: { jobId: "j1" }, message: "Falhou" });
});

