"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { CompanyEntryToast } from "@/components/auth/company-entry-toast";

export function OrganizationManager({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const {
    data: organizations,
    isPending: loading,
    error: listError,
  } = authClient.useListOrganizations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function activate(organizationId: string) {
    const result = await authClient.organization.setActive({ organizationId });
    if (result.error)
      throw new Error(
        result.error.message ?? "Não foi possível selecionar a empresa.",
      );
    const company = organizations?.find((org) => org.id === organizationId);
    if (company) toast.info(<CompanyEntryToast name={company.name} />);
    router.replace("/");
    router.refresh();
  }

  async function select(organizationId: string) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await activate(organizationId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível selecionar a empresa.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Suas empresas</h2>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="mt-4" role="status">
              Carregando…
            </p>
          )}
          {listError && (
            <p className="mt-4 text-destructive" role="alert">
              Não foi possível carregar as empresas.
            </p>
          )}
          {!loading && !listError && !organizations?.length && (
            <p className="mt-4 text-muted-foreground">
              Você ainda não participa de nenhuma empresa. Solicite acesso ao
              responsável.
            </p>
          )}
          <ul className="mt-4 grid gap-3">
            {organizations?.map((org) => (
              <li key={org.id}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => select(org.id)}
                  className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal px-4 py-2 text-left"
                >
                  <span className="text-lg leading-tight font-semibold">
                    {org.name}
                  </span>
                  <span className="block text-sm leading-tight text-muted-foreground">
                    {org.id === activeId ? "Empresa ativa" : org.slug}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
