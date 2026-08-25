import { Card, CardContent, Box, Typography, Stack } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Money from './Money';

/**
 * Tarjeta de metrica del design system.
 *
 * Anatomia (de arriba hacia abajo):
 *   [icono en cuadrado tintado]        [chip de variacion]
 *   etiqueta chica y atenuada
 *   VALOR GRANDE
 *   pie opcional
 *
 * El color NO se pasa como clase de Tailwind: se elige un `tone` semantico y
 * el componente resuelve el token. Asi una tarjeta no puede quedar de un color
 * que no pertenezca al sistema.
 */

const TONES = {
    primary: { fg: 'var(--primary)', bg: 'var(--primary-soft)' },
    success: { fg: 'var(--success)', bg: 'var(--success-soft)' },
    warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)' },
    danger: { fg: 'var(--destructive)', bg: 'var(--destructive-soft)' },
    neutral: { fg: 'var(--muted-foreground)', bg: 'var(--surface-2)' },
};

export default function StatCard({
    label,
    value,
    money = false,
    icon: Icon,
    tone = 'neutral',
    delta,
    footer,
    onClick,
}) {
    const palette = TONES[tone] ?? TONES.neutral;
    const isUp = typeof delta === 'number' && delta >= 0;
    const DeltaIcon = isUp ? TrendingUp : TrendingDown;

    return (
        <Card
            onClick={onClick}
            sx={{
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform .15s ease, box-shadow .15s ease',
                ...(onClick && {
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-raised)' },
                }),
            }}
        >
            <CardContent>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                    {Icon && (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--radius)',
                                bgcolor: palette.bg,
                                color: palette.fg,
                                display: 'grid',
                                placeItems: 'center',
                            }}
                        >
                            <Icon size={20} strokeWidth={2.2} />
                        </Box>
                    )}

                    {typeof delta === 'number' && (
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 'var(--radius-pill)',
                                bgcolor: isUp ? 'var(--success-soft)' : 'var(--destructive-soft)',
                                color: isUp ? 'var(--success)' : 'var(--destructive)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {isUp ? '+' : ''}{delta.toFixed(2)}%
                            <DeltaIcon size={13} strokeWidth={2.5} />
                        </Stack>
                    )}
                </Stack>

                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {label}
                </Typography>

                {money ? (
                    <Money value={value} variant="h2" />
                ) : (
                    <Typography
                        variant="h2"
                        sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
                    >
                        {value}
                    </Typography>
                )}

                {footer && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        {footer}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
