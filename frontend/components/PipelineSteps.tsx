import { TextAction } from "@/components/Button";

interface Step {
  label: string;
  doneLabel: string;
  done: boolean;
  disabled: boolean;
  onRun: () => void;
}

interface PipelineStepsProps {
  steps: Step[];
  busy: boolean;
}

export default function PipelineSteps({ steps, busy }: PipelineStepsProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div
          key={step.label}
          className="flex items-center justify-between py-2.5"
          style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "0.625rem",
                border: `1px solid ${step.done ? "var(--status-good)" : "var(--border-strong)"}`,
                color: step.done ? "var(--status-good)" : "var(--text-muted)",
              }}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "0.875rem",
                color: step.done ? "var(--text-secondary)" : "var(--text-primary)",
              }}
            >
              {step.label}
            </span>
          </span>
          <TextAction onClick={step.onRun} disabled={busy || step.disabled}>
            {step.done ? step.doneLabel : "Run"}
          </TextAction>
        </div>
      ))}
    </div>
  );
}
