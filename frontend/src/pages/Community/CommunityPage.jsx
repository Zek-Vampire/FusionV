import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass, PenSquare, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import PostCard from '@/components/posts/PostCard';
import PostFormDialog from '@/components/posts/PostFormDialog';
import Button from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { usePageTitle } from '@/hooks/usePageTitle';
import { POST_TYPES } from '@/lib/posts';
import { queryKeys } from '@/lib/queryKeys';
import { listPosts } from '@/services/posts';

const PAGE_SIZE = 10;

const FILTERS = [{ value: '', label: 'All posts' }, ...POST_TYPES];

export default function CommunityPage() {
  usePageTitle('Community');
  const queryClient = useQueryClient();
  const [type, setType] = useState('');
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = { type, mine, page, size: PAGE_SIZE };
  const feed = useQuery({
    queryKey: queryKeys.posts.feed(params),
    queryFn: () => listPosts(params),
  });

  const posts = feed.data || [];

  function updateCached(updated) {
    queryClient.setQueryData(queryKeys.posts.feed(params), (current) =>
      Array.isArray(current)
        ? current.map((post) => (post.id === updated.id ? updated : post))
        : current,
    );
  }

  function removeCached(id) {
    queryClient.setQueryData(queryKeys.posts.feed(params), (current) =>
      Array.isArray(current) ? current.filter((post) => post.id !== id) : current,
    );
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
  }

  function changeType(value) {
    setType(value);
    setPage(0);
  }

  function openCreate() {
    setEditing(null);
    setComposerOpen(true);
  }

  function openEdit(post) {
    setEditing(post);
    setComposerOpen(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="What students are building"
        description="Updates, projects and achievements shared by FusionV students. Links open in a new tab; all content is self-reported."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Create post
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter posts by type">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              aria-pressed={type === filter.value}
              onClick={() => changeType(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                type === filter.value
                  ? 'bg-lime text-background'
                  : 'border border-line text-muted hover:border-lime/40 hover:text-lime'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-silver">
          <input
            type="checkbox"
            checked={mine}
            onChange={(event) => {
              setMine(event.target.checked);
              setPage(0);
            }}
            className="h-4 w-4 rounded border-line bg-background accent-lime"
          />
          Only my posts
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between" role="status" aria-live="polite">
        <p className="text-sm text-muted">
          {feed.isSuccess ? (
            <>
              <strong className="text-ink">{posts.length}</strong>{' '}
              {posts.length === 1 ? 'post' : 'posts'} on this page
            </>
          ) : null}
        </p>
        {feed.isFetching && !feed.isPending ? (
          <span className="text-xs text-muted">Refreshing…</span>
        ) : null}
      </div>

      <div className="mt-3">
        {feed.isPending ? (
          <div className="space-y-4" role="status" aria-label="Loading community posts">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-panel border border-line bg-surface p-5">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-5/6" />
              </div>
            ))}
          </div>
        ) : feed.isError ? (
          <ErrorState
            title="The community feed could not be loaded"
            message={feed.error?.message}
            onRetry={() => feed.refetch()}
            retryLabel="Reload feed"
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={mine || type ? Search : Compass}
            title={mine || type ? 'No posts match this filter' : 'No posts yet'}
            description={
              mine || type
                ? 'Try another post type, or clear the filter to see the whole feed.'
                : 'Share an update, project or achievement to start the community feed.'
            }
            action={
              mine || type ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMine(false);
                    changeType('');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button icon={PenSquare} onClick={openCreate}>
                  Write the first post
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onChanged={updateCached}
                onDeleted={removeCached}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || feed.isFetching}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={posts.length < PAGE_SIZE || feed.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <PostFormDialog
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
        post={editing}
        onSaved={() => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })}
      />
    </div>
  );
}
