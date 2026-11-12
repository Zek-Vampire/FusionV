import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { FolderOpen, LogIn, RotateCcw, Search } from 'lucide-react';
import ResourceCard from '@/components/cards/ResourceCard';
import PageHeader from '@/components/public/PageHeader';
import Button, { ButtonLink } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { listResources } from '@/services/resources';
import { paths } from '@/routes/paths';

const EMPTY_FORM = { q: '', category: '', subject: '', tag: '' };

function formFromParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    subject: searchParams.get('subject') || '',
    tag: searchParams.get('tag') || '',
  };
}

export default function ResourcesPage() {
  usePageTitle('Resources');
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramString = searchParams.toString();
  const [form, setForm] = useState(() => formFromParams(searchParams));

  useEffect(() => {
    setForm(formFromParams(searchParams));
  }, [paramString, searchParams]);

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      subject: searchParams.get('subject') || '',
      tag: searchParams.get('tag') || '',
    }),
    [paramString, searchParams],
  );

  const resources = useQuery({
    queryKey: queryKeys.resources.list(filters),
    queryFn: () => listResources(filters),
  });

  const hasFilters = Boolean(paramString);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyFilters() {
    const next = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (String(value).trim()) next.set(key, String(value).trim());
    });
    setSearchParams(next);
  }

  function clearFilters() {
    setForm(EMPTY_FORM);
    setSearchParams({});
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student library"
        title="Resources"
        description="Notes, question papers and study material shared by students. Every file is real and downloadable."
        actions={
          isAuthenticated ? (
            <ButtonLink to={paths.myResources} variant="outline" icon={FolderOpen}>
              My resources
            </ButtonLink>
          ) : (
            <ButtonLink
              to={`${paths.login}?next=${encodeURIComponent(paths.resources)}`}
              variant="outline"
              icon={LogIn}
            >
              Log in to upload
            </ButtonLink>
          )
        }
      />

      <form
        role="search"
        aria-label="Filter resources"
        className="mt-6 rounded-panel border border-line bg-surface p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            containerClassName="sm:col-span-2"
            label="Search resources"
            name="q"
            type="search"
            placeholder="Title, description, subject or tag"
            value={form.q}
            onChange={(event) => updateField('q', event.target.value)}
          />
          <Select
            label="Category"
            name="category"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            <option value="">All categories</option>
            <option value="NOTES">Notes</option>
            <option value="QUESTION_PAPER">Question paper</option>
            <option value="PDF">PDF</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input
            label="Subject"
            name="subject"
            placeholder="e.g. DBMS"
            value={form.subject}
            onChange={(event) => updateField('subject', event.target.value)}
          />
          <Input
            label="Tag"
            name="tag"
            placeholder="e.g. sql"
            value={form.tag}
            onChange={(event) => updateField('tag', event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="ghost" icon={RotateCcw} onClick={clearFilters} disabled={!hasFilters}>
            Clear all
          </Button>
          <span className="ml-auto text-xs text-muted">
            Downloads keep the original filename supplied by the server.
          </span>
        </div>
      </form>

      <div className="mt-6" role="status" aria-live="polite">
        {resources.isSuccess ? (
          <p className="text-sm text-muted">
            <strong className="text-ink">{resources.data?.length ?? 0}</strong>{' '}
            {resources.data?.length === 1 ? 'resource' : 'resources'}
            {hasFilters ? ' matching your filters' : ' in the library'}.
          </p>
        ) : null}
      </div>

      {resources.isPending ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2" role="status" aria-label="Loading resources">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex gap-4 rounded-panel border border-line bg-surface p-5">
              <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : resources.isError ? (
        <ErrorState
          className="mt-4"
          title="Resources could not be loaded"
          message={resources.error?.message}
          onRetry={() => resources.refetch()}
          retryLabel="Reload resources"
        />
      ) : (resources.data?.length ?? 0) === 0 ? (
        hasFilters ? (
          <EmptyState
            className="mt-4"
            icon={Search}
            title="No resources match these filters"
            description="Try another subject or tag, or clear the filters to browse everything."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <EmptyState
            className="mt-4"
            icon={FolderOpen}
            title="No resources have been shared yet"
            description="The library is empty. A signed-in student can upload the first set of notes or a question paper."
            action={
              isAuthenticated ? (
                <ButtonLink to={paths.myResources}>Open my resources</ButtonLink>
              ) : (
                <ButtonLink to={`${paths.login}?next=${encodeURIComponent(paths.resources)}`}>
                  Log in to upload
                </ButtonLink>
              )
            }
          />
        )
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {resources.data.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              canSeeUploader={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
