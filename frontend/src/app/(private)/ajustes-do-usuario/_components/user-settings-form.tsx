"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { UserRound, UserRoundCog } from "lucide-react";
import { toast } from "react-toastify";
import type { AuthContext } from "@/lib/auth-schemas";
import { prepareAvatar } from "@/api/user-settings/api";
import { useChangePassword, useRemoveAvatar, useSaveProfile } from "@/api/user-settings/queries";
import { profileSchema, passwordSchema } from "@/api/user-settings/schemas";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UserSettingsForm({ user }: { user: AuthContext["user"] }) {
  const router = useRouter();
  const profile = useSaveProfile();
  const removeAvatar = useRemoveAvatar();
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [removedPhoto, setRemovedPhoto] = useState(false);
  const password = useChangePassword();
  const [name, setName] = useState(user.name);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  const pending = profile.isPending || removeAvatar.isPending || preparing;
  const photo = preview ?? (removedPhoto ? null : user.image);

  async function selectFile(selected?: File) {
    if (!selected || pending) return;
    setPreparing(true);
    setProfileError("");
    try {
      const compressed = await prepareAvatar(selected);
      if (mounted.current) {
        setFile(compressed);
        setPreview(URL.createObjectURL(compressed));
      }
    } catch (cause) {
      if (mounted.current) setProfileError(cause instanceof Error ? cause.message : "Não foi possível preparar a foto.");
    } finally { if (mounted.current) setPreparing(false); }
  }

  async function submitProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setProfileError("");
    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) { setProfileError(parsed.error.issues[0].message); return; }
    try {
      await profile.mutateAsync({ name: parsed.data.name, file });
      setName(parsed.data.name);
      setFile(null);
      setRemovedPhoto(false);
      toast.success("Perfil atualizado.");
      router.refresh();
    } catch (cause) { setProfileError(cause instanceof Error ? cause.message : "Não foi possível salvar o perfil."); }
  }

  async function removePhoto() {
    if (pending) return;
    setProfileError("");
    try {
      await removeAvatar.mutateAsync();
      setFile(null);
      setPreview(null);
      setRemovedPhoto(true);
      setConfirmRemovePhoto(false);
      toast.success("Foto removida.");
      router.refresh();
    } catch (cause) { setProfileError(cause instanceof Error ? cause.message : "Não foi possível remover a foto."); }
  }

  async function submitPassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.isPending) return;
    const form = event.currentTarget;
    setPasswordError("");
    const parsed = passwordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { setPasswordError(parsed.error.issues[0].message); return; }
    try {
      await password.mutateAsync(parsed.data);
      form.reset();
      toast.success("Senha alterada. As outras sessões foram encerradas.");
    } catch (cause) { setPasswordError(cause instanceof Error ? cause.message : "Não foi possível alterar a senha."); }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-3">
      <PageHeader
        icon={UserRoundCog}
        title="Ajustes do Usuário"
        subtitle="Atualize seus dados pessoais e sua senha em todas as suas empresas."
      />
      <div className="grid items-stretch gap-3 md:grid-cols-2">
      <Card className="h-full">
        <CardHeader><CardTitle>Perfil</CardTitle><CardDescription>Escolha como você aparece no sistema: seu nome e sua foto.</CardDescription></CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <form onSubmit={submitProfile} className="flex flex-1 flex-col gap-5" aria-busy={pending}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-24 shrink-0">
                <div className="relative z-10 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted">
                {photo && photo !== failedImage ? <Image src={photo} alt="Foto de perfil" width={96} height={96} unoptimized className="size-full object-cover" onError={() => setFailedImage(photo)} /> : <UserRound className="size-8 text-muted-foreground" aria-hidden="true" />}
                </div>
                {photo && <Button type="button" variant="destructive" size="sm" className="-mt-2 h-9 w-full rounded-md border-0 bg-clip-border px-1 pt-2 text-xs active:not-aria-[haspopup]:translate-y-0" disabled={pending} onClick={() => setConfirmRemovePhoto(true)}>{removeAvatar.isPending ? "Removendo…" : "Remover foto"}</Button>}
              </div>
              <div className="grid min-w-0 flex-1 gap-2">
                <Label htmlFor="profile-photo">Imagem de perfil</Label>
                <Input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} aria-describedby="photo-help" onChange={(event) => { void selectFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                <p id="photo-help" className="text-xs text-muted-foreground">JPEG, PNG ou WebP de até 10 MB.</p>
                {preparing && <p role="status" className="text-xs text-muted-foreground">Preparando foto…</p>}
              </div>
            </div>
            <div className="grid gap-2"><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} disabled={pending} /></div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profileError && <Alert variant="destructive" role="alert"><AlertDescription>{profileError}</AlertDescription></Alert>}
            <Button type="submit" className="mt-auto self-start" disabled={pending}>{profile.isPending ? "Salvando…" : "Salvar perfil"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardHeader><CardTitle>Senha</CardTitle><CardDescription>Use pelo menos 8 caracteres.</CardDescription></CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <form onSubmit={submitPassword} className="flex flex-1 flex-col gap-4" aria-busy={password.isPending}>
            {[
              { name: "currentPassword", label: "Senha atual", autoComplete: "current-password", minLength: 1 },
              { name: "newPassword", label: "Nova senha", autoComplete: "new-password", minLength: 8 },
              { name: "confirmPassword", label: "Confirmar nova senha", autoComplete: "new-password", minLength: 8 },
            ].map((field) => <div className="grid gap-2" key={field.name}><Label htmlFor={field.name}>{field.label}</Label><Input {...field} id={field.name} type="password" required maxLength={128} disabled={password.isPending} /></div>)}
            <p className="text-sm text-muted-foreground">Ao alterar sua senha, as outras sessões serão encerradas.</p>
            {passwordError && <Alert variant="destructive" role="alert"><AlertDescription>{passwordError}</AlertDescription></Alert>}
            <Button type="submit" className="mt-auto self-start" disabled={password.isPending}>{password.isPending ? "Alterando…" : "Alterar senha"}</Button>
          </form>
        </CardContent>
      </Card>
      </div>
      <AlertDialog open={confirmRemovePhoto} onOpenChange={(open) => { if (!removeAvatar.isPending) setConfirmRemovePhoto(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto de perfil?</AlertDialogTitle>
            <AlertDialogDescription>Sua foto será removida do perfil. Você poderá adicionar outra depois.</AlertDialogDescription>
          </AlertDialogHeader>
          {profileError && <Alert variant="destructive" role="alert"><AlertDescription>{profileError}</AlertDescription></Alert>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAvatar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={() => void removePhoto()}>{removeAvatar.isPending ? "Removendo…" : "Remover foto"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
