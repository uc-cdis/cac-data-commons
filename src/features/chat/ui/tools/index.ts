import type { ToolRenderer } from "./types";
import { SurvivalToolResult } from "./survival/SurvivalToolResult";
import { ReportToolResult } from "./report/ReportToolResult";

export type { ToolRenderer, ToolRendererProps } from "./types";

export const toolRenderers: Record<string, ToolRenderer | undefined> = {
  get_survival_data: SurvivalToolResult,
  run_query: ReportToolResult,
  start_rewoo: ReportToolResult,
};
