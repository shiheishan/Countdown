export const EVENTS = [
  {
    id: 'national-day-2025',
    name: '国庆·中秋',
    start: '2025-10-01T00:00:00+08:00',
    end: '2025-10-08T23:59:59+08:00',
    statusLabels: {
      before: '等待',
      during: '假期中',
      after: '已结束',
    },
  },
];

export const DEFAULT_EVENT_ID = EVENTS[0].id;

export function getActiveEvent(search = window.location.search) {
  const params = new URLSearchParams(search);
  const eventId = params.get('event') || DEFAULT_EVENT_ID;
  return EVENTS.find((event) => event.id === eventId) ?? EVENTS[0];
}
