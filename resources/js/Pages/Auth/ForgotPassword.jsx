import { Box, Button, Stack, TextField, Typography, Alert } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { t } from '@/i18n';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title={t('Forgot Password')} />

            <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h4">{t('Forgot Password')}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.')}
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
                        type="email"
                        label={t('Email')}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        autoComplete="username"
                        autoFocus
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
                        {processing ? t('Loading...') : t('Email Password Reset Link')}
                    </Button>

                    {/* Volver al login: accion terciaria */}
                    <Button
                        component={Link}
                        href={route('login')}
                        variant="text"
                        size="small"
                        startIcon={<ArrowLeft size={16} />}
                    >
                        {t('Back')}
                    </Button>
                </Stack>
            </Box>
        </GuestLayout>
    );
}
