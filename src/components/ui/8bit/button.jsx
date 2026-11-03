// Composant 8bitcn porté à la main en JSX (la CLI shadcn plante sur le .tsx).
import { Slot } from 'radix-ui';

import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import '@/components/ui/8bit/styles/retro.css';
import '@/components/ui/8bit/styles/pixel-ui.css';

function Button({
  asChild = false,
  children,
  className,
  font,
  size,
  variant = 'default',
  ...props
}) {
  const framed = variant !== 'ghost' && variant !== 'link';

  return (
    <ShadcnButton
      {...props}
      className={cn(
        'rounded-none relative inline-flex items-center justify-center gap-1.5',
        // Pas de décalage au clic : il faisait apparaître une barre de défilement.
        framed && 'pixel-button bg-transparent hover:bg-transparent text-white active:not-aria-[haspopup]:translate-y-0',
        font !== 'normal' && 'retro',
        className,
      )}
      size={size}
      variant={variant}
      asChild={asChild}
    >
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
    </ShadcnButton>
  );
}

export { Button };
