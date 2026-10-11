"use client";

import { IconButton } from "@/components/ui/icon-button";
import { LogOut, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { useSignOut } from "@/api/auth.queries";

export function SignOutButton({ variant = "icon" }: { variant?: "icon" | "menu" }) {
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
      if (variant === "menu") toast.error("Não foi possível sair. Tente novamente.");
      else setError("Não foi possível sair. Tente novamente.");
    }
  }
  if (variant === "menu") {
    return (
      <DropdownMenuItem className="cursor-pointer" disabled={pending} onClick={() => void signOut()}>
        {pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
        {pending ? "Saindo…" : "Sair"}
      </DropdownMenuItem>
    );
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
