"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

interface ToasterProps {
  /**
   * Position of toast notifications
   */
  position?: "top-center" | "top-right" | "bottom-center" | "bottom-right"
  /**
   * Maximum number of toasts to display simultaneously
   */
  limit?: number
  /**
   * Default duration for toasts in milliseconds
   */
  defaultDuration?: number
}

export const Toaster = React.memo<ToasterProps>(({ 
  position = "bottom-right", 
  limit = 5,
  defaultDuration = 5000 
}) => {
  const { toasts } = useToast()

  // Limit the number of displayed toasts for performance
  const displayedToasts = React.useMemo(() => 
    toasts.slice(-limit), 
    [toasts, limit]
  )

  // Don't render if no toasts
  if (displayedToasts.length === 0) {
    return null
  }

  return (
    <ToastProvider swipeDirection="right">
      {displayedToasts.map(({ id, title, description, action, variant, duration, ...props }) => (
        <Toast 
          key={id} 
          variant={variant}
          duration={duration ?? defaultDuration}
          {...props}
        >
          <div className="flex-1 grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport position={position} />
    </ToastProvider>
  )
})
Toaster.displayName = "Toaster"