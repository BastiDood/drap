import { json } from "@sveltejs/kit";

import { db } from "$lib/server/database";
import { getStudentsInDraftTaggedByLab } from "$lib/server/database/drizzle";

export async function GET({ params }) {
  const draftId = BigInt(params.draftId);
  return json(await getStudentsInDraftTaggedByLab(db, draftId));
}