"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganizations, useSetActiveOrganization } from "@/api/auth.queries";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import { CompanyEntryToast } from "@/components/auth/company-entry-toast";

export function OrganizationManager({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const {
    data: organizations,
    isPending: loading,
    error: listError,
  } = useOrganizations();
  const activation = useSetActiveOrganization();
  const pending = activation.isPending;
  const [error, setError] = useState("");
  async function activate(organizationId: string) {
    await activation.mutateAsync(organizationId);
    const company = organizations?.find((org) => org.id === organizationId);
    if (company) toast.info(<CompanyEntryToast name={company.name} />);
    router.replace("/");
    router.refresh();
  }

  async function select(organizationId: string) {
    if (pending) return;
    setError("");
    try {
      await activate(organizationId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível selecionar a empresa.",
      );
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Suas empresas</h2>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="grid gap-3" role="status" aria-label="Carregando empresas">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {listError && (
            <p className="text-destructive" role="alert">
              Não foi possível carregar as empresas.
            </p>
          )}
          {!loading && !listError && !organizations?.length && (
            <p className="text-muted-foreground">
              Você ainda não participa de nenhuma empresa. Solicite acesso ao
              responsável.
            </p>
          )}
          <ul className="grid gap-3">
            {organizations?.map((org) => (
              <li key={org.id}>
                <Tooltip>
                  <TooltipTrigger render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => select(org.id)}
                      className="h-auto w-full justify-between gap-3 whitespace-normal px-4 py-2 text-left"
                    />
                  }>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="text-lg leading-tight font-semibold">
                        {org.name}
                      </span>
                      <span className="block text-sm leading-tight text-muted-foreground">
                        {org.id === activeId ? "Empresa ativa" : org.slug}
                      </span>
                    </span>
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent side="right">Entrar</TooltipContent>
                </Tooltip>
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
