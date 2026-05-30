"use client";
import { useState, useTransition } from "react";
import type { Job } from "@/lib/supabase";
import { updateStatus, saveDraft } from "@/app/actions";

const STATUSES = ["new", "applied", "interview", "won", "rejected"];

export default function JobCard({ job }: { job: Job }) {
  const [draft, setDraft] = useState(job.draft ?? "");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(job.status);
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function changeStatus(s: string) {
    setStatus(s);
    startTransition(() => updateStatus(job.id, s));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-teal-700 tracking-wide">
            {job.source} · MATCH {job.score}
          </div>
          <div className="font-bold text-lg leading-tight">{job.title}</div>
          <div className="text-sm text-slate-500">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
            {job.salary ? ` · ${job.salary}` : ""}
          </div>
          {job.reason && (
            <div className="text-xs text-orange-700 italic mt-1">{job.reason}</div>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className="h-8 border rounded-lg text-sm self-start px-2 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mt-2 text-sm items-center">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => changeStatus("applied")}
            className="text-teal-600 font-semibold"
          >
            Aplicar (abrir oferta) →
          </a>
        )}
        <button onClick={() => setOpen(!open)} className="text-slate-500">
          {open ? "Ocultar" : "Ver"} borrador
        </button>
      </div>

      {open && (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm h-32 bg-slate-50"
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                startTransition(() => saveDraft(job.id, draft));
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
              }}
              className="text-xs bg-ink text-white px-3 py-1 rounded-lg"
            >
              {saved ? "Guardado ✓" : "Guardar"}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(draft);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-xs border px-3 py-1 rounded-lg"
            >
              {copied ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
