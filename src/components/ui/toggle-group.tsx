"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants, type ToggleProps } from "@/components/ui/toggle"

interface ToggleGroupContextType extends VariantProps<typeof toggleVariants> {
  size: NonNullable<VariantProps<typeof toggleVariants>['size']>
  variant: NonNullable<VariantProps<typeof toggleVariants>['variant']>
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType | null>(null)

interface ToggleGroupProps extends 
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  VariantProps<typeof toggleVariants> {
  /**
   * Whether the toggle group allows multiple selections
   */
  type?: "single" | "multiple"
  /**
   * Accessible label for the toggle group
   */
  "aria-label"?: string
}

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ 
  className, 
  variant = "default", 
  size = "default", 
  type = "single",
  children, 
  ...props 
}, ref) => {
  const contextValue = React.useMemo<ToggleGroupContextType>(() => ({
    variant,
    size,
  }), [variant, size])

  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      type={type}
      className={cn(
        // Enhanced group styling
        "flex items-center gap-1 rounded-md",
        variant === "outline" && "shadow-sm border border-border p-1 bg-background",
        className
      )}
      role="group"
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})
ToggleGroup.displayName = "ToggleGroup"

interface ToggleGroupItemProps extends 
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
  VariantProps<typeof toggleVariants> {
  /**
   * Accessible label for individual toggle items when no visible text
   */
  "aria-label"?: string
}

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  
  if (!context) {
    throw new Error("ToggleGroupItem must be used within a ToggleGroup")
  }

  const effectiveVariant = variant ?? context.variant
  const effectiveSize = size ?? context.size

  // Check for accessible labeling
  const hasVisibleText = React.useMemo(() => {
    return React.Children.toArray(children).some(child => 
      typeof child === 'string' && child.trim().length > 0
    )
  }, [children])

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({ variant: effectiveVariant, size: effectiveSize }),
        // Group-specific styling
        "rounded-md",
        "focus-visible:z-10 focus-visible:ring-offset-0",
        // Outline variant specific adjustments for groups
        effectiveVariant === "outline" && [
          "border-0 shadow-none",
          "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        ],
        className
      )}
      aria-label={!hasVisibleText ? props['aria-label'] : undefined}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps }
