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
              toast: '!font-sans !rounded-[var(--borderRadiusMedium)] !border-0 !shadow-[var(--shadow8)] !bg-[var(--colorNeutralBackground1)] !text-[var(--colorNeutralForeground1)]',
              title: '!text-sm !font-semibold',
              description: '!text-sm !text-[var(--colorNeutralForeground2)]',
              actionButton:
                '!bg-[var(--colorBrandBackground)] !text-white !font-semibold !rounded-[var(--borderRadiusMedium)] !h-6 !text-xs',
            },
          }}
        />
      </PersonaProvider>
    </QueryClientProvider>
  </StrictMode>,
);
