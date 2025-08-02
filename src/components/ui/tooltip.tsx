"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

interface TooltipProviderProps extends React.ComponentProps<typeof TooltipPrimitive.Provider> {
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
}

const TooltipProvider = React.memo<TooltipProviderProps>(({
  delayDuration = 200, // More reasonable default delay
  skipDelayDuration = 300,
  disableHoverableContent = false,
  ...props
}) => {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
      {...props}
    />
  )
})
TooltipProvider.displayName = "TooltipProvider"

// Global tooltip provider context for better performance
const GlobalTooltipContext = React.createContext<boolean>(false)

interface TooltipProps extends React.ComponentProps<typeof TooltipPrimitive.Root> {
  delayDuration?: number
}

const Tooltip = React.memo<TooltipProps>(({ 
  delayDuration,
  ...props 
}) => {
  const hasGlobalProvider = React.useContext(GlobalTooltipContext)
  
  const tooltipRoot = React.useMemo(() => (
    <TooltipPrimitive.Root {...props} />
  ), [props])

  if (hasGlobalProvider) {
    return tooltipRoot
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <GlobalTooltipContext.Provider value={true}>
        {tooltipRoot}
      </GlobalTooltipContext.Provider>
    </TooltipProvider>
  )
})
Tooltip.displayName = "Tooltip"

interface TooltipTriggerProps extends React.ComponentProps<typeof TooltipPrimitive.Trigger> {
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ asChild = false, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    asChild={asChild}
    {...props}
  />
))
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.ComponentProps<typeof TooltipPrimitive.Content> {
  sideOffset?: number
  hideArrow?: boolean
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ 
  className,
  sideOffset = 6, // Better default offset
  hideArrow = false,
  side = "top",
  align = "center",
  children,
  ...props 
}, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // Enhanced styling with better contrast and animations
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "shadow-md border border-border/5",
        "max-w-xs break-words text-balance", // Better text wrapping
        className
      )}
      // Accessibility improvements
      role="tooltip"
      {...props}
    >
      {children}
      {!hideArrow && (
        <TooltipPrimitive.Arrow 
          className="fill-primary border-border/5" 
          width={11} 
          height={5} 
        />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
