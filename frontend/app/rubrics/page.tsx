"use client";

import { useEffect, useState } from "react";
import { createRubric, deleteRubric, listRubrics } from "@/lib/api";
import type { Rubric, RubricCriterion } from "@/lib/types";
import { PrimaryButton, TextAction } from "@/components/Button";
import TextInput from "@/components/TextInput";
import EmptyState from "@/components/EmptyState";

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

const fieldLabel = {
  fontFamily: "var(--font-fraunces)",
  fontWeight: 500,
  fontSize: "0.75rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--text-muted)",
};

const textareaStyle = {
  fontFamily: "var(--font-fraunces)",
  fontSize: "0.875rem",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--border-strong)",
  borderRadius: 0,
  color: "var(--text-primary)",
  padding: "0.375rem 0",
  width: "100%",
  resize: "vertical" as const,
};

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
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1
          style={{
            fontFamily: "var(--font-fraunces)",
            fontWeight: 600,
            fontSize: "2.75rem",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Rubrics
        </h1>
        <PrimaryButton onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "New Rubric"}</PrimaryButton>
      </div>

      {error && (
        <div style={{ fontFamily: "var(--font-fraunces)", color: "var(--status-critical)" }}>{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-4" style={{ borderBottom: "1px solid var(--border-strong)", paddingBottom: "1.5rem" }}>
          <div>
            <label style={fieldLabel}>ID (slug)</label>
            <TextInput value={id} onChange={(e) => setId(e.target.value)} required placeholder="support-qa" className="mt-1" />
          </div>
          <div>
            <label style={fieldLabel}>Name</label>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="Support Call QA" className="mt-1" />
          </div>
          <div>
            <label style={fieldLabel}>Script steps (one per line)</label>
            <textarea
              value={scriptSteps}
              onChange={(e) => setScriptSteps(e.target.value)}
              rows={3}
              placeholder={"Greet the customer\nConfirm the issue\nResolve or escalate"}
              className="mt-1"
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>Compliance rules (id: description, one per line)</label>
            <textarea
              value={complianceRules}
              onChange={(e) => setComplianceRules(e.target.value)}
              rows={2}
              placeholder={"consent: Agent obtained clear consent"}
              className="mt-1"
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>QA criteria (id: description, one per line)</label>
            <textarea
              value={qaCriteria}
              onChange={(e) => setQaCriteria(e.target.value)}
              rows={2}
              placeholder={"tone: Agent maintained a professional tone"}
              className="mt-1"
              style={textareaStyle}
            />
          </div>
          <PrimaryButton type="submit" disabled={busy || !id || !name} className="self-start">
            {busy ? "Saving…" : "Create Rubric"}
          </PrimaryButton>
        </form>
      )}

      {rubrics.length === 0 ? (
        <EmptyState>No rubrics defined yet.</EmptyState>
      ) : (
        <table className="dense-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="numeric">Steps</th>
              <th className="numeric">Compliance</th>
              <th className="numeric">QA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rubrics.map((r) => (
              <tr key={r.id}>
                <td>
                  <span style={{ color: "var(--text-primary)" }}>{r.name}</span>
                  <span
                    className="ml-2"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.6875rem", color: "var(--text-muted)" }}
                  >
                    {r.id}
                  </span>
                </td>
                <td className="numeric">{r.script_steps.length}</td>
                <td className="numeric">{r.compliance_rules.length}</td>
                <td className="numeric">{r.qa_criteria.length}</td>
                <td style={{ width: 80, textAlign: "right" }}>
                  <TextAction destructive onClick={() => handleDelete(r.id)} disabled={busy}>
                    Delete
                  </TextAction>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
