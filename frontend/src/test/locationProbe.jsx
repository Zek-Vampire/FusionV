import { useLocation } from 'react-router-dom';

/** Renders the current route so tests can assert URL-based filter state. */
export default function LocationProbe() {
  const location = useLocation();
  return (
    <p data-testid="location-probe">
      {location.pathname}
      {location.search}
    </p>
  );
}
