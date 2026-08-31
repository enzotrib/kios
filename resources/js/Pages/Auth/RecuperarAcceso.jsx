import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { ArrowLeft, Copy, Check, FolderOpen } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

/**
 * Recuperar el acceso en la aplicación de escritorio.
 *
 * Acá no hay correo ni tiene por qué haber internet, así que el camino es un
 * código que está escrito en un archivo dentro de la carpeta de datos del
 * comercio. Poder abrir esa carpeta es la prueba de que la persona tiene la
 * computadora, no sólo la aplicación abierta en el mostrador.
 *
 * Todo el texto va en castellano directo, sin pasar por t(): esta pantalla
 * sólo existe en el paquete de escritorio, que es en castellano.
 */
export default function RecuperarAcceso({ carpeta, archivo, hayArchivo, estado }) {
    const [copiado, setCopiado] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        codigo: '',
        password: '',
        password_confirmation: '',
    });

    const copiarLaRuta = async () => {
        try {
            await navigator.clipboard.writeText(carpeta);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            // Sin portapapeles la ruta igual está a la vista para copiarla a mano.
        }
    };

    const enviar = (e) => {
        e.preventDefault();
        post(route('recuperacion.restablecer'));
    };

    return (
        <GuestLayout>
            <Head title="Recuperar el acceso" />

            <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h4">Recuperar el acceso</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Para poner una contraseña nueva necesitás el código de recuperación.
                    Está en un archivo, en esta misma computadora. No se pierde ningún dato.
                </Typography>
            </Stack>

            {estado && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {estado}
                </Alert>
            )}

            {/* Dónde encontrar el código. Es el paso que la gente no adivina,
                así que va primero y con la ruta copiable de un toque. */}
            <Paper
                variant="outlined"
                sx={{ p: 2.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2 }}
            >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <FolderOpen size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            Dónde está el código
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                            Abrí esta carpeta en el Explorador de Windows y abrí el archivo{' '}
                            <strong>{archivo}</strong>. El código está adentro.
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 12.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                overflowWrap: 'anywhere',
                                mb: 1,
                            }}
                        >
                            {carpeta}
                        </Typography>

                        <Button
                            onClick={copiarLaRuta}
                            variant="text"
                            size="small"
                            startIcon={copiado ? <Check size={15} /> : <Copy size={15} />}
                        >
                            {copiado ? 'Copiada' : 'Copiar la ruta'}
                        </Button>
                    </Box>
                </Stack>
            </Paper>

            {!hayArchivo && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        No encontramos ese archivo. Si anotaste el código en un papel,
                        escribilo igual acá abajo: sigue sirviendo.
                    </Typography>
                    <Button
                        onClick={() => router.post(route('recuperacion.regenerar'))}
                        variant="text"
                        size="small"
                    >
                        No lo tengo — escribir un código nuevo
                    </Button>
                </Alert>
            )}

            <Box component="form" onSubmit={enviar}>
                <Stack spacing={2.5}>
                    <TextField
                        id="codigo"
                        name="codigo"
                        label="Código de recuperación"
                        placeholder="XXXX-XXXX-XXXX"
                        value={data.codigo}
                        onChange={(e) => setData('codigo', e.target.value)}
                        error={Boolean(errors.codigo)}
                        helperText={errors.codigo}
                        autoFocus
                        fullWidth
                        size="medium"
                        inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }}
                    />

                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        label="Contraseña nueva"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={Boolean(errors.password)}
                        helperText={errors.password || 'Ocho caracteres como mínimo'}
                        autoComplete="new-password"
                        fullWidth
                        size="medium"
                    />

                    <TextField
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        label="Repetí la contraseña nueva"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={Boolean(errors.password_confirmation)}
                        helperText={errors.password_confirmation}
                        autoComplete="new-password"
                        fullWidth
                        size="medium"
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={processing}
                    >
                        {processing ? 'Cambiando…' : 'Cambiar la contraseña y entrar'}
                    </Button>

                    <Button
                        component={Link}
                        href={route('login')}
                        variant="text"
                        size="small"
                        startIcon={<ArrowLeft size={16} />}
                    >
                        Volver
                    </Button>
                </Stack>
            </Box>
        </GuestLayout>
    );
}
