import type { ComplianceResult, DatasetConfig, GenerationResult, ModelConfig, UserPlan } from "./types";

export function validateModelUsage(
  modelConfig: ModelConfig,
  userPlan: UserPlan,
  datasetConfig?: DatasetConfig,
): ComplianceResult {
  if (modelConfig.license === "CC-BY-NC-4.0") {
    if (modelConfig.tier !== "lite") {
      return {
        allowed: false,
        usage_restriction: "CC-BY-NC-4.0 models are only allowed in Lite mode.",
        output_label: "Blocked",
      };
    }

    return {
      allowed: true,
      usage_restriction: "Non-commercial use only",
      output_label: "Non-commercial use only",
    };
  }

  if (modelConfig.license === "MIT" || modelConfig.license === "Apache-2.0" || modelConfig.license === "Proprietary") {
    return {
      allowed: true,
      usage_restriction: "Commercial use allowed",
      output_label: modelConfig.license === "Proprietary" ? "SoundAI Pro commercial use allowed" : "Commercial use allowed",
    };
  }

  if (modelConfig.license === "Research" || datasetConfig?.license === "Research") {
    return {
      allowed: userPlan === "enterprise",
      usage_restriction: "Research metadata only; do not expose source material publicly.",
      output_label: "Research metadata only",
    };
  }

  return {
    allowed: modelConfig.commercial_use,
    usage_restriction: modelConfig.commercial_use ? "Commercial use allowed" : "Review model license before commercial use",
    output_label: modelConfig.commercial_use ? "Commercial use allowed" : "License review required",
  };
}

export function assertCommercialUseAllowed(modelConfig: ModelConfig, commercialIntent: boolean): void {
  if (commercialIntent && !modelConfig.commercial_use) {
    throw new Error(`Model ${modelConfig.id} is not licensed for commercial output usage.`);
  }
}

export function decorateComplianceMetadata(result: GenerationResult, modelConfig: ModelConfig): GenerationResult {
  if (modelConfig.license === "CC-BY-NC-4.0") {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        usage_restriction: "non-commercial",
        output_label: "Non-commercial use only",
      },
    };
  }

  if (modelConfig.license === "Research") {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        usage_restriction: "research-only",
        output_label: "Research metadata only",
      },
    };
  }

  return {
    ...result,
    metadata: {
      ...result.metadata,
      usage_restriction: modelConfig.commercial_use ? "none" : "license-review-required",
      output_label: modelConfig.commercial_use ? "Commercial use allowed" : "License review required",
    },
  };
}
