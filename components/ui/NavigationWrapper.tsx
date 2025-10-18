import React, { ReactNode, createContext, useContext, useState } from 'react';
import { NavigationSpinner } from './Spinner';

interface NavigationContextType {
  showSpinner: (message?: string, type?: 'dots' | 'pulse' | 'wave' | 'bars') => void;
  hideSpinner: () => void;
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const [spinnerType, setSpinnerType] = useState<'dots' | 'pulse' | 'wave' | 'bars'>('dots');

  const showSpinner = (msg?: string, type?: 'dots' | 'pulse' | 'wave' | 'bars') => {
    setMessage(msg || 'Loading...');
    setSpinnerType(type || 'dots');
    setIsLoading(true);
  };

  const hideSpinner = () => {
    setIsLoading(false);
  };

  return (
    <NavigationContext.Provider value={{ showSpinner, hideSpinner, isLoading }}>
      {children}
      <NavigationSpinner visible={isLoading} message={message} type={spinnerType} />
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;
