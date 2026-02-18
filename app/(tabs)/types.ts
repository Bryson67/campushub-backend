// types.ts
export type RootStackParamList = {
  PayTournament: undefined; // No params for payment page
  Lobby: { tournamentId: string }; // Pass tournamentId to Lobby
};
