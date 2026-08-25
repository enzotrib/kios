import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import brandLogo from '@/kios-logo.jpg';
import { t } from '@/i18n';

export default function Login({ status, canResetPassword, version }) {
    const shopName = usePage().props.settings?.shop_name;
    const shopLogo = usePage().props.settings?.shop_logo;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('Log in')} />

            {/* Logo del comercio si ya fue cargado; si no, el de la app */}
            <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
                <Box
                    component="img"
                    src={shopLogo || brandLogo}
                    alt={shopName || 'KIOS'}
                    sx={{ height: 56, objectFit: 'contain', maxWidth: '100%' }}
                />
                <Typography variant="h3" sx={{ textAlign: 'center' }}>
                    {shopName || 'KIOS'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('Log in')}
                </Typography>
            </Stack>

            {status && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {status}
                </Alert>
            )}

            <Box component="form" onSubmit={submit}>
                <Stack spacing={2.5}>
                    <TextField
                        id="email"
                        name="email"
                        type="text"
                        label={t('Email or User name')}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        autoComplete="username"
                        autoFocus
                        fullWidth
                        size="medium"
                    />

                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        label={t('Password')}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={Boolean(errors.password)}
                        helperText={errors.password}
                        autoComplete="current-password"
                        fullWidth
                        size="medium"
                    />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {t('Remember me')}
                                </Typography>
                            }
                        />

                        {/* Accion terciaria (action/background/tertiary): sin fondo
                            ni borde, pero con area de click propia. */}
                        {canResetPassword && (
                            <Button
                                component={Link}
                                href={route('password.request')}
                                variant="text"
                                size="small"
                            >
                                {t('Forgot your password?')}
                            </Button>
                        )}
                    </Stack>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={processing}
                    >
                        {processing ? t('Loading...') : t('Log in')}
                    </Button>
                </Stack>
            </Box>

            <Stack
                alignItems="center"
                spacing={1.5}
                sx={{ mt: 5, pt: 3, borderTop: '1px solid var(--border)' }}
            >
                <Typography variant="caption" sx={{ textAlign: 'center' }}>
                    {t('info shop version')} {version}
                    <br />
                    {t('Developed by: infomax')}
                </Typography>


            </Stack>
        </GuestLayout>
    );
}
