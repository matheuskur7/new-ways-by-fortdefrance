type BrandProps = {
  compact?: boolean
  variant?: "logo" | "text" | "complete"
}

export function Brand({ compact = false, variant = "complete" }: BrandProps) {
  return (
    <div className="flex items-center gap-4">
      {variant != "text" && (
        <img src={"/brand/logo-128.png"} className="w-24" />
      )}
      {variant != "logo" && <BrandText compact={compact}></BrandText>}
    </div>
  )
}

export function BrandText({ compact }: { compact: boolean }) {
  return (
    <div className="flex flex-col gap-0">
      <div className="m-0 flex gap-2">
        <p
          className={`font-[Arial] ${compact ? "text-4xl" : "text-5xl"} font-bold text-primary italic`}
        >
          New
        </p>
        <p
          className={`font-[Arial] font-bold ${compact ? "text-4xl" : "text-5xl"}`}
        >
          Ways
        </p>
      </div>
      <div className={`flex gap-1 ${compact ? "-mt-2" : "-mt-2"}`}>
        <p className={`font-[Arial] ${compact ? "text-lg" : "text-lg"} italic`}>
          by
        </p>
        <p
          className={`font-[Arial] font-bold italic ${compact ? "text-lg" : "text-lg"}`}
        >
          Fort de France
        </p>
      </div>
    </div>
  )
}
