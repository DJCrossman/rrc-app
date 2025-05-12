import { useState } from 'react';

const steps = ['phone', 'otp', 'login'] as const;

type Steps = (typeof steps)[number];

export const useLoginSteps = () => {
  const [step, setStep] = useState<Steps>('phone');

  const nextStep = () => {
    if (step === 'phone') {
      setStep('otp');
    }
    throw new Error('Invalid step');
  };

  const previousStep = () => {
    if (step === 'otp') {
      setStep('phone');
    }
    throw new Error('Invalid step');
  };

  return { step, nextStep, previousStep };
};
