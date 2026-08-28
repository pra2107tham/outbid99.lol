"use client";

import { useState } from "react";

const field =
  "mt-1 w-full rounded-[2px] border border-rule bg-paper-2 px-3 py-2.5 text-[14px] focus:border-ink";
const label = "block font-mono text-[10px] uppercase tracking-[0.13em] text-ink-40";

export function AdminPanel() {
  const [secret, setSecret] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("removed");
  const [result, setResult] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setWorking(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ slug: slug.trim(), status }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; status?: string };
      setResult(data.ok ? `${slug} is now ${data.status}.` : (data.error ?? "Failed."));
    } catch {
      setResult("Request failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label className={label} htmlFor="secret">Admin secret</label>
        <input
          id="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className={field}
          autoComplete="off"
          required
        />
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="slug">Listing slug</label>
        <input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={field}
          placeholder="example-com"
          required
        />
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
          <option value="removed">removed</option>
          <option value="live">live</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={working}
        className="mt-6 w-full rounded-[2px] bg-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.13em] text-paper transition-colors hover:bg-signal disabled:opacity-60"
      >
        {working ? "Applying" : "Apply"}
      </button>
      {result ? (
        <p role="status" className="mt-4 border-l-2 border-ink pl-3 text-[13px]">{result}</p>
      ) : null}
    </form>
  );
}
