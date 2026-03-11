import { cronJobs } from "convex/server";
import { internal } from "./_generated/api.js";

const crons = cronJobs();

crons.interval(
  "cleanup expired tokens",
  { hours: 1 },
  internal.apiKeys.cleanupExpiredTokens,
);

export default crons;
