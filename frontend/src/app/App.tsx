import { RouterProvider } from 'react-router';
import { router } from './routes';
import { IncidentCredibilityProvider } from './providers/IncidentCredibilityProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AlertsProvider } from './providers/AlertsProvider';

export default function App() {
  return (
    <AuthProvider>
      <AlertsProvider>
        <IncidentCredibilityProvider>
          <RouterProvider router={router} />
        </IncidentCredibilityProvider>
      </AlertsProvider>
    </AuthProvider>
  );
}
