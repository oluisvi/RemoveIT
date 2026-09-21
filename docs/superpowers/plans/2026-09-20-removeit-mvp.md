# RemoveIT MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um aplicativo web em português que detecta prováveis marcas d'água em imagens, permite revisar a máscara, executa inpainting real e entrega o resultado para comparação e download.

**Architecture:** Um aplicativo Next.js App Router contém a experiência web, os Route Handlers e o armazenamento temporário de trabalhos. Um serviço Python separado expõe dois contratos privados — detecção/segmentação e inpainting — para que o frontend nunca conheça modelos ou credenciais; em desenvolvimento ele pode rodar localmente e, em produção, como serviço GPU. O domínio web depende de uma interface `InferenceProvider`, permitindo testes determinísticos e troca futura de infraestrutura.

**Tech Stack:** Node.js 22 LTS, Next.js 16, React 19, TypeScript estrito, Tailwind CSS 4, Zod, Sharp, Vitest, Testing Library, Playwright, Python 3.12, FastAPI, PyTorch, Transformers, Pillow, OpenCV e Simple LaMa Inpainting.

**Spec:** `docs/superpowers/specs/2026-09-20-removeit-design.md`

## Global Constraints

- Processar somente JPG, PNG e WebP de até 20 MB.
- Exigir confirmação explícita de propriedade ou autorização em cada novo envio.
- Não manter galeria pública, conta, cobrança ou armazenamento permanente no MVP.
- Remover EXIF antes de enviar a imagem ao pipeline de IA.
- Manter chaves, modelos e processamento sensível fora do navegador.
- Usar português brasileiro em toda cópia visível.
- Preservar a direção visual aprovada: clara, acolhedora, violeta como ação principal, superfícies leves e movimento contido.
- Suportar teclado, foco visível, redução de movimento e layouts de celular pequeno a desktop grande.
- Nunca apresentar saída parcial como resultado concluído.

## Review Focus

- Arquivo com extensão válida e conteúdo executável deve ser rejeitado antes da persistência; teste em Task 3.
- Texto legítimo da cena detectado como marca deve poder ser removido da máscara antes do inpainting; teste em Task 7.
- Trabalho expirado não pode expor original, máscara ou resultado; teste em Task 2 e Task 9.
- Timeout ou falha da inferência deve preservar máscara editável e permitir nova tentativa; teste em Task 5 e Task 8.
- Usuário sem mouse deve conseguir enviar, revisar, processar, comparar e baixar; teste em Task 10.

---

## File Map

```text
app/
  api/jobs/route.ts                 criação do trabalho e upload
  api/jobs/[jobId]/route.ts         leitura do estado e cancelamento
  api/jobs/[jobId]/mask/route.ts    gravação da máscara revisada
  api/jobs/[jobId]/process/route.ts inicia inpainting
  api/jobs/[jobId]/result/route.ts  download autorizado e temporário
  layout.tsx                        shell, metadados e fontes
  page.tsx                          composição da experiência
components/
  upload/upload-panel.tsx           consentimento e envio
  editor/mask-editor.tsx            canvas e edição da máscara
  editor/editor-toolbar.tsx         ferramentas acessíveis
  result/result-view.tsx            comparação e download
  workflow/removeit-workflow.tsx    máquina de estados da sessão
lib/
  contracts/job.ts                  tipos e schemas compartilhados
  jobs/job-store.ts                 contrato de persistência temporária
  jobs/file-job-store.ts            implementação em disco para o MVP
  images/validate-image.ts           inspeção por conteúdo e limites
  images/normalize-image.ts          rotação, EXIF e formato seguro
  inference/provider.ts              contrato do pipeline privado
  inference/http-provider.ts         cliente do serviço Python
  security/rate-limit.ts             limite por origem/sessão
  session/session-id.ts              cookie assinado de sessão
  env.ts                             validação de ambiente
inference/
  app/main.py                        API privada FastAPI
  app/schemas.py                     contratos Pydantic
  app/detector.py                    detecção e segmentação
  app/inpainter.py                   reconstrução da máscara
  tests/                              testes unitários do serviço
  Dockerfile                          imagem para serviço GPU
tests/                                testes Vitest por responsabilidade
e2e/removeit.spec.ts                 fluxo completo e acessibilidade
```

## Task 1: Scaffold executável e sistema visual

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `components/ui/button.tsx`, `components/ui/progress-steps.tsx`
- Test: `tests/ui/home-shell.test.tsx`

**Interfaces:**
- Consumes: nenhuma.
- Produces: `ButtonProps`, `ProgressStepsProps` e os tokens CSS usados por todas as telas.

- [ ] **Step 1: Write the failing shell test**

```tsx
// tests/ui/home-shell.test.tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

it("apresenta a promessa e a ação principal em português", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /fotos limpas/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /escolher imagem/i })).toBeEnabled();
});
```

- [ ] **Step 2: Scaffold and verify the test fails for the missing page**

Run: `npm install && npm test -- tests/ui/home-shell.test.tsx`

Expected: FAIL porque `app/page.tsx` ainda não fornece o conteúdo esperado.

- [ ] **Step 3: Implement the typed shell and visual tokens**

```tsx
// app/page.tsx
import { UploadPanel } from "@/components/upload/upload-panel";

export default function Home() {
  return <main><h1>Fotos limpas. Em poucos segundos.</h1><UploadPanel /></main>;
}
```

Definir em `app/globals.css` tokens semânticos `--canvas`, `--surface`, `--text`, `--muted`, `--brand`, `--brand-hover`, `--border`, `--success`, `--warning`, `--danger`, escala de espaço, raios e foco. Incluir `@media (prefers-reduced-motion: reduce)` anulando animações não essenciais.

- [ ] **Step 4: Run unit and production build checks**

Run: `npm test -- tests/ui/home-shell.test.tsx && npm run build`

Expected: PASS e build Next.js concluído.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts postcss.config.mjs app components/ui tests/ui
git commit -m "feat: scaffold RemoveIT web experience"
```

## Task 2: Contratos de trabalho e armazenamento temporário

**Files:**
- Create: `lib/contracts/job.ts`
- Create: `lib/jobs/job-store.ts`, `lib/jobs/file-job-store.ts`
- Test: `tests/jobs/file-job-store.test.ts`

**Interfaces:**
- Consumes: Node.js filesystem e relógio injetável.
- Produces: `Job`, `JobStatus`, `JobStore.create`, `JobStore.get`, `JobStore.update`, `JobStore.delete`, `JobStore.purgeExpired`.

- [ ] **Step 1: Write failing lifecycle and expiry tests**

```ts
it("remove todos os artefatos quando o trabalho expira", async () => {
  const clock = () => new Date("2026-09-20T12:00:00Z");
  const store = new FileJobStore(tempDir, clock);
  const job = await store.create({ sessionId: "s1", expiresAt: "2026-09-20T11:59:00Z" });
  await store.purgeExpired();
  await expect(store.get(job.id, "s1")).resolves.toBeNull();
  expect(await readdir(tempDir)).toEqual([]);
});
```

- [ ] **Step 2: Run tests to verify the missing store fails**

Run: `npm test -- tests/jobs/file-job-store.test.ts`

Expected: FAIL com módulo `file-job-store` ausente.

- [ ] **Step 3: Implement schemas and store boundaries**

```ts
export type JobStatus = "detecting" | "review" | "processing" | "complete" | "failed" | "canceled";

export interface JobStore {
  create(input: CreateJobInput): Promise<Job>;
  get(id: string, sessionId: string): Promise<Job | null>;
  update(id: string, sessionId: string, patch: JobPatch): Promise<Job>;
  delete(id: string, sessionId: string): Promise<void>;
  purgeExpired(now?: Date): Promise<number>;
}
```

Usar UUID aleatório, um diretório por trabalho, gravação atômica de `job.json` e comparação de `sessionId` em toda leitura. A exclusão deve resolver o caminho absoluto e confirmar que ele permanece dentro de `REMOVEIT_TMP_DIR` antes de apagar recursivamente.

- [ ] **Step 4: Run lifecycle tests**

Run: `npm test -- tests/jobs/file-job-store.test.ts`

Expected: PASS para criação, isolamento por sessão, atualização, cancelamento e expiração.

- [ ] **Step 5: Commit**

```bash
git add lib/contracts lib/jobs tests/jobs
git commit -m "feat: add temporary job lifecycle"
```

## Task 3: Ingestão e normalização segura de imagens

**Files:**
- Create: `lib/images/validate-image.ts`, `lib/images/normalize-image.ts`
- Create: `tests/fixtures/images/valid.jpg`, `tests/fixtures/images/polyglot.jpg`
- Test: `tests/images/validate-image.test.ts`, `tests/images/normalize-image.test.ts`

**Interfaces:**
- Consumes: `File | Blob`, Sharp.
- Produces: `validateImage(buffer): Promise<ImageInfo>` e `normalizeImage(buffer): Promise<NormalizedImage>`.

- [ ] **Step 1: Write failing content validation tests**

```ts
it("rejeita extensão jpg quando o conteúdo não é uma imagem", async () => {
  const malicious = Buffer.from("MZ executable payload");
  await expect(validateImage(malicious, "foto.jpg")).rejects.toMatchObject({ code: "INVALID_IMAGE" });
});

it("rejeita conteúdo acima de 20 MB antes de decodificar", async () => {
  await expect(validateImage(Buffer.alloc(20 * 1024 * 1024 + 1), "large.png"))
    .rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
});
```

- [ ] **Step 2: Run tests and observe missing validators**

Run: `npm test -- tests/images`

Expected: FAIL com exports ausentes.

- [ ] **Step 3: Implement decode-first validation and normalization**

```ts
export type NormalizedImage = {
  buffer: Buffer;
  mime: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};
```

Usar `sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 })`, aceitar apenas `jpeg|png|webp`, autorrotacionar e regravar sem `withMetadata()`. Preservar alpha em PNG/WebP e usar JPEG de qualidade 95 quando não houver alpha.

- [ ] **Step 4: Verify EXIF removal and supported formats**

Run: `npm test -- tests/images`

Expected: PASS incluindo conteúdo falso, limite, pixels excessivos, rotação e remoção de EXIF.

- [ ] **Step 5: Commit**

```bash
git add lib/images tests/images tests/fixtures/images
git commit -m "feat: validate and sanitize image uploads"
```

## Task 4: Serviço privado de detecção, segmentação e inpainting

**Files:**
- Create: `inference/pyproject.toml`, `inference/Dockerfile`
- Create: `inference/app/main.py`, `inference/app/schemas.py`
- Create: `inference/app/detector.py`, `inference/app/inpainter.py`
- Test: `inference/tests/test_api.py`, `inference/tests/test_detector.py`, `inference/tests/test_inpainter.py`

**Interfaces:**
- Consumes: imagem normalizada multipart, máscara PNG opcional.
- Produces: `POST /v1/detect -> DetectionResponse` e `POST /v1/inpaint -> image/png`.

- [ ] **Step 1: Write failing private API contract tests**

```py
def test_detect_returns_normalized_mask_and_confidence(client, monkeypatch, sample_image):
    monkeypatch.setattr("app.main.detect_watermark", lambda _: (mask_bytes(), 0.94, ["overlay-text"]))
    response = client.post("/v1/detect", files={"image": ("input.png", sample_image, "image/png")})
    assert response.status_code == 200
    body = response.json()
    assert body["confidence"] == 0.94
    assert body["maskDataUrl"].startswith("data:image/png;base64,")
```

- [ ] **Step 2: Run Python tests and confirm missing application failure**

Run: `cd inference && python -m pytest tests -q`

Expected: FAIL porque `app.main` não existe.

- [ ] **Step 3: Implement detection and segmentation pipeline**

```py
class DetectionResponse(BaseModel):
    confidence: float = Field(ge=0, le=1)
    maskDataUrl: str
    warnings: list[str]

def detect_watermark(image: Image.Image) -> tuple[bytes, float, list[str]]:
    candidates = grounding_detector.find(image, ["watermark", "logo overlay", "signature overlay"])
    mask = segmenter.segment(image, candidates.boxes)
    return encode_mask(mask), calibrated_confidence(candidates), candidates.warnings
```

Fixar `microsoft/Florence-2-large-ft` como detector visual, `facebook/sam2.1-hiera-large` como segmentador e o checkpoint Big-LaMa fornecido por `simple-lama-inpainting` como reconstrutor. Carregar os modelos uma vez no lifespan do FastAPI. O detector produz caixas candidatas; o segmentador cria máscara binária no tamanho exato da imagem; pós-processamento fecha pequenos vazios e dilata no máximo 2 px. Se não houver candidato confiável, retornar máscara transparente, confiança abaixo de `0.35` e aviso `manual-review-required`.

- [ ] **Step 4: Implement mask-validated inpainting**

```py
def inpaint(image: Image.Image, mask: Image.Image) -> Image.Image:
    if image.size != mask.size:
        raise MaskSizeMismatch()
    binary = normalize_mask(mask)
    if binary.getbbox() is None:
        raise EmptyMask()
    return inpainter_model(image, binary)
```

Rejeitar máscara vazia ou de dimensões diferentes; devolver PNG completo somente após a inferência finalizar. O `Dockerfile` expõe porta 8000, executa como usuário não-root e define healthcheck `/health`.

- [ ] **Step 5: Run service tests and image contract checks**

Run: `cd inference && python -m pytest tests -q`

Expected: PASS para candidato encontrado, baixa confiança, máscara vazia, dimensões divergentes e saída PNG válida.

- [ ] **Step 6: Commit**

```bash
git add inference
git commit -m "feat: add private watermark inference service"
```

## Task 5: Adaptador de inferência e API de trabalhos

**Files:**
- Create: `lib/env.ts`, `lib/inference/provider.ts`, `lib/inference/http-provider.ts`
- Create: `app/api/jobs/route.ts`, `app/api/jobs/[jobId]/route.ts`
- Create: `app/api/jobs/[jobId]/mask/route.ts`, `app/api/jobs/[jobId]/process/route.ts`
- Create: `app/api/jobs/[jobId]/result/route.ts`
- Test: `tests/api/jobs.test.ts`, `tests/inference/http-provider.test.ts`

**Interfaces:**
- Consumes: `JobStore`, `NormalizedImage`, serviço privado `/v1/detect` e `/v1/inpaint`.
- Produces: endpoints da sessão e `InferenceProvider.detect`, `InferenceProvider.inpaint`.

- [ ] **Step 1: Write failing provider timeout and retry-state tests**

```ts
it("mantém a máscara e marca falha recuperável após timeout", async () => {
  provider.inpaint.mockRejectedValue(new InferenceTimeoutError());
  const response = await processJob(requestFor(job.id));
  expect(response.status).toBe(504);
  expect((await store.get(job.id, "s1"))?.status).toBe("review");
  expect(await fileExists(job.maskPath!)).toBe(true);
});
```

- [ ] **Step 2: Run API tests to verify missing routes fail**

Run: `npm test -- tests/api tests/inference`

Expected: FAIL com Route Handlers e provider ausentes.

- [ ] **Step 3: Implement the provider contract**

```ts
export interface InferenceProvider {
  detect(image: Buffer, signal: AbortSignal): Promise<DetectionResult>;
  inpaint(image: Buffer, mask: Buffer, signal: AbortSignal): Promise<Buffer>;
}
```

O cliente HTTP deve usar `AbortSignal.timeout(INFERENCE_TIMEOUT_MS)`, header interno `Authorization: Bearer ${INFERENCE_SERVICE_TOKEN}`, validar JSON com Zod e converter erros em `InferenceTimeoutError`, `InferenceUnavailableError` ou `InferenceRejectedError`.

- [ ] **Step 4: Implement session-scoped Route Handlers**

```ts
// POST /api/jobs response
type CreateJobResponse = {
  jobId: string;
  status: "review";
  imageUrl: string;
  maskUrl: string;
  confidence: number;
  warnings: string[];
};
```

`POST /api/jobs` exige `authorized=true`, valida e normaliza a imagem, cria o trabalho, chama detecção e salva a máscara. `PUT /mask` aceita PNG binário com dimensões iguais ao original. `POST /process` muda `review -> processing -> complete` apenas depois de salvar a saída integral. `DELETE /jobs/[jobId]` cancela e apaga. Todas as rotas exigem a mesma sessão do criador.

- [ ] **Step 5: Run API integration tests**

Run: `npm test -- tests/api tests/inference`

Expected: PASS para consentimento ausente, upload válido, isolamento de sessão, baixa confiança, timeout, retry, processamento, download e cancelamento.

- [ ] **Step 6: Commit**

```bash
git add lib/env.ts lib/inference app/api tests/api tests/inference
git commit -m "feat: expose secure image processing jobs"
```

## Task 6: Upload e máquina de estados da sessão

**Files:**
- Create: `components/upload/upload-panel.tsx`
- Create: `components/workflow/removeit-workflow.tsx`
- Create: `components/workflow/workflow-reducer.ts`
- Modify: `app/page.tsx`
- Test: `tests/workflow/workflow-reducer.test.ts`, `tests/upload/upload-panel.test.tsx`

**Interfaces:**
- Consumes: `POST /api/jobs`, `CreateJobResponse`.
- Produces: estados `idle | uploading | review | processing | result | error` e eventos tipados do fluxo.

- [ ] **Step 1: Write failing consent and upload tests**

```tsx
it("não envia sem confirmação de autorização", async () => {
  render(<UploadPanel onCreated={vi.fn()} />);
  await user.upload(screen.getByLabelText(/escolher imagem/i), validFile);
  await user.click(screen.getByRole("button", { name: /analisar imagem/i }));
  expect(screen.getByText(/confirme que possui/i)).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run component tests and confirm failure**

Run: `npm test -- tests/upload tests/workflow`

Expected: FAIL porque os componentes não existem.

- [ ] **Step 3: Implement explicit workflow transitions**

```ts
type WorkflowEvent =
  | { type: "UPLOAD_STARTED" }
  | { type: "DETECTION_READY"; job: ReviewJob }
  | { type: "PROCESS_STARTED" }
  | { type: "PROCESS_COMPLETE"; resultUrl: string }
  | { type: "RECOVERABLE_ERROR"; message: string }
  | { type: "RESET" };
```

Rejeitar transições impossíveis no reducer, manter trabalho atual em erro recuperável e zerar URLs locais com `URL.revokeObjectURL` no reset/unmount.

- [ ] **Step 4: Implement upload UI and accessible feedback**

Usar input nativo associado a label, área de drop como melhoria progressiva, checkbox persistente somente durante aquele envio, validação client-side como feedback rápido e `aria-live="polite"` para progresso. O servidor continua sendo a autoridade.

- [ ] **Step 5: Run upload tests**

Run: `npm test -- tests/upload tests/workflow`

Expected: PASS para teclado, drop, consentimento, tipo inválido, progresso, erro e sucesso.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/upload components/workflow tests/upload tests/workflow
git commit -m "feat: add authorized image upload workflow"
```

## Task 7: Editor de máscara acessível

**Files:**
- Create: `components/editor/mask-editor.tsx`, `components/editor/editor-toolbar.tsx`
- Create: `components/editor/mask-canvas.ts`, `components/editor/mask-history.ts`
- Test: `tests/editor/mask-canvas.test.ts`, `tests/editor/mask-editor.test.tsx`

**Interfaces:**
- Consumes: `imageUrl`, `maskUrl`, dimensões, confiança e avisos do trabalho.
- Produces: `onMaskChange(blob: Blob)`, `onSubmit(blob: Blob)` e PNG de máscara no tamanho original.

- [ ] **Step 1: Write failing false-positive correction test**

```ts
it("a borracha remove texto legítimo da máscara sem alterar outros pixels", () => {
  const mask = filledMask(20, 20);
  eraseStroke(mask, [{ x: 5, y: 5 }, { x: 8, y: 5 }], 3);
  expect(mask.alphaAt(6, 5)).toBe(0);
  expect(mask.alphaAt(18, 18)).toBe(255);
});
```

- [ ] **Step 2: Run editor tests and confirm missing primitives fail**

Run: `npm test -- tests/editor`

Expected: FAIL com módulo `mask-canvas` ausente.

- [ ] **Step 3: Implement resolution-independent mask editing**

```ts
export type MaskTool = "paint" | "erase" | "pan";
export function viewportToImage(point: Point, transform: ViewTransform): Point;
export function applyStroke(mask: ImageData, points: Point[], radius: number, mode: "paint" | "erase"): void;
```

Guardar a máscara na resolução original em `OffscreenCanvas` quando suportado e fallback para canvas oculto. Converter coordenadas por escala/offset, interpolar entre pontos, limitar histórico a 20 snapshots e exportar PNG em alpha binário.

- [ ] **Step 4: Implement accessible editor controls**

Oferecer botões rotulados para IA, pintar, apagar, mover, original e máscara; sliders nativos para pincel e suavidade; atalhos documentados `B`, `E`, `Space`, `Ctrl+Z`; e ações equivalentes que não dependam do gesto no canvas. A confiança usa ícone, texto e cor.

- [ ] **Step 5: Run editor unit and component tests**

Run: `npm test -- tests/editor`

Expected: PASS para escala, pintura, borracha, undo, máscara vazia, export, atalhos e foco.

- [ ] **Step 6: Commit**

```bash
git add components/editor tests/editor
git commit -m "feat: add AI-assisted mask editor"
```

## Task 8: Processamento, comparação, nova tentativa e download

**Files:**
- Create: `components/result/before-after.tsx`, `components/result/result-view.tsx`
- Create: `components/result/session-history.tsx`
- Modify: `components/workflow/removeit-workflow.tsx`
- Test: `tests/result/before-after.test.tsx`, `tests/result/result-view.test.tsx`

**Interfaces:**
- Consumes: `POST /process`, `GET /jobs/[jobId]`, `GET /result`.
- Produces: comparação acessível, download e retorno ao editor preservando a máscara.

- [ ] **Step 1: Write failing recoverable retry test**

```tsx
it("volta ao editor com a máscara preservada após timeout", async () => {
  server.use(processTimeoutHandler);
  render(<RemoveItWorkflow initialJob={reviewJob} />);
  await user.click(screen.getByRole("button", { name: /remover marca/i }));
  expect(await screen.findByText(/não foi possível concluir/i)).toBeVisible();
  expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeVisible();
  expect(screen.getByTestId("mask-editor")).toHaveAttribute("data-mask-version", "3");
});
```

- [ ] **Step 2: Run result tests and confirm missing view failure**

Run: `npm test -- tests/result`

Expected: FAIL com `ResultView` ausente.

- [ ] **Step 3: Implement polling with terminal-state guarantees**

Consultar o trabalho a cada 1,5 s somente enquanto `processing`; parar ao desmontar, cancelar ou alcançar `complete|review|failed`. Exibir resultado apenas em `complete`. Em erro recuperável, manter `jobId` e máscara; em cancelamento, voltar ao envio.

- [ ] **Step 4: Implement before/after and download**

```tsx
<input
  type="range"
  min="0"
  max="100"
  value={split}
  aria-label="Comparar imagem original e resultado"
  onChange={(event) => setSplit(Number(event.currentTarget.value))}
/>
```

O divisor precisa funcionar por teclado e toque. O download usa nome `removeit-resultado.png`, informa resolução/formato e trata `410 Gone` como resultado expirado, oferecendo novo envio. `SessionHistory` mantém no `sessionStorage` somente IDs ainda válidos desta aba, consulta seus estados ao carregar, descarta respostas `404|410` e permite reabrir ou excluir cada trabalho sem guardar bytes da imagem no navegador.

- [ ] **Step 5: Run result tests**

Run: `npm test -- tests/result tests/workflow`

Expected: PASS para processamento, comparação, timeout, retry, download, histórico da sessão e expiração.

- [ ] **Step 6: Commit**

```bash
git add components/result components/workflow tests/result tests/workflow
git commit -m "feat: add result comparison and recovery"
```

## Task 9: Sessão, rate limiting e limpeza operacional

**Files:**
- Create: `lib/session/session-id.ts`, `lib/security/rate-limit.ts`
- Create: `app/api/internal/cleanup/route.ts`
- Modify: `app/api/jobs/route.ts`, `app/api/jobs/[jobId]/route.ts`
- Create: `.env.example`
- Test: `tests/security/session.test.ts`, `tests/security/rate-limit.test.ts`, `tests/api/cleanup.test.ts`

**Interfaces:**
- Consumes: cookie HTTP-only assinada, `JobStore.purgeExpired`.
- Produces: `getOrCreateSession`, `assertRateLimit` e endpoint autenticado de limpeza.

- [ ] **Step 1: Write failing expiry and rate-limit tests**

```ts
it("não entrega resultado de trabalho expirado", async () => {
  clock.advanceBy(31 * 60 * 1000);
  const response = await getResult(requestFor(job.id));
  expect(response.status).toBe(410);
  expect(await store.get(job.id, session.id)).toBeNull();
});

it("limita novos trabalhos por sessão", async () => {
  for (let i = 0; i < 5; i++) await limiter.consume("session-1");
  await expect(limiter.consume("session-1")).rejects.toMatchObject({ retryAfter: 60 });
});
```

- [ ] **Step 2: Run security tests and verify failure**

Run: `npm test -- tests/security tests/api/cleanup.test.ts`

Expected: FAIL com limitador e sessão ausentes.

- [ ] **Step 3: Implement signed session and bounded limiter**

Cookie `removeit_session` deve ser `HttpOnly`, `Secure` em produção, `SameSite=Lax`, `Path=/` e expirar em 24 h. Assinar com HMAC-SHA256 usando `SESSION_SECRET`. Limitar criação a 5 trabalhos por minuto e processamento a 10 tentativas por hora por sessão; resposta 429 inclui `Retry-After`.

- [ ] **Step 4: Implement authenticated cleanup**

`POST /api/internal/cleanup` exige comparação em tempo constante do header `Authorization: Bearer ${CLEANUP_SECRET}` e chama `purgeExpired`. Configurar `JOB_TTL_MINUTES=30` no exemplo de ambiente. A resposta contém apenas a contagem removida, nunca caminhos.

- [ ] **Step 5: Run security suite**

Run: `npm test -- tests/security tests/api`

Expected: PASS para assinatura inválida, sessão cruzada, limites, `Retry-After`, segredo inválido e expiração integral.

- [ ] **Step 6: Commit**

```bash
git add lib/session lib/security app/api .env.example tests/security tests/api
git commit -m "feat: secure sessions and temporary cleanup"
```

## Task 10: Jornada E2E, responsividade e gate final

**Files:**
- Create: `playwright.config.ts`, `e2e/removeit.spec.ts`
- Create: `e2e/fixtures/mock-inference-server.ts`
- Modify: `app/globals.css`, componentes afetados pelos achados
- Test: `e2e/removeit.spec.ts`

**Interfaces:**
- Consumes: aplicação completa e serviço de inferência simulado por HTTP.
- Produces: evidência executável dos critérios de aceite do MVP.

- [ ] **Step 1: Write the failing keyboard-only E2E path**

```ts
test("conclui o fluxo inteiro somente com teclado", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/possuo ou tenho autorização/i).check();
  await page.getByLabel(/escolher imagem/i).setInputFiles("tests/fixtures/images/valid.jpg");
  await page.getByRole("button", { name: /analisar imagem/i }).click();
  await expect(page.getByText(/confiança alta/i)).toBeVisible();
  await page.getByRole("button", { name: /remover marca/i }).click();
  await expect(page.getByRole("slider", { name: /comparar imagem/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /baixar resultado/i })).toBeVisible();
});
```

- [ ] **Step 2: Run E2E and capture initial failures**

Run: `npx playwright install chromium && npm run test:e2e -- --project=chromium`

Expected: FAIL até o mock privado e a configuração E2E estarem conectados.

- [ ] **Step 3: Implement deterministic inference fixture and full scenarios**

Adicionar cenários de sucesso, confiança baixa, correção manual, timeout recuperável, arquivo falso, cancelamento e expiração. O mock deve devolver máscara e resultado de fixtures reais, sem interceptar a lógica do navegador.

- [ ] **Step 4: Test responsive and reduced-motion variants**

Executar a jornada em 360×800, 768×1024 e 1440×900; garantir ausência de overflow horizontal, canvas utilizável e ação principal visível. Repetir o carregamento com `reducedMotion: "reduce"` e verificar que o progresso permanece compreensível sem animação.

- [ ] **Step 5: Run all quality gates**

Run: `npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build && cd inference && python -m pytest tests -q`

Expected: todos os comandos encerram com código 0.

- [ ] **Step 6: Perform manual browser acceptance**

Abrir o app em Chromium, carregar exemplos com marca transparente, repetida, diagonal, sobre rosto e sobre fundo detalhado. Registrar como defeito qualquer caso em que a máscara não possa ser corrigida ou uma saída parcial apareça como concluída; corrigir antes do commit.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e app/globals.css components
git commit -m "test: verify RemoveIT end-to-end experience"
```

## Execution Notes

- O serviço Python deve ser executado em GPU em produção; o aplicativo web não deve importar bibliotecas de ML.
- O contrato HTTP privado é a fronteira de substituição de modelos. Mudanças de modelo não podem alterar os schemas públicos dos trabalhos.
- As dependências devem ser instaladas em versões estáveis compatíveis com os pisos listados e travadas nos respectivos lockfiles.
- Os pesos definidos na Task 4 devem ter revisão de licença registrada no commit do serviço e um smoke test com imagem representativa antes de aceitar a tarefa.
