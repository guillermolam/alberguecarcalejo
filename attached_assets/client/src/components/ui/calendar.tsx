import { cn } from "@/lib/utils"

interface CalendarProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

const Calendar = ({ className, mode = 'single', selected, onSelect }: CalendarProps) => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // Simple calendar implementation for demo
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  
  const days = []
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const isSelected = selected && date.toDateString() === selected.toDateString()
    
    days.push(
      <button
        key={day}
        onClick={() => onSelect?.(date)}
        className={cn(
          "h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        )}
      >
        {day}
      </button>
    )
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <div className="space-y-3">
          <div className="grid w-full grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="flex h-9 w-9 items-center justify-center text-sm font-medium">
                {day}
              </div>
            ))}
            {days}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Calendar }