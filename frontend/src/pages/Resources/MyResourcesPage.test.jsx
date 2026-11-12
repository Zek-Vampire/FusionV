import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  deleteResource,
  downloadResource,
  listMyResources,
  updateResource,
  uploadResource,
} from '@/services/resources';
import MyResourcesPage from './MyResourcesPage';

vi.mock('@/services/resources', () => ({
  listMyResources: vi.fn(),
  uploadResource: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  downloadResource: vi.fn(),
}));

const RESOURCE = {
  id: 3,
  title: 'DBMS Notes',
  description: 'Normalisation and SQL.',
  subject: 'DBMS',
  category: 'NOTES',
  tags: 'sql',
  originalFileName: 'dbms.pdf',
  sizeBytes: 2048,
  downloadCount: 12,
  createdAt: '2026-11-01T10:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  listMyResources.mockResolvedValue([RESOURCE]);
  uploadResource.mockResolvedValue({ ...RESOURCE, id: 4 });
  updateResource.mockResolvedValue(RESOURCE);
  deleteResource.mockResolvedValue(null);
  downloadResource.mockResolvedValue({ filename: 'dbms.pdf' });
});

describe('MyResourcesPage', () => {
  it('lists the signed-in student resources with owner actions', async () => {
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });

    expect(await screen.findByText('DBMS Notes')).toBeInTheDocument();
    expect(screen.getByText(/12 downloads/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('validates the upload form before sending multipart data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });

    await screen.findByText('DBMS Notes');
    await user.click(screen.getByRole('button', { name: 'Upload resource' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Upload resource' }));

    expect(await screen.findByText('Give the resource a title.')).toBeInTheDocument();
    expect(screen.getByText('Choose a file to upload.')).toBeInTheDocument();
    expect(uploadResource).not.toHaveBeenCalled();
  });

  it('edits metadata through the update endpoint', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });

    await screen.findByText('DBMS Notes');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'DBMS Notes v2');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(updateResource).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ title: 'DBMS Notes v2', category: 'NOTES' }),
      ),
    );
  });

  it('deletes a resource after confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });

    await screen.findByText('DBMS Notes');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete resource' }));

    await waitFor(() => expect(deleteResource).toHaveBeenCalledWith(3));
    expect(await screen.findByText('Resource deleted')).toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    listMyResources.mockResolvedValueOnce([]);
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });
    expect(await screen.findByText('You have not shared a resource yet')).toBeInTheDocument();

    listMyResources.mockRejectedValueOnce(new Error('Resources unavailable'));
    renderWithProviders(<MyResourcesPage />, { auth: { isAuthenticated: true } });
    expect(await screen.findByText('Resources unavailable')).toBeInTheDocument();
  });
});
