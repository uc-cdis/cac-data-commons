import { Paper, Text } from "@mantine/core";
import { MarkdownContent } from "./MarkdownContent";
import type { ChatMessage } from "../../core";

export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Paper
      px="md"
      py="xs"
      radius="lg"
      maw="80%"
      bg={isUser ? "orange.6" : "var(--mantine-color-default-hover)"}
      c={isUser ? "white" : undefined}
      style={{ alignSelf: isUser ? "flex-end" : "flex-start" }}
      data-role={message.role}
    >
      {isUser ? (
  <Text size="sm" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    {message.content}
  </Text>
) : (
  <MarkdownContent content={message.content} />
)}
    </Paper>
  );
}
