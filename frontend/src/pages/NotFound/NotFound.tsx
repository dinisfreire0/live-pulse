import { Link } from 'react-router-dom';
import { NOT_FOUND_COPY } from './NotFound.ts';
import './NotFound.scss';

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1>{NOT_FOUND_COPY.title}</h1>
      <p className="muted">{NOT_FOUND_COPY.description}</p>
      <Link to={NOT_FOUND_COPY.linkTo} className="btn btn--primary">
        {NOT_FOUND_COPY.linkLabel}
      </Link>
    </section>
  );
}
