"use client"

import Image from "next/image"
import { useEffect, useState, type ReactNode } from "react"

type UserImageProps = {
  src: string | null | undefined
  size: number
  className?: string
  fallback: ReactNode
  alt?: string
  onError?: () => void
}

// Reinicia o carregamento e as tentativas quando a foto muda.
export function UserImage(props: UserImageProps) {
  return <UserImageLoader key={props.src} {...props} />
}

function UserImageLoader({
  src,
  size,
  className,
  fallback,
  alt = "",
  onError,
}: UserImageProps) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!failed || attempt >= 3) return
    const timer = setTimeout(
      () => {
        setAttempt((current) => current + 1)
        setFailed(false)
      },
      1000 * 2 ** attempt
    )
    return () => clearTimeout(timer)
  }, [attempt, failed])

  useEffect(() => {
    function retry() {
      setAttempt(0)
      setFailed(false)
    }
    window.addEventListener("online", retry)
    return () => window.removeEventListener("online", retry)
  }, [])

  return (
    <span className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit]">
      {!loaded && fallback}
      {src && !failed && (
        <Image
          key={attempt}
          src={src}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          loading="eager"
          className={`absolute inset-0 size-full object-cover ${loaded ? "" : "opacity-0"} ${className ?? ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false)
            setFailed(true)
            onError?.()
          }}
        />
      )}
    </span>
  )
}
