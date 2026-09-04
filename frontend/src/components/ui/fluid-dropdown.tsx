"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom hook for click outside detection
function useClickAway(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }
    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ElementType
}

export interface FluidDropdownProps {
  /** Controlled value */
  value?: string
  /** Called when selection changes */
  onValueChange?: (value: string) => void
  /** List of selectable options */
  options: DropdownOption[]
  /** Placeholder shown when nothing is selected */
  placeholder?: string
  /** Extra classes on the root wrapper div */
  className?: string
  /** Extra classes on the trigger button */
  triggerClassName?: string
  /** Compact height variant — use "sm" for h-8 inside forms */
  size?: "default" | "sm"
  /** Disabled state */
  disabled?: boolean
}

export function FluidDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  size = "default",
  disabled = false,
}: FluidDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredValue, setHoveredValue] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  const selected = options.find((o) => o.value === value)

  const handleSelect = (optValue: string) => {
    onValueChange?.(optValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false)
    if (e.key === "Enter" || e.key === " ") setIsOpen((v) => !v)
  }

  const hoveredIndex = options.findIndex(
    (o) => o.value === (hoveredValue ?? value)
  )

  const height = size === "sm" ? "h-8" : "h-10"
  const textSize = size === "sm" ? "text-xs" : "text-sm"
  const itemPy = size === "sm" ? "py-1.5" : "py-2"
  const itemHeight = size === "sm" ? 32 : 40

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn("relative", className)}
        ref={dropdownRef}
        onKeyDown={handleKeyDown}
      >
        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            "inline-flex w-full items-center justify-between rounded-md border border-input bg-background px-3",
            "ring-offset-background transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:border-ring/60 hover:bg-accent/30",
            isOpen && "border-ring/70 bg-accent/20",
            height,
            textSize,
            triggerClassName
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 truncate",
              selected ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {selected?.icon && (
              <selected.icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            )}
            {selected ? selected.label : placeholder}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-2 shrink-0 text-muted-foreground"
          >
            <ChevronDown className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
          </motion.span>
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              role="listbox"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{
                opacity: 1,
                y: 0,
                height: "auto",
                transition: {
                  type: "spring",
                  stiffness: 450,
                  damping: 28,
                  mass: 0.8,
                },
              }}
              exit={{
                opacity: 0,
                y: -4,
                height: 0,
                transition: {
                  type: "spring",
                  stiffness: 450,
                  damping: 28,
                  mass: 0.8,
                },
              }}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden"
            >
              <div className="rounded-md border border-input bg-popover shadow-lg ring-1 ring-black/5">
                <motion.ul
                  className="relative py-1"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Animated highlight pill */}
                  {hoveredIndex >= 0 && (
                    <motion.div
                      layoutId="fluid-dd-highlight"
                      className="pointer-events-none absolute inset-x-1 rounded-sm bg-blue-100"

                      animate={{
                        y: hoveredIndex * itemHeight + 4,
                        height: itemHeight,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.4,
                      }}
                    />
                  )}

                  {options.map((option) => {
                    const isSelected = option.value === value
                    const isHovered = hoveredValue === option.value
                    return (
                      <motion.li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        variants={itemVariants}
                        onClick={() => handleSelect(option.value)}
                        onMouseEnter={() => setHoveredValue(option.value)}
                        onMouseLeave={() => setHoveredValue(null)}
                       className={cn(
  "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-3",
  "transition-colors duration-100 focus:outline-none shadow-none",
  isHovered || isSelected
    ? "bg-primary/20 text-primary"
    : "text-popover-foreground",
  itemPy,
  textSize
)}

                        style={{ height: itemHeight }}
                      >
                        {option.icon && (
                          <option.icon
                            className={
                              size === "sm" ? "h-3 w-3 shrink-0" : "h-4 w-4 shrink-0"
                            }
                          />
                        )}
                        <span className="flex-1 truncate">{option.label}</span>
                        {isSelected && (
                          <Check
                            className={cn(
                              "shrink-0 text-primary",
                              size === "sm" ? "h-3 w-3" : "h-4 w-4"
                            )}
                          />
                        )}
                      </motion.li>
                    )
                  })}
                </motion.ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
