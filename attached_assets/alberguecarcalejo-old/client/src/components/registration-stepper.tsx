  import { Check } from 'lucide-react';
import { useI18n } from '@/contexts/i18n-context';

interface Step {
  id: number;
  title: string;
  completed: boolean;
  current: boolean;
}

interface RegistrationStepperProps {
  currentStep: number;
}

export function RegistrationStepper({ currentStep }: RegistrationStepperProps) {
  

  
  const { t } = useI18n();

  const steps: Step[] = [
    {
      id: 1,
      title: t('registration.step1'),
      completed: currentStep > 1,
      current: currentStep === 1,
    },
    {
      id: 2,
      title: t('registration.step2'),
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      id: 3,
      title: t('registration.step3'),
      completed: currentStep > 3,
      current: currentStep === 3,
    },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed
                    ? 'bg-[#45c655] border-[#45c655] text-white'
                    : step.current
                    ? 'bg-white border-[#45c655] text-[#45c655]'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                {step.completed ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step.current || step.completed
                    ? 'text-[#45c655]'
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-4 ${
                  step.completed ? 'bg-[#45c655]' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}