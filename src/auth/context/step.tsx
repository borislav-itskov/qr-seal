import React, { createContext, useState, useContext, useCallback } from 'react';

const StepContext = createContext<any>({});

const StepProvider = ({ children }: any) => {
  const [activeStep, setActiveStep] = useState(() => {
    const storedStep = localStorage.getItem('activeStep');
    return storedStep ? JSON.parse(storedStep) : 0;
  });

  const updateStep = useCallback((newStep: any) => {
    setActiveStep(newStep);
    localStorage.setItem('activeStep', JSON.stringify(newStep));
  }, []);

  return (
    <StepContext.Provider value={{ activeStep, setActiveStep: updateStep }}>
      {children}
    </StepContext.Provider>
  );
};

const useSteps = () => {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepProvider');
  }
  return context;
};

export { StepProvider, useSteps };
