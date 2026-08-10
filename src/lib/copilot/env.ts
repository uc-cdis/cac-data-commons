import { QAG_VERSION } from './qagVersion';

/**
 * AG-UI endpoint of the agent that owns the model, e.g. `<commons>/qag/v3/agui/`.
 */
export const getChatAgentUrl = (): string => {
  const base = process.env.GEN3_QAG_BASE_URL;
  if (!base) {
    throw new Error('GEN3_QAG_BASE_URL is not configured');
  }
  return `${base.replace(/\/+$/, '')}/${QAG_VERSION}/agui/`;
};
