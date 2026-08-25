import { Box, Card, CardContent } from '@mui/material';
import ThemeToggle from '@/Components/design/ThemeToggle';

/**
 * Layout de las pantallas sin sesion (login, registro, recuperar clave).
 *
 * Usa los mismos tokens que el resto de la app: antes era markup de Breeze con
 * `bg-gray-100` y `bg-white` fijos, que no acompanaban el modo oscuro.
 */
export default function Guest({ children }) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                position: 'relative',
                // Halo suave detras de la tarjeta para que no flote sobre un plano vacio
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(680px, 90vw)',
                    height: 480,
                    background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 70%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <ThemeToggle />
            </Box>

            <Card sx={{ width: '100%', maxWidth: 440, position: 'relative' }}>
                <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                    {children}
                </CardContent>
            </Card>
        </Box>
    );
}
