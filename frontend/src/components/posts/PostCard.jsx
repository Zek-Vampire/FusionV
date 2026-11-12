import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CalendarDays, Heart, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CommentsSection from '@/components/posts/CommentsSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { deletePost, likePost, unlikePost } from '@/services/posts';
import { formatDate, formatNumber, relativeTime } from '@/lib/format';
import { postTypeLabel, postTypeTone } from '@/lib/posts';
import { safeHttpUrl } from '@/lib/validation';
import { paths } from '@/routes/paths';

function ExternalLink({ href, children }) {
  const safe = safeHttpUrl(href);
  if (!safe) return null;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-lime hover:underline"
    >
      {children}
    </a>
  );
}

export default function PostCard({ post, onChanged, onEdit, onDeleted }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const own = user?.id === post.authorId;
  const canDelete = own || user?.role === 'ADMIN';

  const like = useMutation({
    mutationFn: () => (post.likedByMe ? unlikePost(post.id) : likePost(post.id)),
    onSuccess: (updated) => onChanged?.(updated),
    onError: (error) =>
      toast({ title: 'Could not update the like', description: error?.message, variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      setDeleteOpen(false);
      toast({ title: 'Post deleted', variant: 'success' });
      onDeleted?.(post.id);
    },
    onError: (error) =>
      toast({ title: 'Could not delete the post', description: error?.message, variant: 'error' }),
  });

  return (
    <article className="rounded-panel border border-line bg-surface p-5">
      <header className="flex items-start gap-3">
        <Avatar name={post.authorName} />
        <div className="min-w-0 flex-1">
          <Link
            to={own ? paths.profile : paths.student(post.authorId)}
            className="truncate text-sm font-semibold text-ink hover:text-lime"
          >
            {post.authorName}
          </Link>
          <p className="mt-0.5 text-[11px] text-muted" title={post.createdAt}>
            {relativeTime(post.createdAt)}
            {post.updatedAt ? ' · edited' : ''}
          </p>
        </div>
        <Badge variant={postTypeTone(post.type)}>{postTypeLabel(post.type)}</Badge>
      </header>

      <div className="mt-4 space-y-2">
        {post.title ? <h3 className="text-lg font-semibold tracking-tight">{post.title}</h3> : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-silver">
          {post.content}
        </p>

        {post.technologies?.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
            {post.technologies.map((technology) => (
              <li
                key={technology}
                className="rounded-md border border-line bg-background/50 px-2 py-1 text-[11px] text-muted"
              >
                {technology}
              </li>
            ))}
          </ul>
        ) : null}

        {post.organization ? (
          <p className="text-xs text-muted">{post.organization}</p>
        ) : null}
        {post.eventDate ? (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays size={12} aria-hidden="true" />
            {formatDate(post.eventDate)}
          </p>
        ) : null}

        {post.repoUrl || post.projectUrl || post.achievementUrl ? (
          <div className="flex flex-wrap gap-3 pt-1">
            <ExternalLink href={post.repoUrl}>Repository</ExternalLink>
            <ExternalLink href={post.projectUrl}>Live project</ExternalLink>
            <ExternalLink href={post.achievementUrl}>Certificate / proof</ExternalLink>
          </div>
        ) : null}
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => like.mutate()}
          loading={like.isPending}
          aria-pressed={Boolean(post.likedByMe)}
          aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
          className={post.likedByMe ? 'text-lime' : undefined}
        >
          <Heart
            size={15}
            fill={post.likedByMe ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          {formatNumber(post.likeCount)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommentsOpen((value) => !value)}
          aria-expanded={commentsOpen}
        >
          <MessageCircle size={15} aria-hidden="true" />
          {formatNumber(commentCount)} comments
        </Button>
        {own ? (
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(post)}>
            <Pencil size={14} aria-hidden="true" /> Edit
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="ml-auto text-red-300"
          >
            <Trash2 size={14} aria-hidden="true" /> Delete
          </Button>
        ) : null}
      </footer>

      {commentsOpen ? (
        <CommentsSection
          postId={post.id}
          onCountChange={(delta) => setCommentCount((count) => Math.max(0, count + delta))}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Delete post"
        message="Delete this post permanently? Its comments and likes are removed too."
        confirmLabel="Delete post"
        loading={remove.isPending}
      />
    </article>
  );
}
