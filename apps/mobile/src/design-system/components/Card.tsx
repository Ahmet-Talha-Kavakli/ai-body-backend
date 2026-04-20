import React from 'react';
import { ViewProps } from 'react-native';
import { Box } from '../primitives/Box';

type CardProps = ViewProps & {
  children: React.ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated = false, style, ...rest }: CardProps) {
  return (
    <Box p={5} rounded="xl" bg={elevated ? 'surfaceElevated' : 'surface'} style={style} {...rest}>
      {children}
    </Box>
  );
}
