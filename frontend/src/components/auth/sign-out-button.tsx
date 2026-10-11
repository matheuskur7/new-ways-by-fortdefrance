"use client";

import { IconButton } from "@/components/ui/icon-button";
import { LogOut, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignOut } from "@/api/auth.queries";

export function SignOutButton() {
  const router = useRouter();
  const mutation = useSignOut();
  const pending = mutation.isPending;
  const [error, setError] = useState("");
  async function signOut() {
    if (pending) return;
    setError("");
    try {
      await mutation.mutateAsync();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    }
  }
  return (
    <div>
      <IconButton
        label={pending ? "Saindo…" : "Sair"}
        type="button"
        variant="ghost"
        onClick={signOut}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <LogOut aria-hidden="true" />
        )}
      </IconButton>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
