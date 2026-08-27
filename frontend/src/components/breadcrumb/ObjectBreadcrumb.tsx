import { ChevronRight } from 'lucide-react';
import type { ApiObject } from '../../types/objects';

type ObjectBreadcrumbProps = {
  items: ApiObject[];
  onNavigate: (objectId: string) => void;
};

export function ObjectBreadcrumb({ items, onNavigate }: ObjectBreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Object path" className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span className="breadcrumb__item" key={item.id}>
            <button
              aria-current={isLast ? 'page' : undefined}
              className="breadcrumb__button"
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              {item.name}
            </button>
            {!isLast && <ChevronRight className="breadcrumb__separator" size={15} aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}
