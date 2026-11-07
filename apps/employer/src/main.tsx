import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { Toaster } from 'sonner';
import './index.css';
import { router } from './App';
import { PersonaProvider } from './lib/persona';
import { queryClient } from './lib/queries';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PersonaProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          closeButton
          visibleToasts={4}
          offset={{ top: 64, right: 16 }}
          mobileOffset={{ top: 64, right: 12, left: 12 }}
          toastOptions={{
            classNames: {
              toast: 'font-sans !rounded-xl !shadow-pop',
              title: '!text-[13px] !font-semibold',
              description: '!text-xs',
              actionButton: '!bg-primary !text-white !font-semibold',
            },
          }}
        />
      </PersonaProvider>
    </QueryClientProvider>
  </StrictMode>,
);
