import { ArrowRight, Home } from 'lucide-react';
import BackgroundFX from '@/components/common/BackgroundFX';
import { ButtonLink } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { paths } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <BackgroundFX />

      <Badge variant="lime" dot>
        404
      </Badge>
      <h1 className="text-gradient mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        That address does not belong to a FusionV page. It may be mistyped, or the item may have
        been removed.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink to={paths.home} icon={Home}>
          Go home
        </ButtonLink>
        <ButtonLink to={paths.hackathons} variant="outline" iconRight={ArrowRight}>
          Explore hackathons
        </ButtonLink>
      </div>
    </div>
  );
}
