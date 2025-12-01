"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "fade"
  duration?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [once])

  const getDirectionClasses = () => {
    if (isVisible) return "opacity-100 translate-x-0 translate-y-0"

    switch (direction) {
      case "up":
        return "opacity-0 translate-y-12"
      case "down":
        return "opacity-0 -translate-y-12"
      case "left":
        return "opacity-0 translate-x-12"
      case "right":
        return "opacity-0 -translate-x-12"
      case "fade":
        return "opacity-0"
      default:
        return "opacity-0 translate-y-12"
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        getDirectionClasses(),
        className
      )}
      style={{
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

