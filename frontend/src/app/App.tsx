import { useEffect, useState } from 'react';
import { getHealth } from '../services/api';

type HealthState =
  | { status: 'loading' }
  | { status: 'ready'; apiStatus: string; databaseStatus: string }
  | { status: 'error'; message: string };

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then((response) => {
        if (!isMounted) return;
        setHealth({
          status: 'ready',
          apiStatus: response.status,
          databaseStatus: response.database.status,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setHealth({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to reach API',
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Technical foundation</p>
        <h1>SIPES IVX</h1>
        <p className="summary">
          React, FastAPI, PostgreSQL and PostGIS are ready for the next build phase.
        </p>
      </section>

      <section className="status-panel" aria-label="System health">
        <div>
          <span className="label">API</span>
          <strong>{health.status === 'ready' ? health.apiStatus : health.status}</strong>
        </div>
        <div>
          <span className="label">Database</span>
          <strong>
            {health.status === 'ready'
              ? health.databaseStatus
              : health.status === 'error'
                ? 'unavailable'
                : 'checking'}
          </strong>
        </div>
      </section>

      {health.status === 'error' && <p className="error">{health.message}</p>}
    </main>
  );
}
