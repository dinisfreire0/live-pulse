export type FeedbackKind = 'success' | 'error' | 'info';

export const feedbackRole = (kind: FeedbackKind) => (kind === 'error' ? 'alert' : 'status');

export const feedbackClass = (kind: FeedbackKind) => `feedback feedback--${kind}`;
