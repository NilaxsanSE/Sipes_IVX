import { LocateFixed } from 'lucide-react';

type MapControlsProps = {
  onResetView: () => void;
};

export function MapControls({ onResetView }: MapControlsProps) {
  return (
    <div className="map-controls">
      <button className="secondary-button" type="button" onClick={onResetView}>
        <LocateFixed size={16} />
        Reset View
      </button>
    </div>
  );
}
