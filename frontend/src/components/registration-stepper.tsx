import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface RegistrationStepperProps {
  currentStep: number;
  steps: Step[];
  className?: string;
}

export function RegistrationStepper({ currentStep, steps, className }: RegistrationStepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => (
            <li key={step.id} className="flex-1 relative">
              <div className="flex items-center">
                <div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-full border-2",
                    index < currentStep
                      ? "bg-green-600 border-green-600 text-white"
                      : index === currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" fill="currentColor" />
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 left-8 w-full h-0.5",
                      index < currentStep ? "bg-green-600" : "bg-gray-300"
                    )}
                  />
                )}
              </div>
              
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-sm font-medium",
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}