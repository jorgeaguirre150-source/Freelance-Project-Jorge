import { supabaseAdmin, type Job } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["all", "new", "applied", "interview", "won", "rejected"];

export default async function TopDashboard({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "all";

  // SOLO empresas TOP — orden por frescura (created_at) y luego match
  let q = supabaseAdmin()
    .from("jobs")
    .select("*")
    .eq("premium", true)
    .order("created_at", { ascending: false })
    .order("score", { ascending: false })
    .limit(200);
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  const jobs = (data ?? []) as Job[];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Nav active="top" />
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold">🏆 Empresas TOP — Fresh News</h1>
        <p className="text-sm text-slate-500">
          {jobs.length} oportunidades · freelance o fijo · directo de boards oficiales
        </p>
      </header>

      <div className="flex gap-2 mb-5 text-sm flex-wrap">
        {STATUS_TABS.map((s) => (
          <a
            key={s}
            href={`/top?status=${s}`}
            className={`px-3 py-1 rounded-full border ${
              status === s ? "bg-amber-400 border-amber-400 text-amber-900" : "bg-white text-slate-700"
            }`}
          >
            {s}
          </a>
        ))}
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
          <p className="text-slate-500">
            Aún no hay ofertas de empresas top. Ejecuta el agente o revisa los tokens ATS en{" "}
            <code>code_1_ingest.js</code>.
          </p>
        )}
      </div>
    </main>
  );
}
