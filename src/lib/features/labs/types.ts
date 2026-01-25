import type { schema } from '$lib/server/database';

export type ActiveLab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;

export interface ArchivedLab extends Pick<schema.Lab, 'id' | 'name' | 'deletedAt'> {
  deletedAt: Date; // narrow from Date | null
}

export type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota' | 'deletedAt'>;
