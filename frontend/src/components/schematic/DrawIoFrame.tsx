import { useEffect, useState } from 'react';
import { ErrorState } from '../common/ErrorState';
import { LoadingState } from '../common/LoadingState';

const DRAWIO_URL = import.meta.env.VITE_DRAWIO_URL ?? 'http://localhost:8081';

export function DrawIoFrame() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setState((current) => (current === 'loading' ? 'error' : current));
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="drawio-frame">
      <div className="drawio-frame__header">
        <div>
          <span className="section-label">Draw.io</span>
          <h2>Self-hosted editor</h2>
        </div>
      </div>

      {state === 'loading' && <LoadingState label="Loading Draw.io" />}
      {state === 'error' && (
        <ErrorState message="Draw.io is not reachable. Start the drawio service and refresh this page." />
      )}

      <iframe
        className={state === 'ready' ? 'drawio-frame__iframe' : 'drawio-frame__iframe drawio-frame__iframe--hidden'}
        src={`${DRAWIO_URL}/?offline=1&https=0&embed=1&ui=min&proto=json`}
        title="Self-hosted Draw.io editor"
        onLoad={() => setState('ready')}
        onError={() => setState('error')}
      />
    </div>
  );
}
