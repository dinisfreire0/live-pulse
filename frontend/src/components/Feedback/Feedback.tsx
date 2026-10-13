import type { ReactNode } from 'react';
import { type FeedbackKind, feedbackClass, feedbackRole } from './Feedback.ts';
import './Feedback.scss';

interface FeedbackProps {
  kind: FeedbackKind;
  children: ReactNode;
  onRetry?: () => void;
}

export default function Feedback({ kind, children, onRetry }: FeedbackProps) {
  return (
    <div className={feedbackClass(kind)} role={feedbackRole(kind)}>
      <span className="feedback__message">{children}</span>
      {onRetry && (
        <button type="button" className="btn btn--small" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
