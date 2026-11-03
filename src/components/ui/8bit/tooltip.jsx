"use client";;
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  Tooltip as ShadcnTooltip,
  TooltipContent as ShadcnTooltipContent,
  TooltipProvider as ShadcnTooltipProvider,
  TooltipTrigger as ShadcnTooltipTrigger,
} from "@/components/ui/tooltip";

import "@/components/ui/8bit/styles/retro.css";

export const tooltipVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

function TooltipContent({
  className,
  children,
  font,
  ...props
}) {
  return (
    <ShadcnTooltipContent
      {...props}
      data-slot="tooltip-content"
      className={cn(
        "pixel-tooltip rounded-none bg-transparent px-2 py-1 text-white",
        tooltipVariants({ font }),
        className
      )}
    >
      {children}
    </ShadcnTooltipContent>
  );
}

function Tooltip({
  children,
  ...props
}) {
  return (
    <ShadcnTooltip data-slot="tooltip" {...props}>
      {children}
    </ShadcnTooltip>
  );
}

function TooltipProvider({
  children,
  delayDuration = 0,
  ...props
}) {
  return (
    <ShadcnTooltipProvider delayDuration={delayDuration} {...props}>
      {children}
    </ShadcnTooltipProvider>
  );
}

function TooltipTrigger({
  children,
  asChild = true,
  ...props
}) {
  return (
    <ShadcnTooltipTrigger
      data-slot="tooltip-trigger"
      asChild={asChild}
      {...props}
    >
      {children}
    </ShadcnTooltipTrigger>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
