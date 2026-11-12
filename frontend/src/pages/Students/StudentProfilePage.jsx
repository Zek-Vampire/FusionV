import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Link2, MapPin, UserX } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { ButtonLink } from '@/components/ui/Button';
import PostCard from '@/components/posts/PostCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatMonthYear } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { safeHttpUrl } from '@/lib/validation';
import { getStudent } from '@/services/users';
import { listPosts } from '@/services/posts';
import { paths } from '@/routes/paths';

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const { user } = useAuth();
  usePageTitle('Student profile');

  const student = useQuery({
    queryKey: queryKeys.users.detail(studentId),
    queryFn: () => getStudent(studentId),
    enabled: Boolean(studentId),
  });
  const posts = useQuery({
    queryKey: queryKeys.posts.feed({ authorId: studentId, size: 10 }),
    queryFn: () => listPosts({ authorId: studentId, size: 10 }),
    enabled: Boolean(studentId),
  });

  const back = (
    <Link to={paths.students} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-lime">
      <ArrowLeft size={15} aria-hidden="true" /> All students
    </Link>
  );

  if (student.isPending) {
    return (
      <div>
        {back}
        <div className="mt-4 rounded-panel border border-line bg-surface p-6 sm:p-8" role="status" aria-label="Loading student profile">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-8 h-24 w-full" />
        </div>
      </div>
    );
  }

  if (student.isError) {
    return (
      <div>
        {back}
        {student.error?.status === 404 ? (
          <EmptyState
            className="mt-4"
            icon={UserX}
            title="Student not found"
            description="This student does not exist or the account is no longer available."
            action={<ButtonLink to={paths.students}>Back to directory</ButtonLink>}
          />
        ) : (
          <ErrorState
            className="mt-4"
            title="This student profile could not be loaded"
            message={student.error?.message}
            onRetry={() => student.refetch()}
          />
        )}
      </div>
    );
  }

  const person = student.data;
  const link = safeHttpUrl(person.linkUrl);
  const isMe = person.id === user?.id;

  return (
    <div>
      {back}

      <section className="mt-4 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={person.fullName} size="lg" className="h-20 w-20 text-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="lime">Student profile</Badge>
                {isMe ? <Badge variant="neutral">This is you</Badge> : null}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{person.fullName}</h1>
              <p className="mt-1.5 text-sm text-silver">
                {[person.yearBranch, person.college].filter(Boolean).join(' · ') ||
                  'Year, branch and college not added'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                {person.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} aria-hidden="true" /> {person.location}
                  </span>
                ) : null}
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-lime hover:underline"
                  >
                    <Link2 size={12} aria-hidden="true" /> External profile
                  </a>
                ) : null}
                {person.createdAt ? <span>Joined {formatMonthYear(person.createdAt)}</span> : null}
              </div>
            </div>
            {isMe ? (
              <ButtonLink to={paths.profile} variant="outline">
                Edit my profile
              </ButtonLink>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Email addresses and resumes are never exposed on student profiles.
          </p>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">About</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                {person.about || 'This student has not added an about section yet.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight">Recent posts</h2>
              <div className="mt-3">
                {posts.isPending ? (
                  <div className="space-y-3" role="status" aria-label="Loading posts">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ) : posts.isError ? (
                  <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3 text-xs text-red-200">
                    <p>{posts.error?.message}</p>
                    <button type="button" onClick={() => posts.refetch()} className="mt-1.5 font-semibold underline">
                      Retry
                    </button>
                  </div>
                ) : (posts.data || []).length === 0 ? (
                  <EmptyState
                    title="No posts yet"
                    description={`${person.fullName} has not shared an update, project or achievement yet.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {posts.data.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-panel border border-line p-5">
              <h2 className="text-sm font-semibold">Skills</h2>
              {person.skills?.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {person.skills.map((skill) => (
                    <li key={skill} className="rounded-md border border-line bg-background/50 px-2 py-1 text-xs text-silver">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">No skills listed.</p>
              )}
            </section>

            <section className="rounded-panel border border-line p-5">
              <h2 className="text-sm font-semibold">Interests</h2>
              {person.interests?.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {person.interests.map((interest) => (
                    <li key={interest} className="rounded-md border border-line bg-background/50 px-2 py-1 text-xs text-silver">
                      {interest}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">No interests listed.</p>
              )}
            </section>

            {!isMe ? (
              <section className="rounded-panel border border-line p-5">
                <h2 className="text-sm font-semibold">Collaborate</h2>
                <p className="mt-2 text-xs text-muted">
                  Direct messaging is not available. Join or create a team to work together.
                </p>
                <ButtonLink to={paths.teams} variant="outline" size="sm" className="mt-3">
                  Find a team
                </ButtonLink>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
