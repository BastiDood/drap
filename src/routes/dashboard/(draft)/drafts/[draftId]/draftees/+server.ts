import { json } from "@sveltejs/kit";

import { db } from "$lib/server/database";
import { getStudentsInDraftTaggedByLab } from "$lib/server/database/drizzle";
import type { SerializableStudent } from '$lib/features/drafts/types';

export async function GET({ params }) {
  const draftId = BigInt(params.draftId);

  const draftees = await getStudentsInDraftTaggedByLab(db, draftId);

  // Make data JSON-serializable
  const serializableDrafteeList = draftees.map((draftee) => {
    return {
      ...draftee,

      // Reassign non-serializable attributes
      studentNumber: draftee.studentNumber === null ? null : draftee.studentNumber.toString(),
    };
  }) as SerializableStudent[];

  return json(serializableDrafteeList);
}