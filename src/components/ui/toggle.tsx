"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  [
    // Base styles with improved focus management
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
    "whitespace-nowrap select-none",
    // Improved hover states
    "hover:bg-muted hover:text-muted-foreground",
    "data-[state=on]:hover:bg-accent/90",
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: [
          "border border-input bg-transparent shadow-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "data-[state=on]:border-accent",
        ],
        ghost: [
          "bg-transparent hover:bg-accent hover:text-accent-foreground",
          "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        ],
      },
      size: {
        default: "h-9 px-3 min-w-9",
        sm: "h-8 px-2 min-w-8 text-xs",
        lg: "h-10 px-4 min-w-10",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  /**
   * Accessible label for screen readers when no visible text is present
   */
  "aria-label"?: string
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, children, ...props }, ref) => {
  // Ensure accessibility for icon-only toggles
  const hasVisibleText = React.useMemo(() => {
    return React.Children.toArray(children).some(
      (child) => typeof child === "string" && child.trim().length > 0
    )
  }, [children])

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size }), className)}
      aria-label={!hasVisibleText ? props["aria-label"] : undefined}
      {...props}
    >
      {children}
    </TogglePrimitive.Root>
  )
})
Toggle.displayName = "Toggle"

export { Toggle, toggleVariants, type ToggleProps }
