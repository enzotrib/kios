import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { t } from '@/i18n';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('Reset Password')} />

            <Typography variant="h4" sx={{ mb: 3 }}>
                {t('Reset Password')}
            </Typography>

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
                        autoComplete="new-password"
                        autoFocus
                        fullWidth
                        size="medium"
                    />

                    <TextField
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        label={t('Confirm Password')}
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
                        {processing ? t('Loading...') : t('Reset Password')}
                    </Button>
                </Stack>
            </Box>
        </GuestLayout>
    );
}
