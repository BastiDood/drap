export async function load({ locals: { db } }) {
    // TODO: Check if the user previously voted.
    const availableLabs = await db.getLabRegistry();
    return { availableLabs };
}
