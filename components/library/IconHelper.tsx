import React from 'react';
import { Box, Droplets, Zap, Wind, Star } from 'lucide-react';

export const getResourceIcon = (iconType: string, color: string, size = 18) => {
  const props = { size, style: { color } };
  switch (iconType) {
    case 'droplet': return <Droplets {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'wind': return <Wind {...props} />;
    case 'star': return <Star {...props} />;
    default: return <Box {...props} />;
  }
};
