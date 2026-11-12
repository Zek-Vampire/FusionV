import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Bookmark,
  CalendarDays,
  FolderOpen,
  Mail,
  MessagesSquare,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateRange, formatNumber, modeLabel, relativeTime } from '@/lib/format';
import { notificationMeta } from '@/lib/notifications';
import { recommendTeams } from '@/lib/teamRecommendations';
import { useSavedTeams } from '@/hooks/useSavedTeams';
import { listHackathons } from '@/services/hackathons';
import { listNotifications } from '@/services/notifications';
import { listResources } from '@/services/resources';
import { listMyInvitations, listTeams } from '@/services/teams';
import { getMyStats } from '@/services/users';
import { paths } from '@/routes/paths';

function Card({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`rounded-panel border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {Icon ? <Icon size={16} className="text-lime" aria-hidden="true" /> : null}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InlineSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={index === rows - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
      ))}
    </div>
  );
}

function SectionError({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3 text-xs text-red-200">
      <p>{message || 'This section could not be loaded.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-1.5 font-semibold underline">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const saved = useSavedTeams(user?.id);

  const stats = useQuery({ queryKey: queryKeys.users.stats, queryFn: getMyStats });
  const teams = useQuery({ queryKey: queryKeys.teams.mine, queryFn: () => listTeams({ mine: true }) });
  const invitations = useQuery({
    queryKey: queryKeys.teams.invitations,
    queryFn: listMyInvitations,
  });
  const notifications = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: listNotifications,
    refetchInterval: () => (document.hidden ? false : 60_000),
  });
  const hackathons = useQuery({
    queryKey: queryKeys.hackathons.list({}),
    queryFn: () => listHackathons(),
  });
  const resources = useQuery({
    queryKey: queryKeys.resources.list({}),
    queryFn: () => listResources(),
  });

  const myTeams = teams.data || [];
  const pendingInvites = (invitations.data || []).filter((item) => item.status === 'PENDING');
  const recentNotifications = (notifications.data || []).slice(0, 4);
  const recommendations = recommendTeams(myTeams, user);
  const openHackathons = (hackathons.data || []).slice(0, 3);
  const recentResources = (resources.data || []).slice(0, 3);
  const savedTeams = myTeams.filter((team) => saved.has(team.id));

  const statCards = [
    { label: 'Teams joined', value: stats.data?.teamsJoined, icon: Users, to: paths.teams },
    { label: 'Posts', value: stats.data?.posts, icon: Sparkles, to: paths.community },
    {
      label: 'Resources shared',
      value: stats.data?.resourcesShared,
      icon: FolderOpen,
      to: paths.myResources,
    },
    {
      label: 'Hackathons via teams',
      value: stats.data?.hackathons,
      icon: CalendarDays,
      to: paths.hackathons,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title={`Welcome back${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}`}
        description="Your real teams, invitations and activity from FusionV. Nothing on this page is simulated."
        actions={
          <>
            <ButtonLink to={paths.teams} variant="outline" icon={Users}>
              Explore teams
            </ButtonLink>
            <ButtonLink to={paths.community} icon={Sparkles}>
              Open community
            </ButtonLink>
          </>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="group rounded-panel border border-line bg-surface p-5 transition-colors hover:border-lime/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/25 bg-lime/10 text-lime">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <ArrowRight
                  size={15}
                  className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-lime"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight">
                {stats.isPending ? <Skeleton className="h-7 w-12" /> : formatNumber(card.value)}
              </p>
              <p className="mt-1 text-xs text-muted">{card.label}</p>
              {stats.isError ? (
                <p className="mt-1 text-[11px] text-red-300">Statistic unavailable</p>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Card
            title="Your teams"
            icon={Users}
            action={
              <Link to={paths.teams} className="text-xs font-semibold text-lime hover:underline">
                All teams
              </Link>
            }
          >
            {teams.isPending ? (
              <InlineSkeleton rows={3} />
            ) : teams.isError ? (
              <SectionError message={teams.error?.message} onRetry={() => teams.refetch()} />
            ) : myTeams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-5 text-center">
                <p className="text-sm text-silver">You are not in a team yet.</p>
                <p className="mt-1 text-xs text-muted">
                  Create one, or join an open team that needs your skills.
                </p>
                <ButtonLink to={paths.teams} size="sm" className="mt-4">
                  Find a team
                </ButtonLink>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {myTeams.slice(0, 4).map((team) => (
                  <li key={team.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-xs font-bold text-lime">
                      {(team.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link to={paths.team(team.id)} className="truncate text-sm font-semibold hover:text-lime">
                        {team.name}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {team.hackathonName || 'No linked hackathon'} · {team.memberCount}/
                        {team.maxMembers} members
                      </p>
                    </div>
                    <Badge variant={team.myStatus === 'LEADER' ? 'success' : 'lime'}>
                      {team.myStatus === 'LEADER' ? 'Leader' : 'Member'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Upcoming hackathons"
            icon={CalendarDays}
            action={
              <Link to={paths.hackathons} className="text-xs font-semibold text-lime hover:underline">
                Browse all
              </Link>
            }
          >
            {hackathons.isPending ? (
              <InlineSkeleton rows={3} />
            ) : hackathons.isError ? (
              <SectionError message={hackathons.error?.message} onRetry={() => hackathons.refetch()} />
            ) : openHackathons.length === 0 ? (
              <p className="text-sm text-muted">No hackathons have been published yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {openHackathons.map((hackathon) => (
                  <li key={hackathon.id} className="py-3 first:pt-0 last:pb-0">
                    <Link to={paths.hackathon(hackathon.id)} className="text-sm font-semibold hover:text-lime">
                      {hackathon.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDateRange(hackathon.startDate, hackathon.endDate) || 'Dates not listed'} ·{' '}
                      {modeLabel(hackathon.mode)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Community resources" icon={FolderOpen}>
            {resources.isPending ? (
              <InlineSkeleton rows={3} />
            ) : resources.isError ? (
              <SectionError message={resources.error?.message} onRetry={() => resources.refetch()} />
            ) : recentResources.length === 0 ? (
              <p className="text-sm text-muted">No resources have been shared yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentResources.map((resource) => (
                  <li key={resource.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        to={paths.resource(resource.id)}
                        className="block truncate text-sm font-semibold hover:text-lime"
                      >
                        {resource.title}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {resource.subject || 'General'} · {resource.uploaderName}
                      </p>
                    </div>
                    <Badge variant="outline">{formatNumber(resource.downloadCount)} downloads</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card
            title="Pending invitations"
            icon={Mail}
            action={
              <Link
                to={`${paths.teams}?tab=invites`}
                className="text-xs font-semibold text-lime hover:underline"
              >
                Manage
              </Link>
            }
          >
            {invitations.isPending ? (
              <InlineSkeleton rows={2} />
            ) : invitations.isError ? (
              <SectionError
                message={invitations.error?.message}
                onRetry={() => invitations.refetch()}
              />
            ) : pendingInvites.length === 0 ? (
              <p className="text-sm text-muted">No pending invitations.</p>
            ) : (
              <ul className="space-y-2.5">
                {pendingInvites.slice(0, 3).map((invite) => (
                  <li key={invite.id} className="rounded-xl border border-line bg-background/40 p-3">
                    <p className="text-sm font-semibold">{invite.teamName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Invited {relativeTime(invite.createdAt)}
                    </p>
                    <ButtonLink
                      to={`${paths.teams}?tab=invites`}
                      size="sm"
                      variant="subtle"
                      className="mt-2"
                    >
                      Respond
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Recent notifications"
            icon={Bell}
            action={
              <Link to={paths.notifications} className="text-xs font-semibold text-lime hover:underline">
                View all
              </Link>
            }
          >
            {notifications.isPending ? (
              <InlineSkeleton rows={3} />
            ) : notifications.isError ? (
              <SectionError
                message={notifications.error?.message}
                onRetry={() => notifications.refetch()}
              />
            ) : recentNotifications.length === 0 ? (
              <p className="text-sm text-muted">You have no notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((notification) => {
                  const meta = notificationMeta(notification.type);
                  const Icon = meta.icon;
                  return (
                    <li key={notification.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
                        <Icon size={13} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs ${notification.read ? 'text-muted' : 'text-ink'}`}>
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {relativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Suggested teams" icon={UserPlus}>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted">
                Add skills or interests in your profile to get recommendations based on real team
                requirements.
              </p>
            ) : (
              <ul className="space-y-3">
                {recommendations.map(({ team, reasons }) => (
                  <li key={team.id}>
                    <Link to={paths.team(team.id)} className="text-sm font-semibold hover:text-lime">
                      {team.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{reasons.join(' · ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Saved on this device" icon={Bookmark}>
            <p className="text-sm text-muted">
              {savedTeams.length
                ? `${savedTeams.length} of your saved team${savedTeams.length === 1 ? '' : 's'} ${savedTeams.length === 1 ? 'is' : 'are'} also in your team list.`
                : 'Teams you bookmark are stored in this browser only and are not synced.'}
            </p>
            <ButtonLink to={`${paths.teams}?tab=saved`} variant="outline" size="sm" className="mt-3">
              Open saved teams
            </ButtonLink>
          </Card>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted">
        <MessagesSquare size={13} aria-hidden="true" />
        Team messages and notifications refresh while this tab is visible.
      </p>
    </div>
  );
}
