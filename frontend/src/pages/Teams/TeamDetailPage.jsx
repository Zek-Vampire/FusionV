import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Mail,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import TeamFormDialog from '@/components/teams/TeamFormDialog';
import { teamStatus } from '@/components/teams/TeamCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate, relativeTime } from '@/lib/format';
import { isValidEmail } from '@/lib/validation';
import {
  cancelJoinRequest,
  decideJoinRequest,
  deleteTeam,
  getTeam,
  inviteToTeam,
  leaveTeam,
  listJoinRequests,
  listMyInvitations,
  requestToJoin,
  respondToInvitation,
} from '@/services/teams';
import { paths } from '@/routes/paths';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  usePageTitle('Team details');

  const team = useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => getTeam(teamId),
    enabled: Boolean(teamId),
  });
  const invitations = useQuery({
    queryKey: queryKeys.teams.invitations,
    queryFn: listMyInvitations,
  });

  const isLeader = team.data?.myStatus === 'LEADER';
  const requests = useQuery({
    queryKey: queryKeys.teams.requests(teamId),
    queryFn: () => listJoinRequests(teamId),
    enabled: Boolean(teamId) && isLeader,
  });

  const invitation = (invitations.data || []).find(
    (item) =>
      Number(item.teamId) === Number(teamId) &&
      item.type === 'INVITE' &&
      item.status === 'PENDING',
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams.invitations });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }

  const join = useMutation({
    mutationFn: () => requestToJoin(teamId),
    onSuccess: () => {
      toast({ title: 'Join request sent', description: 'The team leader can accept it.', variant: 'success' });
      invalidate();
    },
    onError: (error) => toast({ title: 'Could not request to join', description: error?.message, variant: 'error' }),
  });
  const cancel = useMutation({
    mutationFn: () => cancelJoinRequest(teamId),
    onSuccess: () => {
      toast({ title: 'Join request cancelled', variant: 'success' });
      invalidate();
    },
    onError: (error) => toast({ title: 'Could not cancel the request', description: error?.message, variant: 'error' }),
  });
  const respond = useMutation({
    mutationFn: (accept) => respondToInvitation(invitation.id, accept),
    onSuccess: (_, accept) => {
      toast({ title: accept ? 'You joined the team' : 'Invitation declined', variant: 'success' });
      invalidate();
    },
    onError: (error) => toast({ title: 'Could not respond to the invitation', description: error?.message, variant: 'error' }),
  });
  const decide = useMutation({
    mutationFn: ({ requestId, accept }) => decideJoinRequest(requestId, accept),
    onSuccess: (_, variables) => {
      toast({ title: variables.accept ? 'Member added to the team' : 'Request rejected', variant: 'success' });
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.requests(teamId) });
    },
    onError: (error) => toast({ title: 'Could not update the request', description: error?.message, variant: 'error' }),
  });
  const invite = useMutation({
    mutationFn: (email) => inviteToTeam(teamId, email),
    onSuccess: (_, email) => {
      setInviteEmail('');
      setInviteStatus(`Invitation sent to ${email}.`);
      toast({ title: 'Invitation sent', description: email, variant: 'success' });
    },
    onError: (error) => {
      setInviteError(error?.message || 'The invitation could not be sent.');
      if (error?.fieldErrors?.email) setInviteError(error.fieldErrors.email);
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: () => {
      toast({ title: 'Team deleted', variant: 'success' });
      invalidate();
      navigate(paths.teams);
    },
    onError: (error) => toast({ title: 'Could not delete the team', description: error?.message, variant: 'error' }),
  });
  const leave = useMutation({
    mutationFn: () => leaveTeam(teamId),
    onSuccess: () => {
      toast({ title: 'You left the team', variant: 'success' });
      invalidate();
      navigate(`${paths.teams}?tab=mine`);
    },
    onError: (error) => toast({ title: 'Could not leave the team', description: error?.message, variant: 'error' }),
  });

  function submitInvite(event) {
    event.preventDefault();
    setInviteStatus('');
    const email = inviteEmail.trim();
    if (!isValidEmail(email)) {
      setInviteError('Enter a valid email address.');
      return;
    }
    setInviteError('');
    invite.mutate(email);
  }

  if (team.isPending) {
    return (
      <div>
        <Link to={paths.teams} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-lime">
          <ArrowLeft size={15} aria-hidden="true" /> All teams
        </Link>
        <LoadingState className="mt-6" label="Loading team details…" rows={5} />
      </div>
    );
  }

  if (team.isError) {
    return (
      <div>
        <Link to={paths.teams} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-lime">
          <ArrowLeft size={15} aria-hidden="true" /> All teams
        </Link>
        {team.error?.status === 404 ? (
          <EmptyState
            className="mt-6"
            icon={Users}
            title="Team not found"
            description="This team does not exist or has been deleted."
            action={<ButtonLink to={paths.teams}>Back to teams</ButtonLink>}
          />
        ) : (
          <ErrorState
            className="mt-6"
            title="Team details could not be loaded"
            message={team.error?.message}
            onRetry={() => team.refetch()}
          />
        )}
      </div>
    );
  }

  const item = team.data;
  const status = teamStatus(item);
  const full = item.memberCount >= item.maxMembers;
  const canChat = item.myStatus === 'LEADER' || item.myStatus === 'MEMBER';
  const members = item.members || [];

  return (
    <div>
      <Link to={paths.teams} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-lime">
        <ArrowLeft size={15} aria-hidden="true" /> All teams
      </Link>

      <section className="mt-4 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-lime/25 bg-lime/10 text-lg font-bold text-lime">
                {(item.name || '?').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant={full ? 'warning' : 'success'}>
                    {item.memberCount}/{item.maxMembers} members
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.name}</h1>
                <p className="mt-1.5 text-sm text-muted">
                  Led by{' '}
                  <Link
                    to={item.leaderId === user?.id ? paths.profile : paths.student(item.leaderId)}
                    className="text-lime hover:underline"
                  >
                    {item.leaderName}
                  </Link>
                  {item.createdAt ? ` · Created ${formatDate(item.createdAt)}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isLeader ? (
                <>
                  <Button variant="outline" icon={Pencil} onClick={() => setEditOpen(true)}>
                    Edit team
                  </Button>
                  <Button variant="ghost" icon={Trash2} className="text-red-300" onClick={() => setDeleteOpen(true)}>
                    Delete
                  </Button>
                </>
              ) : item.myStatus === 'REQUESTED' ? (
                <Button variant="ghost" onClick={() => cancel.mutate()} loading={cancel.isPending}>
                  Cancel join request
                </Button>
              ) : item.myStatus === 'INVITED' ? (
                invitation ? (
                  <>
                    <Button onClick={() => respond.mutate(true)} loading={respond.isPending}>
                      Accept invitation
                    </Button>
                    <Button variant="outline" disabled={respond.isPending} onClick={() => respond.mutate(false)}>
                      Decline
                    </Button>
                  </>
                ) : (
                  <ButtonLink to={`${paths.teams}?tab=invites`} variant="outline">
                    View invitation
                  </ButtonLink>
                )
              ) : (
                <Button
                  icon={UserPlus}
                  onClick={() => join.mutate()}
                  loading={join.isPending}
                  disabled={full}
                  variant={full ? 'secondary' : 'primary'}
                >
                  {full ? 'Team is full' : 'Request to join'}
                </Button>
              )}
              {canChat ? (
                <ButtonLink
                  to={`${paths.messages}?team=${item.id}`}
                  variant="outline"
                  icon={MessageSquare}
                >
                  Team chat
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">About this team</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                {item.description || 'No description has been added yet.'}
              </p>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Required skills
              </h3>
              {item.skills?.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <li key={skill} className="rounded-md border border-line bg-background/50 px-2.5 py-1 text-xs text-silver">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">No required skills listed.</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight">
                Members ({members.length}/{item.maxMembers})
              </h2>
              <ul className="mt-3 divide-y divide-line rounded-panel border border-line">
                {members.map((member) => (
                  <li key={member.userId} className="flex items-center gap-3 p-3.5">
                    <Avatar name={member.fullName} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={member.userId === user?.id ? paths.profile : paths.student(member.userId)}
                        className="truncate text-sm font-semibold hover:text-lime"
                      >
                        {member.fullName}
                      </Link>
                      <p className="text-xs text-muted">
                        {member.role === 'LEADER' ? 'Team leader' : 'Member'} · joined{' '}
                        {formatDate(member.joinedAt)}
                      </p>
                    </div>
                    {member.userId === user?.id ? <Badge variant="lime">You</Badge> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                Capacity is the maximum team size, not the current membership.
              </p>
            </section>

            {isLeader ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Leader tools</h2>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Pending join requests
                </h3>
                {requests.isPending ? (
                  <p role="status" className="mt-2 text-sm text-muted">
                    Loading requests…
                  </p>
                ) : requests.isError ? (
                  <div className="mt-2 rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3 text-xs text-red-200">
                    <p>{requests.error?.message}</p>
                    <button type="button" onClick={() => requests.refetch()} className="mt-1.5 font-semibold underline">
                      Retry
                    </button>
                  </div>
                ) : (requests.data || []).length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No pending join requests.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line rounded-panel border border-line">
                    {requests.data.map((request) => (
                      <li key={request.id} className="flex flex-wrap items-center gap-3 p-3.5">
                        <Avatar name={request.userName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{request.userName}</p>
                          <p className="text-xs text-muted">Requested {relativeTime(request.createdAt)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => decide.mutate({ requestId: request.id, accept: true })}
                          disabled={decide.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decide.mutate({ requestId: request.id, accept: false })}
                          disabled={decide.isPending}
                        >
                          Reject
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  <Mail size={13} aria-hidden="true" /> Invite a student
                </h3>
                <form onSubmit={submitInvite} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start" noValidate>
                  <Input
                    containerClassName="flex-1"
                    label="Student email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={inviteEmail}
                    error={inviteError}
                    hint="The student must already have a FusionV account."
                    onChange={(event) => {
                      setInviteEmail(event.target.value);
                      setInviteError('');
                      setInviteStatus('');
                    }}
                  />
                  <Button type="submit" icon={Send} loading={invite.isPending} className="sm:mt-[26px]">
                    Send invitation
                  </Button>
                </form>
                {inviteStatus ? (
                  <p role="status" className="mt-2 text-xs text-emerald-300">
                    {inviteStatus}
                  </p>
                ) : null}
              </section>
            ) : null}

            {canChat ? (
              <section className="rounded-panel border border-line bg-background/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Team chat</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Team messages are visible to members only.
                    </p>
                  </div>
                  <ButtonLink to={`${paths.messages}?team=${item.id}`} variant="outline" size="sm">
                    Open chat
                  </ButtonLink>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={UserMinus}
                  className="mt-3 text-red-300"
                  onClick={() => setLeaveOpen(true)}
                >
                  Leave team
                </Button>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-panel border border-line p-5">
              <h2 className="text-sm font-semibold">At a glance</h2>
              <dl className="mt-3 divide-y divide-line text-sm">
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">Capacity</dt>
                  <dd>{item.memberCount} of {item.maxMembers}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">Status</dt>
                  <dd>{full ? 'Full' : 'Open for members'}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">Hackathon</dt>
                  <dd className="min-w-0 truncate text-right">
                    {item.hackathonId ? (
                      <Link to={paths.hackathon(item.hackathonId)} className="text-lime hover:underline">
                        {item.hackathonName}
                      </Link>
                    ) : (
                      'None linked'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">Created</dt>
                  <dd>{formatDate(item.createdAt) || 'Not available'}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-panel border border-line p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <CalendarDays size={14} className="text-lime" aria-hidden="true" /> Team leader
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={item.leaderName} size="lg" />
                <div className="min-w-0">
                  <Link
                    to={item.leaderId === user?.id ? paths.profile : paths.student(item.leaderId)}
                    className="text-sm font-semibold hover:text-lime"
                  >
                    {item.leaderName}
                  </Link>
                  <p className="text-xs text-muted">Leads this team</p>
                </div>
              </div>
            </section>

            <section className="rounded-panel border border-line p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Check size={14} className="text-lime" aria-hidden="true" /> Ready to collaborate?
              </h2>
              <p className="mt-2 text-xs text-muted">
                {canChat
                  ? 'Open the team chat to coordinate with your teammates.'
                  : 'Team chat is available after you become a member.'}
              </p>
            </section>
          </aside>
        </div>
      </section>

      <TeamFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        team={item}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });
          invalidate();
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Delete team"
        message={`Delete "${item.name}"? Members, join requests and messages are removed. This cannot be undone.`}
        confirmLabel="Delete team"
        loading={remove.isPending}
      />
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => leave.mutate()}
        title="Leave team"
        message={
          isLeader
            ? `Leave "${item.name}"? Leadership passes to the longest-standing member.`
            : `Leave "${item.name}"? You can request to join again later.`
        }
        confirmLabel="Leave team"
        loading={leave.isPending}
      />
    </div>
  );
}
