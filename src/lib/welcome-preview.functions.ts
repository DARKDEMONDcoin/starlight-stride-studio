import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { WelcomePreview } from "./welcome-preview.server";

export const getWelcomePreview = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ url: z.string().trim().min(4).max(300) }).parse(input))
  .handler(async ({ data }): Promise<WelcomePreview> => {
    const { runWelcomeAnalysis } = await import("./welcome-analysis.server");
    return runWelcomeAnalysis(data.url, getRequest());
  });
