import { Link } from 'react-router-dom';
import { Bookmark, CalendarDays, Info, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

export function teamStatus(team) {
  if (team.myStatus === 'LEADER') return { label: 'You lead this team', variant: 'success' };
  if (team.myStatus === 'MEMBER') return { label: 'You are a member', variant: 'lime' };
  if (team.myStatus === 'REQUESTED') return { label: 'Request pending', variant: 'warning' };
  if (team.myStatus === 'INVITED') return { label: 'Invitation pending', variant: 'lime' };
  if (team.memberCount >= team.maxMembers) return { label: 'Team full', variant: 'neutral' };
  return { label: 'Open for members', variant: 'success' };
}

export default function TeamCard({
  team,
  saved = false,
  invitation,
  onToggleSaved,
  onRequestJoin,
  onCancelRequest,
  onAcceptInvitation,
  busy = false,
  savedNote = false,
  reason,
}) {
  const status = teamStatus(team);
  const members = team.members || [];
  const full = team.memberCount >= team.maxMembers;
  const isMember = team.myStatus === 'LEADER' || team.myStatus === 'MEMBER';

  return (
    <article className="flex h-full flex-col rounded-panel border border-line bg-surface p-5 transition-colors hover:border-lime/30">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-sm font-bold text-lime">
          <span aria-hidden="true">{(team.name || '?').slice(0, 2).toUpperCase()}</span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold tracking-tight">
            <Link to={paths.team(team.id)} className="hover:text-lime">
              {team.name}
            </Link>
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {team.hackathonName || 'No hackathon linked'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleSaved?.(team.id)}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved teams' : 'Save team on this device'}
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
            saved
              ? 'border-lime/40 bg-lime/10 text-lime'
              : 'border-line text-muted hover:border-lime/40 hover:text-lime',
          )}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        {team.hackathonId ? (
          <Link to={paths.hackathon(team.hackathonId)}>
            <Badge variant="outline">
              <CalendarDays size={10} aria-hidden="true" />
              {team.hackathonName}
            </Badge>
          </Link>
        ) : null}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {team.description || 'This team has not added a description yet.'}
      </p>

      {team.skills?.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Required skills">
          {team.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-md border border-line bg-background/50 px-2 py-1 text-[11px] text-silver"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted">No required skills listed.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.userId} name={member.fullName} size="sm" />
            ))}
          </span>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-ink">
              {team.memberCount}/{team.maxMembers} members
            </p>
            <p className="truncate text-muted">
              {team.leaderName ? `Led by ${team.leaderName}` : 'Leader not listed'}
            </p>
          </div>
        </div>

        {isMember ? (
          <ButtonLink to={paths.team(team.id)} variant="outline" size="sm">
            Open team
          </ButtonLink>
        ) : team.myStatus === 'REQUESTED' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelRequest?.(team.id)}
            disabled={busy}
          >
            Cancel request
          </Button>
        ) : team.myStatus === 'INVITED' ? (
          invitation ? (
            <Button size="sm" onClick={() => onAcceptInvitation?.(invitation.id)} disabled={busy}>
              Accept invitation
            </Button>
          ) : (
            <ButtonLink to={`${paths.teams}?tab=invites`} variant="outline" size="sm">
              View invitation
            </ButtonLink>
          )
        ) : (
          <Button
            size="sm"
            onClick={() => onRequestJoin?.(team.id)}
            disabled={busy || full}
            variant={full ? 'secondary' : 'primary'}
          >
            <Users size={14} aria-hidden="true" />
            {full ? 'Team full' : 'Request to join'}
          </Button>
        )}
      </div>

      {reason ? (
        <p className="mt-3 rounded-lg border border-lime/20 bg-lime/[0.05] px-3 py-2 text-xs text-lime">
          {reason}
        </p>
      ) : null}
      {savedNote ? (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
          <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          Saved on this device only — not synced between devices.
        </p>
      ) : null}
    </article>
  );
}
