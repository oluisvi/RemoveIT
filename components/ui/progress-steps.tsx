export type ProgressStepsProps = { current: 1 | 2 | 3 };
const labels = ["Enviar", "Revisar", "Resultado"];

export function ProgressSteps({ current }: ProgressStepsProps) {
  return <ol className="progress-steps" aria-label={`Etapa ${current} de 3`}>
    {labels.map((label, index) => <li key={label} data-active={index + 1 <= current}><span>{index + 1}</span>{label}</li>)}
  </ol>;
}
