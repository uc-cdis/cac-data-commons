import type { ToolRendererEntry } from "./types";
import { SurvivalToolResult } from "./survival/SurvivalToolResult";
import { ReportToolResult } from "./report/ReportToolResult";

export const toolRenderers: Record<string, ToolRendererEntry | undefined> = {
  get_survival_data: { Component: SurvivalToolResult },
  run_query: { Component: ReportToolResult, trailing: true },
  start_rewoo: { Component: ReportToolResult, trailing: true },
};

export function isTrailingTool(name: string): boolean {
  return toolRenderers[name]?.trailing === true;
}
