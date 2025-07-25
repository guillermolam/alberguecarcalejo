import React, { useState } from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
}

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined)

const Popover = ({ children }: PopoverProps) => {
  const [open, setOpen] = useState(false)
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = ({ className, children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) => {
  const context = React.useContext(PopoverContext)
  
  if (asChild) {
    return <>{children}</>
  }
  
  return (
    <button
      className={className}
      onClick={() => context?.setOpen(!context.open)}
      {...props}
    >
      {children}
    </button>
  )
}

const PopoverContent = ({ className, children, align = "center", sideOffset = 4, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: string; sideOffset?: number }) => {
  const context = React.useContext(PopoverContext)
  
  if (!context?.open) return null
  
  return (
    <div
      className={cn(
        "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "top-full mt-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent }