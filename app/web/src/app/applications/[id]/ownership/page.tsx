
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnershipEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [businessOwner, setBusinessOwner] = useState("");
  const [technicalOwner, setTechnicalOwner] = useState("");
  const [businessDecisionOwner, setBusinessDecisionOwner] = useState("");
  const [technicalDecisionOwner, setTechnicalDecisionOwner] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("bp from consol log - ownership page id:", id);
    alert('bp from alert - ownerhip id = ${id}');

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessOwner,
        technicalOwner,
        businessDecisionOwner,
        technicalDecisionOwner,
      }),
    });

    const text = await res.text();
    console.log("ownership save:", res.status, text);

    if (res.ok) {
      router.push(`/applications/${id}`);
    } else {
      alert(`Error saving ownership: ${res.status} ${text}`);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Edit Ownership</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Business Owner</label><br />
          <input
            value={businessOwner}
            onChange={(e) => setBusinessOwner(e.target.value)}
          />
        </div>

        <div>
          <label>Technical Owner</label><br />
          <input
            value={technicalOwner}
            onChange={(e) => setTechnicalOwner(e.target.value)}
          />
        </div>

        <div>
          <label>Business Decision Owner</label><br />
          <input
            value={businessDecisionOwner}
            onChange={(e) => setBusinessDecisionOwner(e.target.value)}
          />
        </div>

        <div>
          <label>Technical Decision Owner</label><br />
          <input
            value={technicalDecisionOwner}
            onChange={(e) => setTechnicalDecisionOwner(e.target.value)}
          />
        </div>

        <br />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
