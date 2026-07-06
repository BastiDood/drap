import { addDays, eachDayOfInterval, startOfDay } from 'date-fns';

export interface TimelineData {
  date: Date;
  label: string;
  count: number;
}

interface BuildRegistrationTimelineDataInput {
  draftCreatedAt: Date;
  chartEnd: Date;
  registrationTimestamps: string[];
}

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function formatDayLabel(value: Date) {
  return dayFormat.format(value);
}

export function buildRegistrationTimelineData({
  draftCreatedAt,
  chartEnd,
  registrationTimestamps,
}: BuildRegistrationTimelineDataInput) {
  const countByDay = new Map<number, number>();

  for (const value of registrationTimestamps) {
    const day = startOfDay(new Date(value)).getTime();
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }

  return eachDayOfInterval({
    start: startOfDay(draftCreatedAt),
    end: startOfDay(chartEnd),
  }).map(date => ({
    date,
    label: formatDayLabel(date),
    count: countByDay.get(date.getTime()) ?? 0,
  }));
}

export function getRegistrationClosedAnnotationDay(registrationClosedAt: Date) {
  return startOfDay(addDays(registrationClosedAt, 1));
}

export function getRegistrationTimelineEnd(chartEnd: Date, registrationClosedAt: Date) {
  const annotationDay = getRegistrationClosedAnnotationDay(registrationClosedAt);
  return chartEnd.getTime() < annotationDay.getTime() ? annotationDay : chartEnd;
}
