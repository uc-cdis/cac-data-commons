"use client";

import { Button } from "@mantine/core";
import { IconArrowDown } from "@tabler/icons-react";

export interface JumpToLatestProps {
  label: string;
  blocked?: boolean;
  onClick: () => void;
}

export function JumpToLatest({ label, blocked, onClick }: JumpToLatestProps) {
  return (
    <Button
      onClick={onClick}
      aria-label={label}
      size="xs"
      radius="xl"
      variant={blocked ? "filled" : "default"}
      color={blocked ? "orange" : undefined}
      leftSection={<IconArrowDown size={14} />}
      pos="absolute"
      bottom={12}
      left="50%"
      style={{ transform: "translateX(-50%)", boxShadow: "var(--mantine-shadow-md)" }}
    >
      {label}
    </Button>
  );
}
