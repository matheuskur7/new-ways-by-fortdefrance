type BrandProps = {
  compact?: boolean
  variant?: "logo" | "text" | "complete"
}

export function BusinessBrand({ compact = false, variant = "complete" }: BrandProps) {
  return (
    <div className="flex items-center">
      {variant != "text" && <img src={"/brand/logo-128.png"} className="w-12" />}
      {variant != "logo" && <img src={"/brand/business-text.svg"} className="w-56" />}
    </div>
  )
}
