type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="state-message state-message--error" role="alert">
      {message}
    </div>
  );
}
