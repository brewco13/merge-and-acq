
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HorizonForm = {
  targetDisposition: string;
  status: string;
  targetDate: string;
  targetPlatform: string;
  targetTimeline: string;
  rationale: string;
};

type DispositionFormProps = {
  applicationId: string;
  initialValues: {
    tsa: HorizonForm;
    longTerm: HorizonForm;
  };
};

const dispositionOptions = [
  "",
  "RETAIN",
  "RETIRE",
  "REPLACE",
  "REHOST",
  "REPLATFORM",
  "REPURCHASE",
  "CONSOLIDATE",
];

const statusOptions = ["", "DRAFT", "UNDER_REVIEW", "APPROVED", "IMPLEMENTED"];

function Section({
  title,
  values,
  onChange,
}: {
  title: string;
  values: HorizonForm;
  onChange: (next: HorizonForm) => void;
}) {
  return (
    <div style={{ marginBottom: 28, padding: 16, border: "1px solid #ddd" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <div style={{ marginBottom: 12 }}>
        <label>Target Disposition</label>
        <br />
        <select
          value={values.targetDisposition}
          onChange={(e) => onChange({ ...values, targetDisposition: e.target.value })}
          style={{ width: "100%", padding: 8 }}
        >
          {dispositionOptions.map((option) => (
            <option key={option} value={option}>
              {option || "—"}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Status</label>
        <br />
        <select
          value={values.status}
          onChange={(e) => onChange({ ...values, status: e.target.value })}
          style={{ width: "100%", padding: 8 }}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option || "—"}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Target Date</label>
        <br />
        <input
          type="date"
          value={values.targetDate}
          onChange={(e) => onChange({ ...values, targetDate: e.target.value })}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Target Platform</label>
        <br />
        <input
          value={values.targetPlatform}
          onChange={(e) => onChange({ ...values, targetPlatform: e.target.value })}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Target Timeline</label>
        <br />
        <input
          value={values.targetTimeline}
          onChange={(e) => onChange({ ...values, targetTimeline: e.target.value })}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Rationale</label>
        <br />
        <textarea
          value={values.rationale}
          onChange={(e) => onChange({ ...values, rationale: e.target.value })}
          style={{ width: "100%", padding: 8, minHeight: 100 }}
        />
      </div>
    </div>
  );
}

export default function DispositionForm({
  applicationId,
  initialValues,
}: DispositionFormProps) {
  const router = useRouter();
  const [tsa, setTsa] = useState(initialValues.tsa);
  const [longTerm, setLongTerm] = useState(initialValues.longTerm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/applications/${applicationId}/disposition`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tsa, longTerm }),
    });

    setSaving(false);
    if (!res.ok) {
	const data = await res.json().catch(() => null);
	alert(data?.error ?? "Failed to save disposition");
	return;
    }

    router.push(`/applications/${applicationId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section title="TSA Expiration" values={tsa} onChange={setTsa} />
      <Section title="Long-Term" values={longTerm} onChange={setLongTerm} />

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Disposition"}
      </button>
    </form>
  );
}
