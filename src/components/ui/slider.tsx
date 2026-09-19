import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex touch-none select-none items-center data-[orientation=horizontal]:h-5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-5 data-[orientation=vertical]:flex-col",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-elevated data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1">
      <SliderPrimitive.Range className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-3.5 rounded-full border border-border bg-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
