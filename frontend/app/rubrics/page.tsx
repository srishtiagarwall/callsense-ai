"use client";

import { useEffect, useState } from "react";
import { createRubric, deleteRubric, listRubrics } from "@/lib/api";
import type { Rubric, RubricCriterion } from "@/lib/types";

function parseCriteriaLines(text: string): RubricCriterion[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...rest] = line.split(":");
      return { id: id.trim(), description: rest.join(":").trim() || id.trim(), weight: 1.0 };
    });
}

function criteriaToLines(criteria: RubricCriterion[]): string {
  return criteria.map((c) => `${c.id}: ${c.description}`).join("\n");
}

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [scriptSteps, setScriptSteps] = useState("");
  const [complianceRules, setComplianceRules] = useState("");
  const [qaCriteria, setQaCriteria] = useState("");

  function load() {
    listRubrics().then(setRubrics).catch(() => setRubrics([]));
  }

  useEffect(load, []);

  function resetForm() {
    setId("");
    setName("");
    setScriptSteps("");
    setComplianceRules("");
    setQaCriteria("");
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const rubric: Rubric = {
        id,
        name,
        script_steps: scriptSteps.split("\n").map((s) => s.trim()).filter(Boolean),
        compliance_rules: parseCriteriaLines(complianceRules),
        qa_criteria: parseCriteriaLines(qaCriteria),
      };
      await createRubric(rubric);
      resetForm();
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(rubricId: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteRubric(rubricId);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Rubrics
        </h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--series-1)" }}
        >
          {showForm ? "Cancel" : "New rubric"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-lg border p-4"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              ID (slug)
            </label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="support-qa"
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Support Call QA"
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Script steps (one per line)
            </label>
            <textarea
              value={scriptSteps}
              onChange={(e) => setScriptSteps(e.target.value)}
              rows={3}
              placeholder={"Greet the customer\nConfirm the issue\nResolve or escalate"}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Compliance rules (id: description, one per line)
            </label>
            <textarea
              value={complianceRules}
              onChange={(e) => setComplianceRules(e.target.value)}
              rows={2}
              placeholder={"consent: Agent obtained clear consent"}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              QA criteria (id: description, one per line)
            </label>
            <textarea
              value={qaCriteria}
              onChange={(e) => setQaCriteria(e.target.value)}
              rows={2}
              placeholder={"tone: Agent maintained a professional tone"}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !id || !name}
            className="self-start rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--series-3)" }}
          >
            {busy ? "Saving…" : "Create rubric"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {rubrics.map((r) => (
          <div key={r.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {r.name}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.id}
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={busy}
                className="rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-50"
                style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
              >
                Delete
              </button>
            </div>
            <div className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              {r.script_steps.length} script steps · {r.compliance_rules.length} compliance rules ·{" "}
              {r.qa_criteria.length} QA criteria
            </div>
            {(r.compliance_rules.length > 0 || r.qa_criteria.length > 0) && (
              <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {criteriaToLines([...r.compliance_rules, ...r.qa_criteria])}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
