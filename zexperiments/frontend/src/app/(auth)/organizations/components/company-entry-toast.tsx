export function CompanyEntryToast({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-0">
      <span className="text-sm leading-tight">Você Entrou</span>
      <strong className="text-base leading-tight font-bold">{name}</strong>
    </div>
  );
}
