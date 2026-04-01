'use client';

import {
  Group,
  Text,
  Anchor,
  Box,
  Collapse,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBook, IconChevronDown } from '@tabler/icons-react';
import React, {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

type SourcesContextValue = {
  opened: boolean;
  toggle: () => void;
};

const SourcesContext = createContext<SourcesContextValue | null>(null);

const useSourcesContext = () => {
  const context = useContext(SourcesContext);
  if (!context) {
    throw new Error('Sources components must be used within Sources');
  }
  return context;
};

export type SourcesProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const Sources = ({
  className,
  children,
  defaultOpen = false,
  style,
}: SourcesProps) => {
  const [opened, { toggle }] = useDisclosure(defaultOpen);

  return (
    <SourcesContext.Provider value={{ opened, toggle }}>
      <Box
        className={className}
        style={{
          marginBottom: '1rem',
          fontSize: '0.7rem',
          color: 'var(--mantine-primary-color-filled)',
          ...style,
        }}
      >
        {children}
      </Box>
    </SourcesContext.Provider>
  );
};

export type SourcesTriggerProps = {
  count: number;
  children?: ReactNode;
  className?: string;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
}: SourcesTriggerProps) => {
  const { toggle } = useSourcesContext();

  return (
    <UnstyledButton className={className} onClick={toggle}>
      {children ?? (
        <Group gap={8}>
          <Text fw={500}>Used {count} sources</Text>
          <IconChevronDown size={16} />
        </Group>
      )}
    </UnstyledButton>
  );
};

export type SourcesContentProps = {
  children: ReactNode;
  className?: string;
};

export const SourcesContent = ({
  className,
  children,
}: SourcesContentProps) => {
  const { opened } = useSourcesContext();

  return (
    <Collapse in={opened} className={className}>
      <Box
        mt="md"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: 'fit-content',
        }}
      >
        {children}
      </Box>
    </Collapse>
  );
};

export type SourceProps = {
  href?: string;
  title?: string;
  children?: ReactNode;
  className?: string;
};

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <Anchor
    href={href}
    target="_blank"
    rel="noreferrer"
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    {...props}
  >
    {children ?? (
      <>
        <IconBook size={16} />
        <Text component="span" fw={500}>
          {title}
        </Text>
      </>
    )}
  </Anchor>
);
