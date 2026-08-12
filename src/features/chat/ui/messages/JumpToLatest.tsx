"use client";

import { ActionIcon } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";

export interface JumpToLatestProps {
  onClick: () => void;
}

export function JumpToLatest({ onClick }: JumpToLatestProps) {
  return (
    <ActionIcon
      onClick={onClick}
      aria-label="Scroll to latest"
      variant="default"
      radius="xl"
      size="lg"
      pos="absolute"
      bottom={12}
      right={16}
      style={{ boxShadow: "var(--mantine-shadow-md)" }}
    >
      <IconArrowDown size={18} />
    </ActionIcon>
  );
}
