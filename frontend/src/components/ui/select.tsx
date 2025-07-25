import { cn } from "@/lib/utils"

const Select = ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
  <div className="relative">
    {children}
  </div>
)

const SelectTrigger = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2",
      "text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2",
      "focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
)

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
)

const SelectContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const SelectItem = ({ className, children, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) => (
  <div
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm",
      "outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none",
      "data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }