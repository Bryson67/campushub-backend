// convex/functions/tournaments/getAll.ts
import { query } from "./_generated/server";

export default query(async ({ db }) => {
  const tournaments = await db.query("tournaments").collect();
  return tournaments.map(t => ({
    id: t._id.toString(),
    name: t.name,
    game: t.game,
    date: t.date,
    fee: t.fee,
  }));
});
