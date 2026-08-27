import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { demoTree, dresden, fan, germany, objectTypesById, sachsen } from '../test/fixtures';
import { OverviewPage } from './OverviewPage';

describe('OverviewPage', () => {
  it('renders real root objects and status totals from supplied backend data', () => {
    render(
      <MemoryRouter>
        <OverviewPage
          objects={[germany, sachsen, dresden, fan]}
          roots={demoTree}
          objectTypesById={objectTypesById}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'SIPES IVX' })).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('Total objects')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
