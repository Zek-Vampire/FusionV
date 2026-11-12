import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, Filter, Mail, Plus, RotateCcw, Search, Sparkles, Users } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import TeamCard from '@/components/teams/TeamCard';
import TeamFormDialog from '@/components/teams/TeamFormDialog';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, LoadingState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSavedTeams } from '@/hooks/useSavedTeams';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate, relativeTime } from '@/lib/format';
import { recommendTeams } from '@/lib/teamRecommendations';
import { listHackathons } from '@/services/hackathons';
import { listSkills } from '@/services/skills';
import {
  cancelJoinRequest,
  listMyInvitations,
  listTeams,
  requestToJoin,
  respondToInvitation,
} from '@/services/teams';
import { paths } from '@/routes/paths';

const TABS = [
  { id: 'all', label: 'Discover', icon: Users },
  { id: 'mine', label: 'My teams', icon: Users },
  { id: 'invites', label: 'Invitations', icon: Mail },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

const CAPACITIES = [
  { value: '', label: 'Any capacity' },
  { value: '2-3', label: '2–3 members' },
  { value: '4-5', label: '4–5 members' },
  { value: '6-8', label: '6–8 members' },
  { value: '9-10', label: '9–10 members' },
];

const VALID_TABS = new Set(TABS.map((tab) => tab.id));

export default function TeamsPage() {
  usePageTitle('Teams');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = VALID_TABS.has(searchParams.get('tab')) ? searchParams.get('tab') : 'all';
  const [filters, setFilters] = useState({
    q: '',
    skill: '',
    capacity: '',
    hackathonId: '',
    openOnly: false,
    sort: 'latest',
  });
  const [createOpen, setCreateOpen] = useState(false);
  const saved = useSavedTeams(user?.id);

  const activeFilters = {
    q: filters.q.trim(),
    skill: filters.skill ? [filters.skill] : [],
    minSize: filters.capacity ? Number(filters.capacity.split('-')[0]) : '',
    maxSize: filters.capacity ? Number(filters.capacity.split('-')[1]) : '',
    hackathonId: filters.hackathonId,
    openOnly: filters.openOnly,
    sort: filters.sort,
    mine: tab === 'mine',
  };

  const teams = useQuery({
    queryKey: queryKeys.teams.list(activeFilters),
    queryFn: () => listTeams(activeFilters),
    enabled: tab === 'all' || tab === 'mine',
  });
  const invitations = useQuery({
    queryKey: queryKeys.teams.invitations,
    queryFn: listMyInvitations,
  });
  const allTeams = useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => listTeams(),
    enabled: tab === 'all',
  });
  const skills = useQuery({ queryKey: queryKeys.skills.all, queryFn: listSkills });
  const hackathons = useQuery({
    queryKey: queryKeys.hackathons.list({}),
    queryFn: () => listHackathons(),
  });

  const pendingInvites = (invitations.data || []).filter((item) => item.status === 'PENDING');
  const inviteByTeam = useMemo(() => {
    const map = new Map();
    pendingInvites.forEach((invite) => map.set(Number(invite.teamId), invite));
    return map;
  }, [pendingInvites]);

  function invalidateTeams() {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.invitations });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }

  const join = useMutation({
    mutationFn: requestToJoin,
    onSuccess: () => {
      toast({ title: 'Join request sent', description: 'The team leader can accept it.', variant: 'success' });
      invalidateTeams();
    },
    onError: (error) => toast({ title: 'Could not send the request', description: error?.message, variant: 'error' }),
  });
  const cancel = useMutation({
    mutationFn: cancelJoinRequest,
    onSuccess: () => {
      toast({ title: 'Join request cancelled', variant: 'success' });
      invalidateTeams();
    },
    onError: (error) => toast({ title: 'Could not cancel the request', description: error?.message, variant: 'error' }),
  });
  const respond = useMutation({
    mutationFn: ({ id, accept }) => respondToInvitation(id, accept),
    onSuccess: (_, variables) => {
      toast({
        title: variables.accept ? 'Invitation accepted' : 'Invitation declined',
        variant: 'success',
      });
      invalidateTeams();
    },
    onError: (error) => toast({ title: 'Could not respond to the invitation', description: error?.message, variant: 'error' }),
  });

  const busy = join.isPending || cancel.isPending || respond.isPending;
  const list = teams.data || [];
  const visible = tab === 'saved' ? list.filter((team) => saved.has(team.id)) : list;
  const canShowDiscovery = tab === 'all' || tab === 'mine';
  const hasFilters = Boolean(
    filters.q.trim() || filters.skill || filters.capacity || filters.hackathonId || filters.openOnly,
  );
  const recommendations = useMemo(
    () => recommendTeams(allTeams.data || [], user),
    [allTeams.data, user],
  );

  function changeTab(next) {
    setSearchParams(next === 'all' ? {} : { tab: next });
  }

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters({ q: '', skill: '', capacity: '', hackathonId: '', openOnly: false, sort: 'latest' });
  }

  function toggleSaved(teamId) {
    const isSaved = saved.toggle(teamId);
    toast({
      title: isSaved ? 'Saved on this device' : 'Removed from saved teams',
      description: 'Saved teams are stored in this browser only.',
      variant: 'info',
    });
  }

  function teamCard(team) {
    return (
      <TeamCard
        key={team.id}
        team={team}
        saved={saved.has(team.id)}
        invitation={inviteByTeam.get(Number(team.id))}
        onToggleSaved={toggleSaved}
        onRequestJoin={(id) => join.mutate(id)}
        onCancelRequest={(id) => cancel.mutate(id)}
        onAcceptInvitation={(id) => respond.mutate({ id, accept: true })}
        busy={busy}
        savedNote={tab === 'saved'}
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Collaborate"
        title="Teams"
        description="Find a team that needs your skills, manage your own team and respond to invitations."
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create a team
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Team views"
        className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => changeTab(item.id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selected ? 'bg-lime text-background' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
              {item.id === 'invites' && pendingInvites.length ? (
                <span className={`rounded-full px-1.5 text-[10px] ${selected ? 'bg-background/20' : 'bg-lime/15 text-lime'}`}>
                  {pendingInvites.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === 'invites' ? (
        <div className="mt-5">
          {invitations.isPending ? (
            <LoadingState label="Loading invitations…" />
          ) : invitations.isError ? (
            <ErrorState
              title="Invitations could not be loaded"
              message={invitations.error?.message}
              onRetry={() => invitations.refetch()}
            />
          ) : pendingInvites.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No pending invitations"
              description="When a team leader invites you by email, the invitation appears here so you can accept or decline it."
            />
          ) : (
            <ul className="space-y-3">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 sm:flex-row sm:items-center"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-sm font-bold text-lime">
                    {(invite.teamName || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{invite.teamName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Invited {relativeTime(invite.createdAt)} · {formatDate(invite.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={respond.isPending && respond.variables?.id === invite.id}
                      onClick={() => respond.mutate({ id: invite.id, accept: true })}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: invite.id, accept: false })}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {tab === 'saved' ? (
              <div className="rounded-panel border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs text-amber-200">
                <Bookmark size={13} className="mr-1 inline" aria-hidden="true" />
                Saved teams are stored on this device only and are not synced between devices.
              </div>
            ) : null}

            {canShowDiscovery ? (
              <div className="mt-3 rounded-panel border border-line bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SearchInput
                    value={filters.q}
                    onChange={(value) => update('q', value)}
                    placeholder="Search by name, skill or hackathon…"
                    className="min-w-0 flex-1"
                  />
                  <Select
                    label="Sort"
                    name="sort"
                    value={filters.sort}
                    containerClassName="sm:w-40"
                    className="h-10"
                    onChange={(event) => update('sort', event.target.value)}
                  >
                    <option value="latest">Latest</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="spots">Most open spots</option>
                  </Select>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Select
                    label="Required skill"
                    name="skill"
                    value={filters.skill}
                    onChange={(event) => update('skill', event.target.value)}
                  >
                    <option value="">All skills</option>
                    {(skills.data || []).map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Capacity"
                    name="capacity"
                    value={filters.capacity}
                    hint="Maximum team size, not current membership."
                    onChange={(event) => update('capacity', event.target.value)}
                  >
                    {CAPACITIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Hackathon"
                    name="hackathonId"
                    value={filters.hackathonId}
                    onChange={(event) => update('hackathonId', event.target.value)}
                  >
                    <option value="">All hackathons</option>
                    {(hackathons.data || []).map((hackathon) => (
                      <option key={hackathon.id} value={hackathon.id}>
                        {hackathon.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                  <label className="flex items-center gap-2 text-xs text-silver">
                    <input
                      type="checkbox"
                      checked={filters.openOnly}
                      onChange={(event) => update('openOnly', event.target.checked)}
                      className="h-4 w-4 rounded border-line bg-background accent-lime"
                    />
                    Only teams looking for members
                  </label>
                  {hasFilters ? (
                    <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                  <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <Filter size={12} aria-hidden="true" />
                    Filters apply to this request only.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-sm text-muted" role="status" aria-live="polite">
                {teams.isSuccess || tab === 'saved' ? (
                  <>
                    <strong className="text-ink">{visible.length}</strong>{' '}
                    {visible.length === 1 ? 'team' : 'teams'}
                    {tab === 'mine' ? ' you belong to' : hasFilters ? ' matching your filters' : ''}
                  </>
                ) : null}
              </p>
            </div>

            <div className="mt-3">
              {tab === 'saved' && list.length === 0 && saved.ids.length > 0 && teams.isPending ? (
                <LoadingState label="Loading your teams…" />
              ) : teams.isPending ? (
                <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Loading teams">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="rounded-panel border border-line bg-surface p-5">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <Skeleton className="mt-3 h-5 w-2/3" />
                      <Skeleton className="mt-3 h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-4/5" />
                    </div>
                  ))}
                </div>
              ) : teams.isError ? (
                <ErrorState
                  title="Teams could not be loaded"
                  message={teams.error?.message}
                  onRetry={() => teams.refetch()}
                  retryLabel="Reload teams"
                />
              ) : visible.length === 0 ? (
                tab === 'mine' ? (
                  <EmptyState
                    icon={Users}
                    title="You are not in a team yet"
                    description="Create a team or explore teams that are looking for members."
                    action={<Button onClick={() => setCreateOpen(true)}>Create a team</Button>}
                  />
                ) : tab === 'saved' ? (
                  <EmptyState
                    icon={Bookmark}
                    title="No saved teams on this device"
                    description="Tap the bookmark on a team card to keep it here. Saved teams are stored in this browser only and are not synced between devices."
                    action={
                      <Button variant="outline" onClick={() => changeTab('all')}>
                        Explore teams
                      </Button>
                    }
                  />
                ) : hasFilters ? (
                  <EmptyState
                    icon={Search}
                    title="No teams match these filters"
                    description="Try a different skill, capacity or search, or clear the filters."
                    action={<Button onClick={resetFilters}>Clear filters</Button>}
                  />
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No teams yet"
                    description="No team has been created yet. Start one and invite other students."
                    action={<Button onClick={() => setCreateOpen(true)}>Create the first team</Button>}
                  />
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2">{visible.map(teamCard)}</div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-panel border border-line bg-surface p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles size={15} className="text-lime" aria-hidden="true" />
                Suggested for you
              </h2>
              {!user?.skills?.length && !user?.interests?.length ? (
                <p className="mt-3 text-xs text-muted">
                  Add skills and interests to your profile to get recommendations based on real team
                  requirements.
                </p>
              ) : allTeams.isPending ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : allTeams.isError ? (
                <p className="mt-3 text-xs text-red-300">Recommendations could not be loaded.</p>
              ) : recommendations.length === 0 ? (
                <p className="mt-3 text-xs text-muted">
                  No strong matches right now. Teams are ranked only when their required skills
                  overlap with your skills or interests.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {recommendations.map(({ team, reasons }) => (
                    <li key={team.id}>
                      <a href={paths.team(team.id)} className="text-sm font-semibold hover:text-lime">
                        {team.name}
                      </a>
                      <p className="mt-0.5 text-[11px] text-muted">{reasons.join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 border-t border-line pt-3 text-[11px] text-muted">
                Recommendations use your saved skills and interests, not the filters on this page.
              </p>
            </section>

            <section className="rounded-panel border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Invitations</h2>
                <Badge variant={pendingInvites.length ? 'warning' : 'neutral'}>
                  {pendingInvites.length} pending
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted">
                Invitations are sent by email to existing FusionV accounts.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => changeTab('invites')}
              >
                Review invitations
              </Button>
            </section>
          </aside>
        </div>
      )}

      <TeamFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(team) => {
          invalidateTeams();
          if (team?.id) {
            setCreateOpen(false);
          }
        }}
      />
    </div>
  );
}
