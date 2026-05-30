export default function Nav({ active }: { active: "top" | "all" }) {
  const base = "px-4 py-2 rounded-lg font-semibold text-sm";
  return (
    <nav className="flex gap-2 mb-5">
      <a
        href="/top"
        className={`${base} ${
          active === "top" ? "bg-amber-400 text-amber-900" : "bg-white border text-slate-600"
        }`}
      >
        🏆 Empresas TOP
      </a>
      <a
        href="/"
        className={`${base} ${
          active === "all" ? "bg-ink text-white" : "bg-white border text-slate-600"
        }`}
      >
        Todas las demás
      </a>
      <a href="/api/logout" className="ml-auto text-xs text-slate-400 hover:text-slate-600 self-center">
        salir
      </a>
    </nav>
  );
}
