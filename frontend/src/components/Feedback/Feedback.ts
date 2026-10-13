export type FeedbackKind = 'success' | 'error' | 'info';

/** Errors interrupt screen readers; everything else is announced politely. */
export const feedbackRole = (kind: FeedbackKind) => (kind === 'error' ? 'alert' : 'status');

export const feedbackClass = (kind: FeedbackKind) => `feedback feedback--${kind}`;
