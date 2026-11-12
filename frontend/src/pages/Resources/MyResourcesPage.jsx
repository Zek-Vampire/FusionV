import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, FolderOpen, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { ResourceDownloadButton } from '@/components/cards/ResourceCard';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  categoryLabel,
  fileExtension,
  fileSize,
  formatDate,
  formatNumber,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import {
  deleteResource,
  listMyResources,
  updateResource,
  uploadResource,
} from '@/services/resources';
import { paths } from '@/routes/paths';

const ALLOWED = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'png', 'jpg', 'jpeg'];
const MAX_SIZE = 10 * 1024 * 1024;

const EMPTY_UPLOAD = {
  file: null,
  title: '',
  description: '',
  subject: '',
  category: 'NOTES',
  tags: '',
};

function UploadDialog({ open, onClose, onUploaded }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_UPLOAD);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(null);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_UPLOAD);
    setErrors({});
    setGeneralError('');
    setProgress(null);
  }, [open]);

  const upload = useMutation({
    mutationFn: (data) =>
      uploadResource(data, { onProgress: (value) => setProgress(value) }),
    onSuccess: () => {
      toast({ title: 'Resource uploaded', description: form.title, variant: 'success' });
      setProgress(null);
      onUploaded?.();
      onClose?.();
    },
    onError: (error) => {
      setProgress(null);
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'The resource could not be uploaded.');
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const title = form.title.trim();
    if (!title) nextErrors.title = 'Give the resource a title.';
    else if (title.length > 150) nextErrors.title = 'Use at most 150 characters.';
    if (form.description.length > 2000) nextErrors.description = 'Use at most 2,000 characters.';
    if (!form.file) nextErrors.file = 'Choose a file to upload.';
    else {
      const extension = fileExtension(form.file.name);
      if (!ALLOWED.includes(extension)) {
        nextErrors.file = `Allowed file types: ${ALLOWED.join(', ')}.`;
      } else if (form.file.size > MAX_SIZE) {
        nextErrors.file = 'The file must be 10 MB or smaller.';
      }
    }
    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;

    const data = new FormData();
    data.append('file', form.file);
    data.append('title', title);
    data.append('description', form.description.trim());
    data.append('subject', form.subject.trim());
    data.append('category', form.category);
    data.append('tags', form.tags.trim());
    upload.mutate(data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload a resource"
      description="Files are stored by the existing backend and appear in the public library."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={upload.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="resource-upload-form" loading={upload.isPending}>
            Upload resource
          </Button>
        </>
      }
    >
      <form id="resource-upload-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
            File
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-background/40 px-4 py-7 text-center transition-colors hover:border-lime/50">
            <Upload size={20} className="text-lime" aria-hidden="true" />
            <span className="mt-2 text-sm font-semibold">
              {form.file ? form.file.name : 'Choose a file'}
            </span>
            <span className="mt-1 text-xs text-muted">
              {form.file
                ? fileSize(form.file.size)
                : 'PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG or JPEG · up to 10 MB'}
            </span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              onChange={(event) => update('file', event.target.files?.[0] || null)}
            />
          </label>
          {errors.file ? <p role="alert" className="mt-1 text-xs text-red-300">{errors.file}</p> : null}
        </div>
        <Input
          containerClassName="sm:col-span-2"
          label="Title"
          name="title"
          maxLength={150}
          value={form.title}
          error={errors.title}
          onChange={(event) => update('title', event.target.value)}
        />
        <Textarea
          containerClassName="sm:col-span-2"
          label="Description"
          name="description"
          rows={3}
          maxLength={2000}
          value={form.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <Input
          label="Subject"
          name="subject"
          value={form.subject}
          placeholder="e.g. DBMS"
          onChange={(event) => update('subject', event.target.value)}
        />
        <Select
          label="Category"
          name="category"
          value={form.category}
          onChange={(event) => update('category', event.target.value)}
        >
          <option value="NOTES">Notes</option>
          <option value="QUESTION_PAPER">Question paper</option>
          <option value="PDF">PDF</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input
          containerClassName="sm:col-span-2"
          label="Tags"
          name="tags"
          value={form.tags}
          hint="Comma separated, for example sql, normalization, exam."
          onChange={(event) => update('tags', event.target.value)}
        />

        {progress !== null ? (
          <div className="sm:col-span-2">
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div className="h-full bg-lime transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">Uploading… {progress}%</p>
          </div>
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

function EditDialog({ open, onClose, resource, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', subject: '', category: 'NOTES', tags: '' });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!open || !resource) return;
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      subject: resource.subject || '',
      category: resource.category || 'NOTES',
      tags: resource.tags || '',
    });
    setErrors({});
    setGeneralError('');
  }, [open, resource]);

  const save = useMutation({
    mutationFn: (metadata) => updateResource(resource.id, metadata),
    onSuccess: () => {
      toast({ title: 'Resource updated', variant: 'success' });
      onSaved?.();
      onClose?.();
    },
    onError: (error) => {
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'The resource could not be updated.');
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Give the resource a title.';
    if (form.title.trim().length > 150) nextErrors.title = 'Use at most 150 characters.';
    if (form.description.length > 2000) nextErrors.description = 'Use at most 2,000 characters.';
    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;
    save.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      category: form.category,
      tags: form.tags.trim(),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit resource"
      description="Only metadata can be changed; the uploaded file stays the same."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="resource-edit-form" loading={save.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="resource-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <Input
          containerClassName="sm:col-span-2"
          label="Title"
          name="title"
          maxLength={150}
          value={form.title}
          error={errors.title}
          onChange={(event) => update('title', event.target.value)}
        />
        <Textarea
          containerClassName="sm:col-span-2"
          label="Description"
          name="description"
          rows={3}
          maxLength={2000}
          value={form.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <Input
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={(event) => update('subject', event.target.value)}
        />
        <Select
          label="Category"
          name="category"
          value={form.category}
          onChange={(event) => update('category', event.target.value)}
        >
          <option value="NOTES">Notes</option>
          <option value="QUESTION_PAPER">Question paper</option>
          <option value="PDF">PDF</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input
          containerClassName="sm:col-span-2"
          label="Tags"
          name="tags"
          value={form.tags}
          hint="Comma separated."
          onChange={(event) => update('tags', event.target.value)}
        />
        {generalError ? (
          <p role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200 sm:col-span-2">
            {generalError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export default function MyResourcesPage() {
  usePageTitle('My resources');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const resources = useQuery({ queryKey: queryKeys.resources.mine, queryFn: listMyResources });

  const remove = useMutation({
    mutationFn: (id) => deleteResource(id),
    onSuccess: () => {
      toast({ title: 'Resource deleted', variant: 'success' });
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
    },
    onError: (error) => toast({ title: 'Could not delete the resource', description: error?.message, variant: 'error' }),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
  }

  const list = resources.data || [];

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="My resources"
        description="Resources you uploaded. Editing updates the public library; deleting removes the file permanently."
        actions={
          <Button icon={Plus} onClick={() => setUploadOpen(true)}>
            Upload resource
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to={paths.resources} className="text-sm text-muted hover:text-lime">
          ← Browse the public library
        </Link>
        {resources.isSuccess ? (
          <p className="ml-auto text-sm text-muted">
            <strong className="text-ink">{list.length}</strong>{' '}
            {list.length === 1 ? 'resource' : 'resources'} uploaded by you
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        {resources.isPending ? (
          <div className="space-y-3" role="status" aria-label="Loading your resources">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-panel border border-line bg-surface p-5">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : resources.isError ? (
          <ErrorState
            title="Your resources could not be loaded"
            message={resources.error?.message}
            onRetry={() => resources.refetch()}
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="You have not shared a resource yet"
            description="Upload notes, a question paper or study material to help other students."
            action={<Button onClick={() => setUploadOpen(true)}>Upload a resource</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((resource) => (
              <li key={resource.id} className="rounded-panel border border-line bg-surface p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-lime/25 bg-lime/[0.07] text-lime">
                    <FileText size={18} aria-hidden="true" />
                    <span className="text-[9px] font-bold">
                      {(fileExtension(resource.originalFileName) || 'FILE').toUpperCase()}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="lime">{categoryLabel(resource.category)}</Badge>
                      {resource.subject ? <Badge variant="neutral">{resource.subject}</Badge> : null}
                    </div>
                    <h2 className="mt-1.5 text-base font-semibold tracking-tight">
                      <Link to={paths.resource(resource.id)} className="hover:text-lime">
                        {resource.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {resource.originalFileName} · {fileSize(resource.sizeBytes)} · uploaded{' '}
                      {formatDate(resource.createdAt)} · {formatNumber(resource.downloadCount)} downloads
                    </p>
                    {resource.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-silver">{resource.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ResourceDownloadButton resource={resource} />
                    <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditing(resource)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-red-300"
                      onClick={() => setDeleting(resource)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refresh} />
      <EditDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        resource={editing}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => remove.mutate(deleting.id)}
        title="Delete resource"
        message={`Delete "${deleting?.title}"? This removes the file permanently and cannot be undone.`}
        confirmLabel="Delete resource"
        loading={remove.isPending}
      />
    </div>
  );
}
