import { routes, type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "next build",
  headers: [
    routes.cacheControl("/posters/(.*)", {
      public: true,
      maxAge: "1 day",
    }),
  ],
  crons: [
    {
      path: "/api/cron/reorder-suggestions",
      schedule: "0 4 * * *",
    },
  ],
};
