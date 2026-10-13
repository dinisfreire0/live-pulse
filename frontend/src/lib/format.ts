const dateTimeFormat = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

export function formatVotes(count: number): string {
  return count === 1 ? '1 voto' : `${count} votos`;
}
