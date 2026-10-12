"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IconButton({
  label,
  children,
  size = "icon",
  tooltipSide,
  ...props
}: ComponentProps<typeof Button> & { label: string; tooltipSide?: ComponentProps<typeof TooltipContent>["side"] }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button size={size} {...props} aria-label={label} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
