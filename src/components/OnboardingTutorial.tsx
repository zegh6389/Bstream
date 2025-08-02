import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const steps = [
  {
    title: 'Welcome to Bstream!',
    description: 'Your complete financial management solution. Let\'s get you started.',
    image: '/welcome.svg',
    action: 'Get Started'
  },
  {
    title: 'Set Up Your Profile',
    description: 'Customize your experience with preferences and settings.',
    image: '/profile.svg',
    action: 'Configure Profile'
  },
  {
    title: 'Explore Dashboard',
    description: 'Discover powerful analytics and insights at your fingertips.',
    image: '/dashboard.svg',
    action: 'View Dashboard'
  },
  {
    title: 'Manage Transactions',
    description: 'Track income, expenses, and categorize your financial data.',
    image: '/transactions.svg',
    action: 'Add Transaction'
  },
  {
    title: 'Team Collaboration',
    description: 'Invite team members and collaborate on financial goals.',
    image: '/team.svg',
    action: 'Invite Team'
  },
  {
    title: 'You\'re All Set!',
    description: 'Start managing your finances like a pro. Welcome aboard!',
    image: '/complete.svg',
    action: 'Start Using Bstream'
  }
];

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (step === steps.length - 1) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(Math.max(0, step - 1));
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
  };

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (completed === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{steps[step].title}</h2>
          <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400">{steps[step].image}</span>
          </div>
          <p className="text-gray-600">{steps[step].description}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded ${
                  index === step ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {step + 1} of {steps.length}
          </span>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={step === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <ChevronLeft size={20} className="mr-1" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {step === steps.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight size={20} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
