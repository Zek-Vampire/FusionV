import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Award,
  Check,
  Download,
  FileText,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import TagDialog from '@/components/profile/TagDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate, formatMonthYear, formatNumber, relativeTime } from '@/lib/format';
import { profileCompletion } from '@/lib/profileCompletion';
import { safeHttpUrl } from '@/lib/validation';
import { listPosts } from '@/services/posts';
import { listMyResources } from '@/services/resources';
import { listTeams } from '@/services/teams';
import {
  downloadResume,
  getMyStats,
  replaceInterests,
  replaceSkills,
  uploadResume,
} from '@/services/users';
import { paths } from '@/routes/paths';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'My teams' },
  { id: 'posts', label: 'My posts' },
  { id: 'resources', label: 'My resources' },
  { id: 'achievements', label: 'Achievements' },
];

function CompletionCard({ user, onAction }) {
  const completion = profileCompletion(user);
  return (
    <section className="rounded-panel border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Profile completion</h2>
        <span className="text-lg font-bold text-lime">{completion.percent}%</span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion.percent}
        aria-label="Profile completion"
      >
        <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${completion.percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {completion.completed} of {completion.total} items complete. Better profile data improves
        team recommendations.
      </p>
      <ul className="mt-3 space-y-1.5">
        {completion.checks.map((check) => (
          <li key={check.key} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                check.complete
                  ? 'border-lime/40 bg-lime/15 text-lime'
                  : 'border-line text-muted'
              }`}
              aria-hidden="true"
            >
              {check.complete ? <Check size={10} /> : <Plus size={10} />}
            </span>
            <span className={check.complete ? 'text-silver' : 'text-muted'}>{check.label}</span>
            {check.complete ? (
              <span className="sr-only"> (complete)</span>
            ) : (
              <button
                type="button"
                onClick={() => onAction(check.action)}
                className="ml-auto font-semibold text-lime hover:underline"
              >
                Add
              </button>
            )}
          </li>
        ))}
      </ul>
      {completion.percent === 100 ? (
        <p className="mt-3 text-xs text-emerald-300">Your profile is complete.</p>
      ) : null}
    </section>
  );
}

export default function ProfilePage() {
  usePageTitle('My profile');
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [tagKind, setTagKind] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const fileRef = useRef(null);

  const stats = useQuery({ queryKey: queryKeys.users.stats, queryFn: getMyStats });
  const teams = useQuery({ queryKey: queryKeys.teams.mine, queryFn: () => listTeams({ mine: true }) });
  const posts = useQuery({
    queryKey: queryKeys.posts.mine,
    queryFn: () => listPosts({ mine: true, size: 50 }),
  });
  const resources = useQuery({ queryKey: queryKeys.resources.mine, queryFn: listMyResources });

  const resume = useMutation({
    mutationFn: (file) =>
      uploadResume(file, { onProgress: (percent) => setUploadPercent(percent) }),
    onSuccess: (updated) => {
      updateUser(updated);
      setUploadPercent(null);
      setResumeError('');
      toast({ title: 'Resume uploaded', description: updated.resumeFileName, variant: 'success' });
    },
    onError: (error) => {
      setUploadPercent(null);
      setResumeError(error?.message || 'The resume could not be uploaded.');
      toast({ title: 'Resume upload failed', description: error?.message, variant: 'error' });
    },
  });

  const download = useMutation({
    mutationFn: () => downloadResume(user?.resumeFileName || 'fusionv-resume'),
    onSuccess: () => toast({ title: 'Resume download started', variant: 'success' }),
    onError: (error) => toast({ title: 'Download failed', description: error?.message, variant: 'error' }),
  });

  const tags = useMutation({
    mutationFn: ({ kind, values }) =>
      kind === 'skills' ? replaceSkills(values) : replaceInterests(values),
    onSuccess: (updated, variables) => {
      updateUser(updated);
      setTagKind(null);
      toast({
        title: variables.kind === 'skills' ? 'Skills updated' : 'Interests updated',
        variant: 'success',
      });
    },
    onError: (error) => toast({ title: 'Could not update your profile', description: error?.message, variant: 'error' }),
  });

  if (!user) {
    return <Skeleton className="h-64 w-full rounded-panel" />;
  }

  const link = safeHttpUrl(user.linkUrl);
  const myTeams = teams.data || [];
  const myPosts = posts.data || [];
  const achievements = myPosts.filter((post) => post.type === 'ACHIEVEMENT');
  const myResources = resources.data || [];

  function completionAction(action) {
    if (action === 'resume') {
      fileRef.current?.click();
      return;
    }
    if (action === 'add-skill') {
      setTagKind('skills');
      return;
    }
    if (action === 'add-interest') {
      setTagKind('interests');
      return;
    }
    setEditOpen(true);
  }

  function pickResume(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(extension)) {
      setResumeError('Resume must be a PDF, DOC or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('Resume must be smaller than 10 MB.');
      return;
    }
    setResumeError('');
    setUploadPercent(0);
    resume.mutate(file);
  }

  function removeTag(kind, value) {
    const current = kind === 'skills' ? user.skills || [] : user.interests || [];
    tags.mutate({ kind, values: current.filter((item) => item !== value) });
  }

  function addTag(value) {
    if (!tagKind) return;
    const current = tagKind === 'skills' ? user.skills || [] : user.interests || [];
    tags.mutate({ kind: tagKind, values: [...current, value] });
  }

  const kpis = [
    { label: 'Teams joined', value: stats.data?.teamsJoined, icon: Users },
    { label: 'Hackathons via teams', value: stats.data?.hackathons, icon: Award },
    { label: 'Resources shared', value: stats.data?.resourcesShared, icon: FileText },
    { label: 'Posts', value: stats.data?.posts, icon: Plus },
  ];

  return (
    <div>
      <section className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line bg-[radial-gradient(circle_at_12%_20%,rgba(117,255,67,0.12),transparent_45%)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={user.fullName} size="lg" className="h-20 w-20 text-2xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="lime">Student profile</Badge>
                  <Link to={paths.student(user.id)}>
                    <Badge variant="outline">View public profile</Badge>
                  </Link>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{user.fullName}</h1>
                <p className="mt-1 text-sm text-silver">
                  {[user.yearBranch, user.college].filter(Boolean).join(' · ') ||
                    'Add your year, branch and college'}
                </p>
                {user.motto ? <p className="mt-1 text-sm italic text-muted">“{user.motto}”</p> : null}
                <p className="mt-1 text-xs text-muted">
                  Joined {formatMonthYear(user.createdAt) || 'date not available'} · {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="subtle" icon={Pencil} onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
              <ButtonLink to={paths.settings} variant="outline">
                Settings
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-line bg-background/40 p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime/25 bg-lime/10 text-lime">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-bold">
                    {stats.isPending ? '—' : formatNumber(item.value)}
                  </p>
                  <p className="text-[11px] text-muted">{item.label}</p>
                </div>
                {stats.isError ? <span className="ml-auto text-xs text-red-300">!</span> : null}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Profile sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id ? 'bg-lime text-background' : 'text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {tab === 'overview' ? (
            <>
              <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">About me</h2>
                  <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                  {user.about ||
                    'Tell other students about yourself. An about section makes your profile useful when you are looking for teammates.'}
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-silver sm:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" aria-hidden="true" />
                    {user.location || 'Location not added'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Link2 size={14} className="text-muted" aria-hidden="true" />
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline">
                        External profile
                      </a>
                    ) : (
                      <span className="text-muted">No website or profile link</span>
                    )}
                  </li>
                </ul>
              </section>

              <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Skills</h2>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => setTagKind('skills')}>
                    Add
                  </Button>
                </div>
                {user.skills?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <li key={skill} className="flex items-center gap-1.5 rounded-lg border border-line bg-background/50 px-2.5 py-1 text-xs text-silver">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeTag('skills', skill)}
                          disabled={tags.isPending}
                          aria-label={`Remove skill ${skill}`}
                          className="text-muted hover:text-red-300"
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">No skills yet. Add a few so teams can find you.</p>
                )}
              </section>

              <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Interests</h2>
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => setTagKind('interests')}>
                    Add
                  </Button>
                </div>
                {user.interests?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                      <li key={interest} className="flex items-center gap-1.5 rounded-lg border border-line bg-background/50 px-2.5 py-1 text-xs text-silver">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeTag('interests', interest)}
                          disabled={tags.isPending}
                          aria-label={`Remove interest ${interest}`}
                          className="text-muted hover:text-red-300"
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">No interests yet. These improve team suggestions.</p>
                )}
              </section>
            </>
          ) : null}

          {tab === 'teams' ? (
            <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight">My teams</h2>
              {teams.isPending ? (
                <Skeleton className="mt-3 h-20 w-full" />
              ) : teams.isError ? (
                <ErrorState className="mt-3" message={teams.error?.message} onRetry={() => teams.refetch()} />
              ) : myTeams.length === 0 ? (
                <EmptyState className="mt-3" icon={Users} title="You are not in a team yet" action={<ButtonLink to={paths.teams}>Explore teams</ButtonLink>} />
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {myTeams.map((team) => (
                    <li key={team.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime/20 bg-lime/10 text-[10px] font-bold text-lime">
                        {(team.name || '?').slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link to={paths.team(team.id)} className="text-sm font-semibold hover:text-lime">
                          {team.name}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {team.hackathonName || 'No hackathon'} · {team.memberCount}/{team.maxMembers} members
                        </p>
                      </div>
                      <Badge variant={team.myStatus === 'LEADER' ? 'success' : 'lime'}>
                        {team.myStatus === 'LEADER' ? 'Leader' : 'Member'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === 'posts' ? (
            <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">My posts</h2>
                <ButtonLink to={paths.community} size="sm" variant="outline">
                  Open community
                </ButtonLink>
              </div>
              {posts.isPending ? (
                <Skeleton className="mt-3 h-24 w-full" />
              ) : posts.isError ? (
                <ErrorState className="mt-3" message={posts.error?.message} onRetry={() => posts.refetch()} />
              ) : myPosts.length === 0 ? (
                <EmptyState className="mt-3" title="No posts yet" description="Share an update, project or achievement with the community." />
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {myPosts.map((post) => (
                    <li key={post.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{post.type}</Badge>
                        <span className="text-[11px] text-muted">{relativeTime(post.createdAt)}</span>
                      </div>
                      {post.title ? <p className="mt-1 text-sm font-semibold">{post.title}</p> : null}
                      <p className="mt-1 line-clamp-2 text-sm text-silver">{post.content}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {post.likeCount} likes · {post.commentCount} comments
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === 'resources' ? (
            <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">My resources</h2>
                <ButtonLink to={paths.myResources} size="sm" variant="outline">
                  Manage all
                </ButtonLink>
              </div>
              {resources.isPending ? (
                <Skeleton className="mt-3 h-20 w-full" />
              ) : resources.isError ? (
                <ErrorState className="mt-3" message={resources.error?.message} onRetry={() => resources.refetch()} />
              ) : myResources.length === 0 ? (
                <EmptyState className="mt-3" icon={FileText} title="You have not shared a resource yet" />
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {myResources.map((resource) => (
                    <li key={resource.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link to={paths.resource(resource.id)} className="truncate text-sm font-semibold hover:text-lime">
                          {resource.title}
                        </Link>
                        <p className="text-xs text-muted">{formatNumber(resource.downloadCount)} downloads</p>
                      </div>
                      <Badge variant="outline">{resource.category}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === 'achievements' ? (
            <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight">Achievements</h2>
              <p className="mt-1 text-xs text-muted">
                Achievements are posts with type ACHIEVEMENT. They are self-reported, not verified by FusionV.
              </p>
              {posts.isPending ? (
                <Skeleton className="mt-3 h-24 w-full" />
              ) : achievements.length === 0 ? (
                <EmptyState className="mt-3" icon={Award} title="No achievements yet" description="Publish an achievement post to show an award, finalist place or certificate." action={<ButtonLink to={paths.community}>Create a post</ButtonLink>} />
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {achievements.map((post) => {
                    const proof = safeHttpUrl(post.achievementUrl);
                    return (
                      <article key={post.id} className="rounded-xl border border-line bg-background/40 p-4">
                        <Award size={18} className="text-lime" aria-hidden="true" />
                        <h3 className="mt-2 text-sm font-semibold">{post.title || 'Achievement'}</h3>
                        <p className="mt-1 text-xs text-silver">{post.content}</p>
                        {post.organization ? <p className="mt-1 text-[11px] text-muted">{post.organization}</p> : null}
                        {post.eventDate ? <p className="text-[11px] text-muted">{formatDate(post.eventDate)}</p> : null}
                        {proof ? (
                          <a href={proof} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[11px] font-semibold text-lime hover:underline">
                            Proof / certificate
                          </a>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <CompletionCard user={user} onAction={completionAction} />

          <section className="rounded-panel border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">Resume</h2>
            <p className="mt-2 text-xs text-muted">
              PDF, DOC or DOCX up to 10 MB. Resumes are private to you and never exposed on your public profile.
            </p>
            {user.resumeFileName ? (
              <p className="mt-3 break-all rounded-lg border border-line bg-background/50 px-3 py-2 text-xs text-silver">
                {user.resumeFileName}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted">No resume uploaded.</p>
            )}
            {uploadPercent !== null ? (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full bg-lime transition-all" style={{ width: `${uploadPercent}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">Uploading… {uploadPercent}%</p>
              </div>
            ) : null}
            {resumeError ? <p role="alert" className="mt-2 text-xs text-red-300">{resumeError}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={Upload} onClick={() => fileRef.current?.click()} loading={resume.isPending}>
                {user.resumeFileName ? 'Replace' : 'Upload'}
              </Button>
              {user.resumeFileName ? (
                <Button variant="ghost" size="sm" icon={Download} onClick={() => download.mutate()} loading={download.isPending}>
                  Download
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              aria-label="Upload resume"
              onChange={pickResume}
            />
          </section>

          <section className="rounded-panel border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link to={`${paths.teams}?tab=saved`} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-silver hover:text-lime">
                  Saved teams <span aria-hidden="true">→</span>
                </Link>
              </li>
              <li>
                <Link to={paths.myResources} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-silver hover:text-lime">
                  Manage resources <span aria-hidden="true">→</span>
                </Link>
              </li>
              <li>
                <Link to={paths.settings} className="flex items-center justify-between rounded-lg px-1 py-1.5 text-silver hover:text-lime">
                  Account settings <span aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <ProfileEditDialog open={editOpen} onClose={() => setEditOpen(false)} />
      <TagDialog
        open={Boolean(tagKind)}
        onClose={() => setTagKind(null)}
        label={tagKind === 'skills' ? 'Skill' : 'Interest'}
        existing={tagKind === 'skills' ? user.skills || [] : user.interests || []}
        onAdd={addTag}
        loading={tags.isPending}
      />
    </div>
  );
}
