import type { schema } from '$lib/server/database/drizzle';

export type ActiveLab = Pick<schema.Lab, 'id' | 'name'>;

export interface ArchivedLab extends Pick<schema.Lab, 'id' | 'name' | 'deletedAt'> {
  deletedAt: Date; // narrow from Date | null
}

export type Lab = Pick<schema.Lab, 'id' | 'name' | 'deletedAt'>;
