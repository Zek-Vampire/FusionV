import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadResource, getResource } from '@/services/resources';
import { renderWithProviders } from '@/test/render';
import ResourceDetailPage from './ResourceDetailPage';

vi.mock('@/services/resources', () => ({
  listResources: vi.fn(),
  getResource: vi.fn(),
  downloadResource: vi.fn(),
}));

const RESOURCE = {
  id: 5,
  title: 'DBMS Notes',
  description: 'Normalisation and SQL notes.',
  subject: 'DBMS',
  category: 'NOTES',
  tags: 'sql,normalisation',
  originalFileName: 'dbms-notes.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2048,
  downloadCount: 12,
  uploaderId: 3,
  uploaderName: 'Priya Nair',
  createdAt: '2026-10-01T10:00:00',
  downloadUrl: '/api/v1/resources/5/download',
};

function renderDetail(entry = '/resources/5') {
  return renderWithProviders(
    <Routes>
      <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
    </Routes>,
    { initialEntries: [entry] },
  );
}

describe('ResourceDetailPage', () => {
  beforeEach(() => {
    getResource.mockReset();
    downloadResource.mockReset();
  });

  it('renders file metadata and downloads through the blob service', async () => {
    const user = userEvent.setup();
    getResource.mockResolvedValue(RESOURCE);
    downloadResource.mockResolvedValue({ filename: 'dbms-notes.pdf' });

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'DBMS Notes' })).toBeInTheDocument();
    expect(screen.getByText('dbms-notes.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('sql')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download DBMS Notes' }));

    await waitFor(() => expect(downloadResource).toHaveBeenCalledWith(RESOURCE));
    expect(await screen.findByText('Download started')).toBeInTheDocument();
  });

  it('shows a not-found state for a deleted resource', async () => {
    getResource.mockRejectedValue({ status: 404, message: 'Study material 5 was not found' });

    renderDetail();

    expect(await screen.findByText('Resource not found')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Back to resources' }).length).toBeGreaterThan(0);
  });
});
