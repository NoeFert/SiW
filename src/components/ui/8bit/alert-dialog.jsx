"use client";;
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction as ShadcnAlertDialogAction,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogOverlay as ShadcnAlertDialogOverlay,
  AlertDialogPortal as ShadcnAlertDialogPortal,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import "@/components/ui/8bit/styles/retro.css";

export const alertDialogVariants = cva("", {
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

function AlertDialog({
  ...props
}) {
  return <ShadcnAlertDialog {...props} />;
}

function AlertDialogTrigger({
  className,
  asChild = true,
  ...props
}) {
  return (
    <ShadcnAlertDialogTrigger
      className={cn(className)}
      asChild={asChild}
      {...props}
    />
  );
}

function AlertDialogPortal({
  ...props
}) {
  return <ShadcnAlertDialogPortal {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}) {
  return <ShadcnAlertDialogOverlay className={cn(className)} {...props} />;
}

// GRAPHICS.md « Interface » : cadre noir PanelLarge du pack Pixel UI & HUD (pixel-card,
// styles/pixel-ui.css) ; les tokens shadcn du contenu passent en thème sombre.
function AlertDialogContent({
  className,
  children,
  font,
  ...props
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <ShadcnAlertDialogContent
        className={cn(
          // Plus large que shadcn (max-w-sm) : les deux boutons en police rétro doivent tenir côte à côte.
          "dark pixel-card rounded-none bg-transparent ring-0 text-white data-[size=default]:sm:max-w-md",
          font !== "normal" && "retro",
          className
        )}
        {...props}
      >
        {children}
      </ShadcnAlertDialogContent>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}) {
  return <ShadcnAlertDialogHeader className={cn(className)} {...props} />;
}

function AlertDialogFooter({
  className,
  ...props
}) {
  return (
    <ShadcnAlertDialogFooter
      // Pas de bande de fond propre (celle de shadcn débordait du cadre du pack).
      className={cn(
        "m-0 flex flex-col-reverse sm:flex-row gap-4 rounded-none border-t-0 bg-transparent p-0 pt-2",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}) {
  return <ShadcnAlertDialogTitle className={cn(className)} {...props} />;
}

function AlertDialogDescription({
  className,
  ...props
}) {
  return <ShadcnAlertDialogDescription className={cn(className)} {...props} />;
}

// Boutons de la boîte : le bouton ButtonA du pack (pixel-button), comme Button — liseré blanc
// pour l'action (variante "default"), gris pour l'annulation ("outline").
const PIXEL_BUTTON = "pixel-button rounded-none bg-transparent hover:bg-transparent text-white ring-0";

function AlertDialogAction({
  className,
  ...props
}) {
  return <ShadcnAlertDialogAction className={cn(PIXEL_BUTTON, className)} {...props} />;
}

function AlertDialogCancel({
  className,
  ...props
}) {
  return <ShadcnAlertDialogCancel className={cn(PIXEL_BUTTON, className)} {...props} />;
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
