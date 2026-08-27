import { Stack, Typography, Box } from '@mui/material';

/**
 * Encabezado de seccion: titulo grande a la izquierda, acciones a la derecha.
 *
 * Es lo que arma el ritmo vertical de la pagina. El margen superior lo pone
 * el propio encabezado (no la seccion anterior) para que la separacion entre
 * bloques sea siempre la misma sin depender de quien vino antes.
 */
export default function SectionHeader({ title, subtitle, action, first = false }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: first ? 0 : 4, mb: 2 }}
        >
            <Box>
                <Typography variant="h3">{title}</Typography>
                {subtitle && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
    );
}
