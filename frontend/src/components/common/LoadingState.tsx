type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading data' }: LoadingStateProps) {
  return <div className="state-message state-message--loading">{label}</div>;
}
