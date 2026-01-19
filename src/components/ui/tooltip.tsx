import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

/**
 * NOTE: We intentionally ship a lightweight tooltip implementation here.
 * The Radix TooltipProvider was triggering a runtime hook crash in the bundle
 * (React.useRef being read from null). To keep the app stable, we provide
 * no-op Tooltip components that preserve the existing API surface.
 */

type WithChildren = { children: React.ReactNode };

type TooltipProviderProps = WithChildren & Record<string, unknown>;
type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>;

const TooltipProvider = ({ children }: TooltipProviderProps) => <>{children}</>;

const Tooltip = ({ children }: WithChildren) => <>{children}</>;

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ asChild, className, ...props }, ref) => {
  const Comp: any = asChild ? Slot : "span";
  return <Comp ref={ref} className={cn("inline-flex", className)} {...props} />;
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className, ..._props }, _ref) => {
    // Tooltips disabled (keeps layout stable).
    return null;
  }
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
