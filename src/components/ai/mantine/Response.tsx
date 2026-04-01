import React from 'react';
import { Box } from '@mantine/core';
import { type ComponentProps, memo, type CSSProperties } from 'react';
import { Streamdown } from 'streamdown';

type ResponseProps = ComponentProps<typeof Streamdown> & {
  className?: string;
  style?: CSSProperties;
};

export const Response = memo(
  ({ className, style, ...props }: ResponseProps) => (
    <Box
      component={Streamdown as any}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
      className={className}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = 'Response';
