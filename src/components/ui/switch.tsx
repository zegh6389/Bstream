"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  /**
   * Size variant of the switch
   */
  size?: "default" | "sm" | "lg"
  /**
   * Icon to display when switch is off
   */
  offIcon?: React.ReactNode
  /**
   * Icon to display when switch is on
   */
  onIcon?: React.ReactNode
  /**
   * Accessible label for the switch when no visible label is present
   */
  "aria-label"?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ 
  className, 
  size = "default", 
  offIcon, 
  onIcon,
  disabled,
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "h-4 w-7",
    default: "h-5 w-9",
    lg: "h-6 w-11",
  }

  const thumbSizeClasses = {
    sm: "size-3",
    default: "size-4",
    lg: "size-5",
  }

  const translateClasses = {
    sm: "data-[state=checked]:translate-x-3",
    default: "data-[state=checked]:translate-x-4",
    lg: "data-[state=checked]:translate-x-5",
  }

  return (
    <SwitchPrimitive.Root
      ref={ref}
      disabled={disabled}
      className={cn(
        [
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "shadow-sm transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // State-based styling
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
          "hover:data-[state=unchecked]:bg-input/80 hover:data-[state=checked]:bg-primary/90",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-input disabled:data-[state=checked]:hover:bg-primary"
        ],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          [
            "pointer-events-none block rounded-full bg-background shadow-sm ring-0",
            "transition-transform duration-200 ease-in-out",
            "data-[state=unchecked]:translate-x-0",
            "flex items-center justify-center"
          ],
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      >
        {/* Conditional icon rendering */}
        {(onIcon || offIcon) && (
          <span className="flex items-center justify-center text-xs">
            <span className="data-[state=checked]:hidden">
              {offIcon}
            </span>
            <span className="data-[state=unchecked]:hidden">
              {onIcon}
            </span>
          </span>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
})
Switch.displayName = "Switch"

export { Switch, type SwitchProps }
