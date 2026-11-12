import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, MapPin, Search } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageTitle } from '@/hooks/usePageTitle';
import { queryKeys } from '@/lib/queryKeys';
import { truncate } from '@/lib/format';
import { listSkills } from '@/services/skills';
import { searchStudents } from '@/services/users';
import { paths } from '@/routes/paths';

export default function StudentsPage() {
  usePageTitle('Students');
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const params = { q: debouncedQuery.trim(), skill };
  const students = useQuery({
    queryKey: queryKeys.users.search(params),
    queryFn: () => searchStudents(params),
  });
  const skills = useQuery({ queryKey: queryKeys.skills.all, queryFn: listSkills });

  const hasFilters = Boolean(params.q || params.skill);
  const results = students.data || [];

  function clear() {
    setQuery('');
    setSkill('');
  }

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Students"
        description="Find collaborators by name or skill. Results come from real student profiles and are capped at 50 by the backend."
      />

      <div className="mt-6 rounded-panel border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <div>
            <label htmlFor="student-search" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Search students
            </label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name…"
              label="Search students by name"
              className="w-full"
            />
          </div>
          <Select
            label="Skill"
            name="skill"
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
          >
            <option value="">All skills</option>
            {(skills.data || []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <p className="text-xs text-muted">
            {students.isSuccess
              ? `${results.length} ${results.length === 1 ? 'student' : 'students'} found`
              : 'Search is available to signed-in students only.'}
          </p>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear search
            </Button>
          ) : null}
          {skills.isError ? (
            <span className="ml-auto text-[11px] text-amber-300">
              Skills could not be loaded. Name search still works.
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        {students.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading students">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="rounded-panel border border-line bg-surface p-5">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-4 h-3 w-full" />
              </div>
            ))}
          </div>
        ) : students.isError ? (
          <ErrorState
            title="Students could not be loaded"
            message={students.error?.message}
            onRetry={() => students.refetch()}
            retryLabel="Reload students"
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={hasFilters ? Search : GraduationCap}
            title={hasFilters ? 'No students match this search' : 'No student profiles yet'}
            description={
              hasFilters
                ? 'Try a different name or skill. Only students with a matching profile appear here.'
                : 'Student profiles appear once accounts have been created.'
            }
            action={hasFilters ? <Button onClick={clear}>Clear search</Button> : null}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((student) => (
              <article
                key={student.id}
                className="flex h-full flex-col rounded-panel border border-line bg-surface p-5 transition-colors hover:border-lime/40"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={student.fullName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight">
                      <Link to={paths.student(student.id)} className="hover:text-lime">
                        {student.fullName}
                      </Link>
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {[student.yearBranch, student.college].filter(Boolean).join(' · ') ||
                        'Year and college not added'}
                    </p>
                    {student.location ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                        <MapPin size={11} aria-hidden="true" /> {student.location}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 flex-1 text-sm text-silver">
                  {truncate(student.about || 'This student has not added an about section yet.', 150)}
                </p>

                {student.skills?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
                    {student.skills.slice(0, 5).map((item) => (
                      <li key={item}>
                        <Badge variant="neutral">{item}</Badge>
                      </li>
                    ))}
                    {student.skills.length > 5 ? (
                      <li>
                        <Badge variant="outline">+{student.skills.length - 5}</Badge>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted">No skills listed.</p>
                )}

                <Link
                  to={paths.student(student.id)}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-line px-3 text-xs font-semibold text-silver transition-colors hover:border-lime hover:text-lime"
                >
                  View profile
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
