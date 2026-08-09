"use client";

import { useState } from "react";
import { Button, Group, Select, Stack, Text, Textarea, Tooltip } from "@mantine/core";

export interface ChatInputProps {
  isRunning: boolean;
  blockedReason?: string;
  onSend: (text: string) => void;
  onStop: () => void;
  label?: string;
  placeholder?: string;
}

// Visual only. TODO: real model list, wired to the API.
const MODEL_OPTIONS = [{ value: "openai:openai.gpt-oss-120b", label: "(On-Prem) GPT OSS 120B" }];

export function ChatInput({
  isRunning,
  blockedReason,
  onSend,
  onStop,
  label,
  placeholder,
}: ChatInputProps) {
  const [value, setValue] = useState("");

const send = () => {
  const trimmed = value.trim();
  if (!trimmed || isRunning || blockedReason) return;
  onSend(trimmed);
  setValue("");
};

  // Width and gutter belong to the column this sits in, not to the composer.
  return (
    <Stack gap="xs" w="100%">
      {label && (
        <Text fw={700} size="sm">
          {label}
        </Text>
      )}
      <Textarea
        autosize
        minRows={1}
        maxRows={6}
        placeholder={placeholder ?? "Type a message"}
        aria-label="Message"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />
      <Group justify="space-between" wrap="nowrap">
        <Select
          data={MODEL_OPTIONS}
          defaultValue={MODEL_OPTIONS[0].value}
          allowDeselect={false}
          aria-label="Model"
          w={240}
          comboboxProps={{ withinPortal: true }}
        />
        {isRunning ? (
          <Button variant="light" color="red" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Tooltip label={blockedReason} disabled={!blockedReason} withArrow position="top">
            <Button
              onClick={send}
              data-disabled={blockedReason ? true : undefined}
              disabled={!blockedReason && !value.trim()}
            >
              Send
            </Button>
          </Tooltip>
        )}
      </Group>
    </Stack>
  );
}
