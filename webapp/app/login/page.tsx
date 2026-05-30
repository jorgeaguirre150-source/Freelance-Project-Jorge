"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(false);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (r.ok) location.href = "/";
    else setErr(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-xl font-extrabold mb-1">Freelance Hunter</h1>
        <p className="text-sm text-slate-500 mb-4">Acceso privado</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Contraseña"
          className="w-full border rounded-lg px-3 py-2 mb-3"
        />
        {err && <p className="text-red-500 text-sm mb-2">Contraseña incorrecta</p>}
        <button className="w-full bg-ink text-white rounded-lg py-2 font-semibold">Entrar</button>
      </form>
    </div>
  );
}
