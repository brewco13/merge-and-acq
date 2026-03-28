"use client";
import PageShell from "@/components/page-shell";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NoteRecord = {
  id: string;
  content: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApplicationResponse = {
  id: string;
  name: string;
  Note?: NoteRecord[];
};

export default function NotesEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        const data: ApplicationResponse = await res.json();

        const existingUserNote =
          data.Note?.find((note) => note.source === "USER_EDIT") ?? null;

        setContent(existingUserNote?.content ?? "");
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        noteContent: content,
      }),
    });

    const text = await res.text();
    console.log("notes save:", res.status, text);

    if (res.ok) {
      router.push(`/applications/${id}`);
    } else {
      alert(`Error saving notes: ${res.status} ${text}`);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading notes...</div>;
  }

  return (
  <PageShell>
    <div style={{ padding: 20, maxWidth: 800 }}>
      <h1>Edit Notes</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Note</label>
          <br />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            style={{ width: "100%" }}
          />
        </div>

        <br />
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit">Save</button>
          <button
            type="button"
            onClick={() => router.push(`/applications/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </PageShell>
  );
}
