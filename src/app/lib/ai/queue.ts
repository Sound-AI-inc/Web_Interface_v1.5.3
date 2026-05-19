import { routeGenerationRequest } from "./router";
import type { GenerationRequest, RouteGenerationOptions, RoutedGenerationResponse, SoundAIUser } from "./types";

export type GenerationJob = {
  id: string;
  user: SoundAIUser;
  request: GenerationRequest;
  created_at: string;
};

export async function enqueueGenerationJob(user: SoundAIUser, request: GenerationRequest): Promise<GenerationJob> {
  return {
    id: crypto.randomUUID(),
    user,
    request,
    created_at: new Date().toISOString(),
  };
}

export async function processGenerationJob(
  job: GenerationJob,
  options: RouteGenerationOptions,
): Promise<RoutedGenerationResponse> {
  return routeGenerationRequest(job.user, job.request, options);
}
