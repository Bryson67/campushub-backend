import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/add-player",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const {
      userId,
      tournamentId,
      username,
      phoneNumber,
      amount,
      mpesaReceipt,
    } = await request.json();

    await ctx.runMutation(api.players.addPlayer, {
      userId,
      tournamentId,
      name: username,
      phoneNumber,
      amount: Number(amount),
      mpesaReceipt,
      createdAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
