import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { useToast } from '@/context/ToastContext';
import { listHackathons } from '@/services/hackathons';
import { createTeam, updateTeam } from '@/services/teams';
import { queryKeys } from '@/lib/queryKeys';

const EMPTY = {
  name: '',
  description: '',
  skills: '',
  hackathonId: '',
  maxMembers: 5,
};

function splitSkills(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TeamFormDialog({ open, onClose, team = null, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const hackathons = useQuery({
    queryKey: queryKeys.hackathons.list({}),
    queryFn: () => listHackathons(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError('');
    setForm(
      team
        ? {
            name: team.name || '',
            description: team.description || '',
            skills: (team.skills || []).join(', '),
            hackathonId: team.hackathonId ? String(team.hackathonId) : '',
            maxMembers: team.maxMembers || 5,
          }
        : EMPTY,
    );
  }, [open, team]);

  const selectedHackathon = useMemo(
    () => (hackathons.data || []).find((item) => String(item.id) === String(form.hackathonId)),
    [hackathons.data, form.hackathonId],
  );

  const mutation = useMutation({
    mutationFn: (payload) => (team ? updateTeam(team.id, payload) : createTeam(payload)),
    onSuccess: (saved) => {
      toast({
        title: team ? 'Team updated' : 'Team created',
        description: saved?.name,
        variant: 'success',
      });
      onSaved?.(saved);
      onClose?.();
    },
    onError: (error) => {
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'The team could not be saved.');
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const name = form.name.trim();
    const maxMembers = Number(form.maxMembers);
    const skills = splitSkills(form.skills);

    if (!name) nextErrors.name = 'Give the team a name.';
    else if (name.length > 100) nextErrors.name = 'Use at most 100 characters.';
    if (form.description.length > 1000) nextErrors.description = 'Use at most 1,000 characters.';
    if (!(maxMembers >= 2 && maxMembers <= 10)) {
      nextErrors.maxMembers = 'Capacity must be between 2 and 10.';
    }
    if (team && maxMembers < team.memberCount) {
      nextErrors.maxMembers = `Capacity cannot be below the current ${team.memberCount} members.`;
    }
    if (selectedHackathon?.maxTeamSize && maxMembers > selectedHackathon.maxTeamSize) {
      nextErrors.maxMembers = `This hackathon allows at most ${selectedHackathon.maxTeamSize} members per team.`;
    }
    if (selectedHackathon?.minTeamSize && maxMembers < selectedHackathon.minTeamSize) {
      nextErrors.maxMembers = `This hackathon needs at least ${selectedHackathon.minTeamSize} members per team.`;
    }
    if (skills.length > 15) nextErrors.skills = 'List at most 15 required skills.';
    if (skills.some((skill) => skill.length > 50)) {
      nextErrors.skills = 'Each skill must be 50 characters or fewer.';
    }

    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;

    mutation.mutate({
      name,
      description: form.description.trim(),
      hackathonId: form.hackathonId ? Number(form.hackathonId) : null,
      maxMembers,
      skills,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={team ? 'Edit team' : 'Create a team'}
      description={
        team
          ? 'Update the team details. Only the leader can change these fields.'
          : 'You become the leader. Invite teammates after the team is created.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="team-form" loading={mutation.isPending}>
            {team ? 'Save changes' : 'Create team'}
          </Button>
        </>
      }
    >
      <form id="team-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <Input
          containerClassName="sm:col-span-2"
          label="Team name"
          name="name"
          value={form.name}
          maxLength={100}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
          required
          autoFocus
        />
        <Textarea
          containerClassName="sm:col-span-2"
          label="What is the team working on?"
          name="description"
          rows={3}
          maxLength={1000}
          value={form.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <Input
          containerClassName="sm:col-span-2"
          label="Required skills"
          name="skills"
          value={form.skills}
          maxLength={700}
          hint="Comma separated, for example Java, UI/UX, PostgreSQL."
          error={errors.skills}
          onChange={(event) => update('skills', event.target.value)}
        />
        <Select
          label="Linked hackathon"
          name="hackathonId"
          value={form.hackathonId}
          hint={
            hackathons.isError
              ? 'Hackathons could not load. You can still create a team without one.'
              : undefined
          }
          onChange={(event) => update('hackathonId', event.target.value)}
        >
          <option value="">No linked hackathon</option>
          {(hackathons.data || []).map((hackathon) => (
            <option key={hackathon.id} value={hackathon.id}>
              {hackathon.name}
            </option>
          ))}
        </Select>
        <Select
          label="Maximum capacity"
          name="maxMembers"
          value={form.maxMembers}
          error={errors.maxMembers}
          hint={team ? `Currently ${team.memberCount} member(s).` : 'You count as the first member.'}
          onChange={(event) => update('maxMembers', Number(event.target.value))}
        >
          {Array.from({ length: 9 }, (_, index) => index + 2).map((size) => (
            <option key={size} value={size}>
              {size} members
            </option>
          ))}
        </Select>

        {generalError ? (
          <p role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200 sm:col-span-2">
            {generalError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
