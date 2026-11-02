"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useCreateOrganization } from "@/api/organization/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NewOrganizationForm() {
  const router = useRouter();
  const mutation = useCreateOrganization();
  const [error, setError] = useState("");
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setError("");
    try {
      const company = await mutation.mutateAsync(
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      router.replace(
        `/organizations/${encodeURIComponent(company.id)}/settings`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a empresa.",
      );
    }
  }
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Nova empresa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você será o proprietário da empresa e poderá convidar membros.
        </p>
      </header>
      <form
        onSubmit={submit}
        className="grid gap-4"
        aria-busy={mutation.isPending}
      >
        <div className="grid gap-2">
          <Label htmlFor="company-name">Nome da empresa</Label>
          <Input
            id="company-name"
            name="name"
            autoComplete="organization"
            maxLength={200}
            required
            disabled={mutation.isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company-slug">Código da empresa</Label>
          <Input
            id="company-slug"
            name="slug"
            maxLength={100}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="minha-empresa"
            required
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Use letras minúsculas, números e hífens. O código deve ser único.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/organizations" />}
            variant="outline"
            disabled={mutation.isPending}
          >
            Voltar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            Criar empresa
          </Button>
        </div>
      </form>
    </div>
  );
}
