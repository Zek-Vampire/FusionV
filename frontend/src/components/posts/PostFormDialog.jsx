import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { useToast } from '@/context/ToastContext';
import { createPost, updatePost } from '@/services/posts';
import { safeHttpUrl } from '@/lib/validation';

const EMPTY = {
  type: 'UPDATE',
  content: '',
  title: '',
  technologies: '',
  repoUrl: '',
  projectUrl: '',
  organization: '',
  achievementUrl: '',
  eventDate: '',
};

export default function PostFormDialog({ open, onClose, post = null, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError('');
    setForm(
      post
        ? {
            type: post.type || 'UPDATE',
            content: post.content || '',
            title: post.title || '',
            technologies: (post.technologies || []).join(', '),
            repoUrl: post.repoUrl || '',
            projectUrl: post.projectUrl || '',
            organization: post.organization || '',
            achievementUrl: post.achievementUrl || '',
            eventDate: post.eventDate || '',
          }
        : EMPTY,
    );
  }, [open, post]);

  const mutation = useMutation({
    mutationFn: (payload) => (post ? updatePost(post.id, payload) : createPost(payload)),
    onSuccess: (saved) => {
      toast({
        title: post ? 'Post updated' : 'Post published',
        description: post?.title || undefined,
        variant: 'success',
      });
      onSaved?.(saved);
      onClose?.();
    },
    onError: (error) => {
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'The post could not be saved.');
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const content = form.content.trim();
    const type = form.type;
    if (!content) nextErrors.content = 'Write a description for the post.';
    else if (content.length > 2000) nextErrors.content = 'Use at most 2,000 characters.';
    if (form.title.trim().length > 150) nextErrors.title = 'Use at most 150 characters.';

    const technologies = form.technologies
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (type === 'PROJECT' && technologies.length > 15) {
      nextErrors.technologies = 'List at most 15 technologies.';
    }
    if (technologies.some((technology) => technology.length > 50)) {
      nextErrors.technologies = 'Each technology must be 50 characters or fewer.';
    }

    const urls = [
      ['repoUrl', form.repoUrl, type === 'PROJECT'],
      ['projectUrl', form.projectUrl, type === 'PROJECT'],
      ['achievementUrl', form.achievementUrl, type === 'ACHIEVEMENT'],
    ];
    urls.forEach(([field, value, applies]) => {
      if (applies && value.trim() && !safeHttpUrl(value)) {
        nextErrors[field] = 'Use a full http:// or https:// link.';
      }
    });

    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;

    mutation.mutate({
      content,
      type,
      title: form.title.trim() || null,
      technologies: type === 'PROJECT' ? technologies : [],
      repoUrl: type === 'PROJECT' ? form.repoUrl.trim() : '',
      projectUrl: type === 'PROJECT' ? form.projectUrl.trim() : '',
      organization: type === 'ACHIEVEMENT' ? form.organization.trim() : '',
      achievementUrl: type === 'ACHIEVEMENT' ? form.achievementUrl.trim() : '',
      eventDate:
        (type === 'PROJECT' || type === 'ACHIEVEMENT') && form.eventDate
          ? form.eventDate
          : null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={post ? 'Edit post' : 'Create a post'}
      description="Updates, projects and achievements are all self-reported and appear in the community feed."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="post-form" loading={mutation.isPending}>
            {post ? 'Save changes' : 'Publish'}
          </Button>
        </>
      }
    >
      <form id="post-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <Select
          containerClassName="sm:col-span-2"
          label="Post type"
          name="type"
          value={form.type}
          onChange={(event) => update('type', event.target.value)}
        >
          <option value="UPDATE">Update — a short note</option>
          <option value="PROJECT">Project — what you built</option>
          <option value="ACHIEVEMENT">Achievement — what you earned</option>
        </Select>
        <Textarea
          containerClassName="sm:col-span-2"
          label="Description"
          name="content"
          rows={4}
          maxLength={2000}
          value={form.content}
          error={errors.content}
          hint="This appears in the community feed and on your profile."
          onChange={(event) => update('content', event.target.value)}
        />

        {form.type === 'PROJECT' ? (
          <>
            <Input
              containerClassName="sm:col-span-2"
              label="Project name"
              name="title"
              maxLength={150}
              value={form.title}
              error={errors.title}
              onChange={(event) => update('title', event.target.value)}
            />
            <Input
              label="Technologies"
              name="technologies"
              value={form.technologies}
              error={errors.technologies}
              hint="Comma separated, e.g. Java, Spring Boot, PostgreSQL."
              onChange={(event) => update('technologies', event.target.value)}
            />
            <Input
              label="Completion date"
              name="eventDate"
              type="date"
              value={form.eventDate}
              onChange={(event) => update('eventDate', event.target.value)}
            />
            <Input
              label="Repository URL"
              name="repoUrl"
              type="url"
              placeholder="https://github.com/…"
              value={form.repoUrl}
              error={errors.repoUrl}
              onChange={(event) => update('repoUrl', event.target.value)}
            />
            <Input
              label="Live demo URL"
              name="projectUrl"
              type="url"
              placeholder="https://…"
              value={form.projectUrl}
              error={errors.projectUrl}
              onChange={(event) => update('projectUrl', event.target.value)}
            />
          </>
        ) : null}

        {form.type === 'ACHIEVEMENT' ? (
          <>
            <Input
              containerClassName="sm:col-span-2"
              label="Achievement title"
              name="title"
              maxLength={150}
              value={form.title}
              error={errors.title}
              placeholder="Finalist — Campus Hackathon 2026"
              onChange={(event) => update('title', event.target.value)}
            />
            <Input
              label="Issuing organisation / event"
              name="organization"
              maxLength={150}
              value={form.organization}
              onChange={(event) => update('organization', event.target.value)}
            />
            <Input
              label="Achievement date"
              name="eventDate"
              type="date"
              value={form.eventDate}
              onChange={(event) => update('eventDate', event.target.value)}
            />
            <Input
              containerClassName="sm:col-span-2"
              label="Certificate or proof URL"
              name="achievementUrl"
              type="url"
              placeholder="https://…"
              value={form.achievementUrl}
              error={errors.achievementUrl}
              onChange={(event) => update('achievementUrl', event.target.value)}
            />
          </>
        ) : null}

        {generalError ? (
          <p role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200 sm:col-span-2">
            {generalError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
