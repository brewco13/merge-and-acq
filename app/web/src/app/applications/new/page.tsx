"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewApplicationPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    legacyId: "",
    businessArea: "",
    l1Capability: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

  const res = await fetch("/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  const text = await res.text();
  console.log("status:", res.status);
  console.log("response:", text);

  if (res.ok) {
    router.push("/applications");
  } else {
    alert(`Create failed: ${res.status} ${text}`);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Application</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label><br />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Legacy ID</label><br />
          <input
            value={form.legacyId}
            onChange={(e) => setForm({ ...form, legacyId: e.target.value })}
          />
        </div>

        <div>
          <label>Business Area</label><br />
          <input
            value={form.businessArea}
            onChange={(e) => setForm({ ...form, businessArea: e.target.value })}
          />
        </div>

        <div>
          <label>L1 Capability</label><br />
          <input
            value={form.l1Capability}
            onChange={(e) => setForm({ ...form, l1Capability: e.target.value })}
          />
        </div>

        <br />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
