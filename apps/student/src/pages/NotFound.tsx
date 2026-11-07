import { EmptyState, ButtonLink } from '@/components/ui';

export function NotFoundPage() {
  return (
    <EmptyState emoji="🧭" title="This page took a wrong turn" className="mt-10" action={<ButtonLink to="/explore">Explore challenges</ButtonLink>}>
      The page you're looking for doesn't exist.
    </EmptyState>
  );
}
