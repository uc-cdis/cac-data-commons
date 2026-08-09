import { Group, Loader, Text } from "@mantine/core";

export function RunStatusBanner({ isRunning, durationMs }: { isRunning: boolean; durationMs: number | null }) {
  const label = isRunning
    ? "Running..."
    : durationMs !== null
      ? `Turn completed in ${(durationMs / 1000).toFixed(1)}s` // should use formatDuration
      : "Turn completed"; // should we probably wrap it in a border or something?

  return (
    <Group gap="xs">
      {isRunning && <Loader size="xs" type="dots" />}
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  );
}
