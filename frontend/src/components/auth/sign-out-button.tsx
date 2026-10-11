"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) { setError("Não foi possível sair. Tente novamente."); return; }
      router.replace("/login");
      router.refresh();
    } catch { setError("Não foi possível sair. Tente novamente."); }
    finally { setPending(false); }
  }
  return <div><button onClick={signOut} disabled={pending} className="text-sm underline disabled:opacity-50">{pending ? "Saindo…" : "Sair"}</button>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div>;
}
