import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { addComment, deleteComment, listComments } from '@/services/posts';
import { queryKeys } from '@/lib/queryKeys';
import { relativeTime } from '@/lib/format';

export default function CommentsSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const comments = useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: () => listComments(postId),
  });

  const add = useMutation({
    mutationFn: () => addComment(postId, content.trim()),
    onSuccess: () => {
      setContent('');
      setError('');
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      onCountChange?.(1);
      toast({ title: 'Comment added', variant: 'success' });
    },
    onError: (mutationError) => setError(mutationError?.message || 'The comment was not posted.'),
  });

  const remove = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      onCountChange?.(-1);
      toast({ title: 'Comment deleted', variant: 'success' });
    },
    onError: (mutationError) =>
      toast({
        title: 'Could not delete the comment',
        description: mutationError?.message,
        variant: 'error',
      }),
  });

  function submit(event) {
    event.preventDefault();
    if (!content.trim()) {
      setError('Write a comment first.');
      return;
    }
    if (content.trim().length > 1000) {
      setError('Comments are limited to 1,000 characters.');
      return;
    }
    add.mutate();
  }

  return (
    <section className="mt-4 border-t border-line pt-4" aria-label="Comments">
      {comments.isPending ? (
        <p role="status" className="text-xs text-muted">
          Loading comments…
        </p>
      ) : comments.isError ? (
        <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3 text-xs text-red-200">
          <p>{comments.error?.message}</p>
          <button
            type="button"
            onClick={() => comments.refetch()}
            className="mt-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      ) : comments.data?.length ? (
        <ul className="space-y-3">
          {comments.data.map((comment) => {
            const canDelete = user?.id === comment.authorId || user?.role === 'ADMIN';
            return (
              <li key={comment.id} className="flex items-start gap-2.5">
                <Avatar name={comment.authorName} size="sm" />
                <div className="min-w-0 flex-1 rounded-xl bg-background/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ink">{comment.authorName}</p>
                    <span className="shrink-0 text-[10px] text-muted">
                      {relativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-silver">
                    {comment.content}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => remove.mutate(comment.id)}
                    disabled={remove.isPending}
                    aria-label={`Delete comment by ${comment.authorName}`}
                    className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-red-300"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted">No comments yet. Be the first to reply.</p>
      )}

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Add a comment
        </label>
        <input
          id={`comment-${postId}`}
          name="content"
          value={content}
          maxLength={1000}
          onChange={(event) => {
            setContent(event.target.value);
            setError('');
          }}
          placeholder="Write a comment…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-background/60 px-3 text-sm text-ink placeholder:text-muted/70 focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20"
        />
        <Button type="submit" size="sm" loading={add.isPending} icon={Send}>
          Comment
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
