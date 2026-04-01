import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useUncontrolled } from '@mantine/hooks';
import { Group, Text, Box, Collapse, UnstyledButton } from '@mantine/core';
import { IconBrain, IconChevronDown } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Response } from './Response';

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
};

export type ReasoningProps = {
  children: ReactNode;
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    style,
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useUncontrolled({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });

    const [duration, setDuration] = useUncontrolled({
      value: durationProp,
      defaultValue: 0,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.ceil((Date.now() - startTime) / MS_IN_S));
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (defaultOpen && !isStreaming && isOpen && !hasAutoClosed) {
        // Add a small delay before closing to allow user to see the content
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);

        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed]);

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Box className={className} style={{ marginBottom: '1rem', ...style }}>
          {children}
        </Box>
      </ReasoningContext.Provider>
    );
  },
);

export type ReasoningTriggerProps = {
  children?: ReactNode;
  className?: string;
};

const getThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Text size="md">Thinking...</Text>;
  }
  if (duration === undefined) {
    return <Text size="md">Thought for a few seconds</Text>;
  }
  return <Text  size="md">Thought for {duration} seconds</Text>;
};

export const ReasoningTrigger = memo(
  ({ className, children }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, setIsOpen, duration } = useReasoning();

    return (
      <UnstyledButton
        className={className}
        style={{
          width: '100%',
          transition: 'color 0.2s',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children ?? (
          <Group gap={8}>
            <IconBrain size={16} />
            {getThinkingMessage(isStreaming, duration)}
            <IconChevronDown
              size={16}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </Group>
        )}
      </UnstyledButton>
    );
  },
);

export type ReasoningContentProps = {
  children: string;
  className?: string;
};

export const ReasoningContent = memo(
  ({ className, children }: ReasoningContentProps) => {
    const { isOpen } = useReasoning();

    return (
      <Collapse in={isOpen} className={className}>
        <Box
          mt="md"
          style={{
            fontSize: '0.7rem',
            color: 'var(--mantine-base-contrast-max)',
          }}
        >
          <Response style={{ display: 'grid', gap: '0.5rem' }}>
            {children}
          </Response>
        </Box>
      </Collapse>
    );
  },
);

Reasoning.displayName = 'Reasoning';
ReasoningTrigger.displayName = 'ReasoningTrigger';
ReasoningContent.displayName = 'ReasoningContent';
