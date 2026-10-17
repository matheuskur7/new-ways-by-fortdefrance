"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "cn";
import { UserRound } from "lucide-react";

type UserAvatarProps = {
  image?: string | null;
  name: string;
  size?: "default" | "lg";
};

export function UserAvatar({ image, name, size = "default" }: UserAvatarProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background text-foreground",
        size === "lg" ? "size-18" : "size-10",
      )}
    >
      {image && image !== failedImage ? (
        <Image
          src={image}
          alt={`Foto de ${name}`}
          width={size === "lg" ? 72 : 40}
          height={size === "lg" ? 72 : 40}
          unoptimized
          className="size-full object-cover"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <UserRound
          className={size === "lg" ? "size-8" : "size-5"}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
