import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Route-level fade/slide is implemented in CSS so Motion is not part of the
 * initial application bundle. The global reduced-motion rule in tokens.css
 * disables the animation for users who ask for it.
 */
export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div key={location.pathname} className="page-enter">
      {outlet}
    </div>
  );
}
