import { Box, Chip, Tooltip, Typography } from '@mui/material';
import type { AiAdrRisk } from '@/ai/types';

const levelLabels: Record<AiAdrRisk['level'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const levelColors: Record<AiAdrRisk['level'], 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

interface AdrRiskBadgeProps {
  data: AiAdrRisk | null | undefined;
  isLoading?: boolean;
  size?: 'small' | 'medium';
}

export function AdrRiskBadge({ data, isLoading, size = 'small' }: AdrRiskBadgeProps) {
  if (isLoading) {
    return <Chip size={size} label="ADR Risk: ..." disabled />;
  }
  if (!data) return null;
  const label = `ADR Risk: ${levelLabels[data.level]} (${data.score})`;
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
            Risk factors:
          </Typography>
          {data.factors.map((f, i) => (
            <Typography key={i} variant="caption" display="block">
              • {f}
            </Typography>
          ))}
        </Box>
      }
    >
      <Chip size={size} label={label} color={levelColors[data.level]} />
    </Tooltip>
  );
}
