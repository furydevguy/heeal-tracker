import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

export const useNavigationSpinner = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const navigateWithSpinner = useCallback(
    async (
      route: string, 
      options?: { 
        message?: string; 
        delay?: number;
        replace?: boolean;
      }
    ) => {
      try {
        setLoadingMessage(options?.message || 'Loading...');
        setIsLoading(true);
        
        // Add a minimum delay to show the spinner
        const minDelay = options?.delay || 300;
        await new Promise(resolve => setTimeout(resolve, minDelay));
        
        if (options?.replace) {
          router.replace(route as any);
        } else {
          router.push(route as any);
        }
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        // Keep spinner visible for a moment after navigation
        setTimeout(() => setIsLoading(false), 100);
      }
    },
    [router]
  );

  const goBackWithSpinner = useCallback(
    async (options?: { message?: string; delay?: number }) => {
      try {
        setLoadingMessage(options?.message || 'Going back...');
        setIsLoading(true);
        
        const minDelay = options?.delay || 200;
        await new Promise(resolve => setTimeout(resolve, minDelay));
        
        router.back();
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 100);
      }
    },
    [router]
  );

  const setLoadingState = useCallback((loading: boolean, message?: string) => {
    setIsLoading(loading);
    if (message) setLoadingMessage(message);
  }, []);

  return {
    isLoading,
    loadingMessage,
    navigateWithSpinner,
    goBackWithSpinner,
    setLoadingState,
  };
};

export default useNavigationSpinner;
