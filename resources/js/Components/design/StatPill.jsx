import { Box, Typography } from '@mui/material';
import { CONTROL_HEIGHT } from './PageToolbar';
import Money from './Money';

/**
 * Dato numerico compacto para la barra de acciones (saldo, total, contador).
 *
 * Reemplaza los bloques sueltos tipo `bg-red-200 rounded text-red-950`, que
 * ademas de ignorar los tokens comunicaban mal: un total pintado de rojo se
 * lee como un error. El color se elige por `tone` semantico, y el neutro es
 * el correcto para un saldo que todavia no es ni bueno ni malo.
 */

const TONES = {
    neutral: { fg: 'var(--foreground)', bg: 'var(--surface-2)', border: 'var(--border)' },
    primary: { fg: 'var(--primary)', bg: 'var(--primary-soft)', border: 'transparent' },
    success: { fg: 'var(--success)', bg: 'var(--success-soft)', border: 'transparent' },
    warning: { fg: 'var(--warning)', bg: 'var(--warning-soft)', border: 'transparent' },
    danger: { fg: 'var(--destructive)', bg: 'var(--destructive-soft)', border: 'transparent' },
};

export default function StatPill({ label, value, money = false, tone = 'neutral', icon: Icon }) {
    const palette = TONES[tone] ?? TONES.neutral;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                height: CONTROL_HEIGHT,
                px: 2,
                borderRadius: 'var(--radius)',
                bgcolor: palette.bg,
                border: '1px solid',
                borderColor: palette.border,
                flexShrink: 0,
            }}
        >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                {Icon && <Icon size={16} style={{ color: palette.fg }} />}
                <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {label}
                </Typography>
            </Box>

            {money ? (
                <Money value={value} variant="body2" sx={{ color: palette.fg, fontWeight: 600 }} />
            ) : (
                <Typography
                    variant="body2"
                    sx={{ color: palette.fg, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                >
                    {value}
                </Typography>
            )}
        </Box>
    );
}
