import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { dresden, fan, germany, objectTypesById, sachsen } from '../test/fixtures';
import { OverviewPage } from './OverviewPage';

describe('OverviewPage', () => {
  it('renders locations sorted by status and excludes non-location assets', () => {
    render(
      <MemoryRouter>
        <OverviewPage
          objects={[germany, sachsen, dresden, fan]}
          objectTypesById={objectTypesById}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Locations by Status' })).toBeInTheDocument();
    expect(screen.getByText('Status-sorted overview')).toBeInTheDocument();
    expect(screen.getAllByText('Locations')).toHaveLength(2);
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('Dresden')).toBeInTheDocument();
    expect(screen.queryByText('Fan 01')).not.toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });
});
