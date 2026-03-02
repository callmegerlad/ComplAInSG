import { RouterProvider } from 'react-router';
import { router } from './routes';
import { IncidentCredibilityProvider } from './providers/IncidentCredibilityProvider';
import { AuthProvider } from './providers/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <IncidentCredibilityProvider>
        <RouterProvider router={router} />
      </IncidentCredibilityProvider>
    </AuthProvider>
  );
}
