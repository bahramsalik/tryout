import { ButtonLink, EmptyState } from '@/components/ui';

export function NotFoundPage() {
  return <EmptyState title="Page not found" className="mt-10" action={<ButtonLink to="/explore">Explore</ButtonLink>} />;
}
