import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadResource, listResources } from '@/services/resources';
import LocationProbe from '@/test/locationProbe';
import { renderWithProviders } from '@/test/render';
import ResourcesPage from './ResourcesPage';

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

function renderResources(entries = ['/resources']) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/resources"
        element={
          <>
            <ResourcesPage />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { initialEntries: entries },
  );
}

describe('ResourcesPage', () => {
  beforeEach(() => {
    listResources.mockReset();
    downloadResource.mockReset();
  });

  it('renders the public library with metadata and downloads the real file', async () => {
    const user = userEvent.setup();
    listResources.mockResolvedValue([RESOURCE]);
    downloadResource.mockResolvedValue({ filename: 'dbms-notes.pdf' });

    renderResources();

    expect(await screen.findByText('DBMS Notes')).toBeInTheDocument();
    expect(screen.queryByText('dbms-notes.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('12 downloads')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/resources/5');

    await user.click(screen.getByRole('button', { name: 'Download DBMS Notes' }));

    await waitFor(() => expect(downloadResource).toHaveBeenCalledWith(RESOURCE));
    expect(await screen.findByText('Download started')).toBeInTheDocument();
  });

  it('sends the search filters through the URL to the API', async () => {
    const user = userEvent.setup();
    listResources.mockResolvedValue([RESOURCE]);

    renderResources();

    await screen.findByText('DBMS Notes');
    await user.type(screen.getByLabelText('Search resources'), 'sql');
    await user.selectOptions(screen.getByLabelText('Category'), 'NOTES');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(listResources).toHaveBeenLastCalledWith({
        q: 'sql',
        category: 'NOTES',
        subject: '',
        tag: '',
      }),
    );
    const probe = screen.getByTestId('location-probe');
    expect(probe).toHaveTextContent('q=sql');
    expect(probe).toHaveTextContent('category=NOTES');
  });

  it('shows the empty-library and no-match states', async () => {
    listResources.mockResolvedValue([]);
    renderResources();
    expect(await screen.findByText('No resources have been shared yet')).toBeInTheDocument();

    renderResources(['/resources?q=zzz']);
    expect(await screen.findByText('No resources match these filters')).toBeInTheDocument();
  });
});
