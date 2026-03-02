import { RouterProvider } from 'react-router';
import { router } from './routes';
import { IncidentCredibilityProvider } from './providers/IncidentCredibilityProvider';

export default function App() {
  return (
    <IncidentCredibilityProvider>
      <RouterProvider router={router} />
    </IncidentCredibilityProvider>
  );
}
