"use client";
import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { MailPlus, LoaderCircle } from "lucide-react";
import {
  useUpdateOrganization,
  useUpdateMemberRole,
  useCancelInvitation,
  useInviteMember,
  useOrganizationSettings,
} from "@/api/organization/queries";
import { organizationRoleLabel } from "@/api/organization/schemas";
import type { OrganizationSettingsData } from "@/api/organization/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function OrganizationSettings({
  organizationId,
  initialData,
}: {
  organizationId: string;
  initialData: OrganizationSettingsData;
}) {
  const query = useOrganizationSettings(organizationId, initialData);
  const invitation = useInviteMember(organizationId);
  const cancellation = useCancelInvitation(organizationId);
  const update = useUpdateOrganization(organizationId);
  const roleUpdate = useUpdateMemberRole(organizationId);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending =
    invitation.isPending ||
    cancellation.isPending ||
    update.isPending ||
    roleUpdate.isPending ||
    Boolean(query.error);
  const data = query.data;
  async function saveCompany(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setMessage("");
    try {
      await update.mutateAsync({
        organizationId,
        values: Object.fromEntries(new FormData(event.currentTarget)),
      });
      setMessage("Empresa atualizada.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a empresa.",
      );
    }
  }
  async function changeRole(memberId: string, role: "member" | "admin") {
    if (pending) return;
    setError("");
    setMessage("");
    try {
      await roleUpdate.mutateAsync({ organizationId, memberId, role });
      setMessage("Permissão atualizada.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível atualizar a permissão.",
      );
    }
  }
  async function invite(values: Record<string, unknown>, resend = false) {
    if (pending) return;
    setError("");
    setMessage("");
    try {
      await invitation.mutateAsync({ organizationId, values, resend });
      setMessage(resend ? "Convite reenviado." : "Convite enviado por e-mail.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar o convite.",
      );
    }
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await invite(Object.fromEntries(new FormData(event.currentTarget)));
  }
  async function cancel(id: string) {
    if (pending) return;
    setError("");
    setMessage("");
    try {
      await cancellation.mutateAsync(id);
      setMessage("Convite cancelado.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível cancelar o convite.",
      );
    }
  }
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.organization.name}</h1>
          <p className="text-xs text-muted-foreground">
            {data.organization.slug}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Configurações da empresa
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/organizations" />}
        >
          Minhas empresas
        </Button>
      </header>
      {query.error && (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível atualizar as configurações. Recarregue a página
            para confirmar seu acesso.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dados da empresa</h2>
        </CardHeader>
        <CardContent>
          <form
            key={`${data.organization.name}:${data.organization.slug}`}
            onSubmit={saveCompany}
            className="grid gap-4"
            aria-busy={update.isPending}
          >
            <div className="grid gap-2">
              <Label htmlFor="organization-name">Nome</Label>
              <Input
                id="organization-name"
                name="name"
                defaultValue={data.organization.name}
                maxLength={200}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization-slug">Código</Label>
              <Input
                id="organization-slug"
                name="slug"
                defaultValue={data.organization.slug}
                maxLength={100}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                disabled={pending}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                Salvar empresa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Convidar membro</h2>
          <p className="text-sm text-muted-foreground">
            O e-mail precisa ter cadastro no sistema. O acesso é liberado após o
            aceite do convite.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-[1fr_auto]"
            aria-busy={pending}
          >
            <div className="grid gap-2">
              <Label htmlFor="member-email">E-mail do usuário</Label>
              <Input
                id="member-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member-role">Permissão</Label>
              <select
                id="member-role"
                name="role"
                defaultValue="member"
                disabled={pending}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={pending || Boolean(query.error)}>
                {invitation.isPending ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <MailPlus aria-hidden="true" />
                )}
                Enviar convite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <AlertDescription role="status">{message}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Membros ({data.members.length})</h2>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {data.members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{member.user.name}</p>
                  <p className="break-all text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                {member.role === "member" || member.role === "admin" ? (
                  <select
                    aria-label={`Permissão de ${member.user.name}`}
                    value={member.role}
                    disabled={pending}
                    onChange={(event) =>
                      void changeRole(
                        member.id,
                        event.target.value as "member" | "admin",
                      )
                    }
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {organizationRoleLabel(member.role)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Convites pendentes</h2>
        </CardHeader>
        <CardContent>
          {!data.invitations.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum convite pendente.
            </p>
          ) : (
            <ul className="divide-y">
              {data.invitations.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-all text-sm">{item.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {organizationRoleLabel(item.role)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        void invite(
                          { email: item.email, role: item.role ?? "member" },
                          true,
                        )
                      }
                    >
                      Reenviar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => void cancel(item.id)}
                    >
                      Cancelar convite
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
