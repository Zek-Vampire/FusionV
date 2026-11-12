import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare, Send, Users } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate, formatDateTime, relativeTime } from '@/lib/format';
import { getMessageHistory, sendMessage } from '@/services/messages';
import { listTeams } from '@/services/teams';
import { paths } from '@/routes/paths';

export const MESSAGE_POLL_MS = 8_000;

export default function MessagesPage() {
  usePageTitle('Messages');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const teams = useQuery({
    queryKey: queryKeys.teams.mine,
    queryFn: () => listTeams({ mine: true }),
  });
  const myTeams = teams.data || [];
  const requestedId = searchParams.get('team');
  const selectedTeam = useMemo(
    () => myTeams.find((team) => String(team.id) === String(requestedId)) || myTeams[0] || null,
    [myTeams, requestedId],
  );
  const teamId = selectedTeam?.id;

  const history = useQuery({
    queryKey: queryKeys.messages.history(teamId),
    queryFn: () => getMessageHistory(teamId),
    enabled: Boolean(teamId),
    refetchInterval: () => (document.hidden ? false : MESSAGE_POLL_MS),
    refetchOnWindowFocus: true,
  });

  const messages = history.data || [];

  const send = useMutation({
    mutationFn: (content) => sendMessage(teamId, content),
    onSuccess: () => {
      setDraft('');
      setError('');
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.history(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (mutationError) => {
      setError(mutationError?.message || 'The message was not sent.');
    },
  });

  useEffect(() => {
    if (history.dataUpdatedAt) {
      endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }, [history.dataUpdatedAt, teamId]);

  function chooseTeam(id) {
    const next = new URLSearchParams(searchParams);
    next.set('team', String(id));
    setSearchParams(next);
    setDraft('');
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setError('Write a message first.');
      return;
    }
    if (content.length > 1000) {
      setError('Messages are limited to 1,000 characters.');
      return;
    }
    send.mutate(content);
  }

  if (teams.isPending) {
    return (
      <div>
        <PageHeader eyebrow="Team chat" title="Messages" description="Messages are visible to team members only." />
        <LoadingState className="mt-6" label="Loading your teams…" />
      </div>
    );
  }

  if (teams.isError) {
    return (
      <div>
        <PageHeader eyebrow="Team chat" title="Messages" description="Messages are visible to team members only." />
        <ErrorState
          className="mt-6"
          title="Your teams could not be loaded"
          message={teams.error?.message}
          onRetry={() => teams.refetch()}
        />
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Team chat"
          title="Messages"
          description="Team chat is available after you join a team. Direct messages are not supported."
        />
        <EmptyState
          className="mt-6"
          icon={MessagesSquare}
          title="You are not in a team yet"
          description="Join or create a team to open its chat."
          action={<ButtonLink to={paths.teams}>Find a team</ButtonLink>}
        />
      </div>
    );
  }

  const memberCount = selectedTeam?.memberCount ?? selectedTeam?.members?.length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Team chat"
        title="Messages"
        description="Chat with your team. The conversation refreshes every 8 seconds while this tab is visible."
        actions={
          <Badge variant="neutral" dot>
            Live polling
          </Badge>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-panel border border-line bg-surface p-4">
          <Select
            label="Team"
            name="team"
            value={teamId ?? ''}
            onChange={(event) => chooseTeam(event.target.value)}
          >
            {myTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>

          <ul className="mt-3 space-y-1" aria-label="Your teams">
            {myTeams.map((team) => {
              const active = team.id === teamId;
              return (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => chooseTeam(team.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active ? 'bg-lime/10 text-lime' : 'text-silver hover:bg-elevated hover:text-ink'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-background text-[10px] font-bold">
                      {(team.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{team.name}</span>
                      <span className="block truncate text-[10px] text-muted">
                        {team.memberCount}/{team.maxMembers} members
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-line pt-3">
            <Link to={paths.team(teamId)} className="text-xs font-semibold text-lime hover:underline">
              Open team details
            </Link>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted">
              <Users size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              Messages are stored by the backend and visible to this team only.
            </p>
          </div>
        </aside>

        <section className="flex min-h-[560px] flex-col overflow-hidden rounded-panel border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{selectedTeam?.name}</h2>
              <p className="text-xs text-muted">
                {selectedTeam?.hackathonName || 'No linked hackathon'} · {memberCount} members
              </p>
            </div>
            <Badge variant={history.isFetching ? 'warning' : 'success'} dot>
              {history.isFetching ? 'Refreshing' : 'Up to date'}
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
            {history.isPending ? (
              <LoadingState label="Loading messages…" rows={4} />
            ) : history.isError ? (
              <ErrorState
                title="Messages could not be loaded"
                message={history.error?.message}
                onRetry={() => history.refetch()}
              />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={MessagesSquare}
                title="No messages yet"
                description="Start the conversation with your team."
                className="border-0 bg-transparent"
              />
            ) : (
              <ul className="space-y-4">
                {messages.map((message, index) => {
                  const own = message.senderId === user?.id;
                  const previous = messages[index - 1];
                  const newDay =
                    !previous ||
                    formatDate(previous.createdAt) !== formatDate(message.createdAt);
                  return (
                    <li key={message.id}>
                      {newDay ? (
                        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {formatDate(message.createdAt)}
                        </p>
                      ) : null}
                      <div className={`flex items-end gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                        {!own ? <Avatar name={message.senderName} size="sm" /> : null}
                        <div className={`max-w-[82%] ${own ? 'text-right' : ''}`}>
                          {!own ? (
                            <p className="mb-1 text-[11px] font-semibold text-silver">
                              {message.senderName}
                            </p>
                          ) : null}
                          <div
                            className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                              own
                                ? 'rounded-br-md bg-lime text-background'
                                : 'rounded-bl-md border border-line bg-background/60 text-silver'
                            }`}
                          >
                            {message.content}
                          </div>
                          <p
                            className="mt-1 text-[10px] text-muted"
                            title={formatDateTime(message.createdAt)}
                          >
                            {relativeTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
                <li ref={endRef} aria-hidden="true" />
              </ul>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-line p-3 sm:p-4" noValidate>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="message-draft" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message-draft"
                  rows={2}
                  maxLength={1000}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submit(event);
                    }
                  }}
                  placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                  className="w-full resize-none rounded-xl border border-line bg-background/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                  <span>Visible to team members only.</span>
                  <span>{draft.length}/1000</span>
                </div>
              </div>
              <Button type="submit" icon={Send} loading={send.isPending} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
            {error ? (
              <p role="alert" className="mt-1 text-xs text-red-300">
                {error}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
