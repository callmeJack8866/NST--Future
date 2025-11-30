"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef, type ReactNode } from "react"

export interface GlowButtonProps extends ButtonProps {
  glowColor?: "green" | "cyan" | "gold"
  children?: ReactNode
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, glowColor = "green", children, ...props }, ref) => {
    const glowClasses = {
      green: "shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)]",
      cyan: "shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]",
      gold: "shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)]",
    }

    return (
      <Button
        ref={ref}
        className={cn("relative overflow-hidden transition-all duration-300", glowClasses[glowColor], className)}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        <div className="absolute inset-0 animate-shimmer" />
      </Button>
    )
  },
)

GlowButton.displayName = "GlowButton"
