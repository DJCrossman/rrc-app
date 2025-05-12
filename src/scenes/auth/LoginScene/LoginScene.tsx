'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { LoginForm, OTPForm } from './components';
import { useLoginSteps } from './hooks';

interface LoginValue {
  phoneNumber?: string;
  pin?: string;
}

export const LoginScene = () => {
  const [values, setValues] = useState<LoginValue>({});
  const { step, nextStep, previousStep } = useLoginSteps();
  const router = useRouter();
  const onSubmitPhone: SubmitHandler<
    Pick<Required<LoginValue>, 'phoneNumber'>
  > = ({ phoneNumber }) => {
    setValues((prev) => ({ ...prev, phoneNumber }));
    // TODO: send OTP
    nextStep();
  };
  const onSubmitOtp: SubmitHandler<Pick<Required<LoginValue>, 'pin'>> = () => {
    // TODO: validate OTP
    router.push('/');
  };
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a
            href={process.env.NEXT_PUBLIC_HOME_URL}
            className="flex items-center gap-2 font-medium"
          >
            <Image
              src="/logo.png"
              alt="Regina Rowing Club Logo"
              width={24}
              height={24}
            />
            <span className="text-base font-semibold">Reging Rowing Club</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {step === 'phone' && (
              <LoginForm values={values} onSubmit={onSubmitPhone} />
            )}
            {step === 'otp' && values.phoneNumber && (
              <OTPForm
                values={values}
                onSubmit={onSubmitOtp}
                onBack={() => previousStep()}
              />
            )}
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/login.jpeg"
          alt="Three rowers on the water"
          fill={true}
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
};
