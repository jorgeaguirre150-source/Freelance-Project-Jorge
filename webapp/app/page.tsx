import { supabaseAdmin, type Job } from "@/lib/supabase";
import JobCard from "@/components/JobCard";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["all", "new", "applied", "interview", "won", "rejected"];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { status?: string; min?: string };
}) {
  const min = Number(searchParams.min ?? 70);
  const status = searchParams.status ?? "all";

  let q = supabaseAdmin()
    .from("jobs")
    .select("*")
    .gte("score", min)
    .order("score", { ascending: false })
    .limit(300);
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  const jobs = (data ?? []) as Job[];

  // counts por estado (sobre el set filtrado por score)
  const { data: allForCounts } = await supabaseAdmin()
    .from("jobs")
    .select("status")
    .gte("score", min)
    .limit(1000);
  const counts: Record<string, number> = {};
  (allForCounts ?? []).forEach((r: { status: string }) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  counts["all"] = (allForCounts ?? []).length;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Daily Freelance Hunter</h1>
          <p className="text-sm text-slate-500">
            {jobs.length} ofertas (match ≥ {min}) · floor 295€+IVA
          </p>
        </div>
        <a href="/api/logout" className="text-xs text-slate-400 hover:text-slate-600">
          salir
        </a>
      </header>

      <div className="flex gap-2 mb-5 text-sm flex-wrap">
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={`/?status=${s}&min=${min}`}
            className={`px-3 py-1 rounded-full border ${
              status === s ? "bg-ink text-white" : "bg-white text-slate-700"
            }`}
          >
            {s}
            {counts[s] ? ` (${counts[s]})` : ""}
          </a>
        ))}
        <a
          href={`/?status=${status}&min=${min === 70 ? 0 : 70}`}
          className="px-3 py-1 rounded-full border bg-white text-slate-700"
        >
          umbral: ≥ {min} {min === 70 ? "(ver todas)" : "(solo top)"}
        </a>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">
          Error de conexión a Supabase. Revisa SUPABASE_URL / SERVICE_ROLE_KEY.
        </p>
      )}

      <div className="space-y-3">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
        {jobs.length === 0 && !error && (
          <p className="text-slate-500">Sin ofertas para este filtro todavía.</p>
        )}
      </div>
    </main>
  );
}
