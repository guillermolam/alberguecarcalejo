import React from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ArrivalTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export function ArrivalTimePicker({ value, onChange, className }: ArrivalTimePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <SelectValue placeholder="Seleccionar hora de llegada" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {timeSlots.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}