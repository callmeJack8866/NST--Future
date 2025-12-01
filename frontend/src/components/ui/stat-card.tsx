"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  icon: LucideIcon
  trend?: number
  description?: string
  className?: string
  iconColor?: string
}

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  decimals = 0,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <Card className={cn("h-full glass hover:glass-strong transition-all duration-300 group hover-lift animate-float-slow", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
              <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            </p>
            {trend !== undefined && (
              <p className={cn("text-xs font-medium", trend >= 0 ? "text-primary" : "text-destructive")}>
                {trend >= 0 ? "+" : ""}
                {trend}%
              </p>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl bg-secondary/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 animate-bounce-subtle",
              iconColor,
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
