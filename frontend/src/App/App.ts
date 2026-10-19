export const paths = {
  publicList: '/polls',
  publicPoll: (id: number | string) => `/polls/${id}`,
  hostDashboard: '/host',
  hostNewPoll: '/host/new',
  hostPoll: (id: number | string) => `/host/polls/${id}`,
};

export function parsePollId(param: string | undefined): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}
