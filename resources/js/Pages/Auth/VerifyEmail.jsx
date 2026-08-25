import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { t } from '@/i18n';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t("Email Verification")} />

            <div className="mb-4 text-sm text-[var(--muted-foreground)]">
                {t("Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we will gladly send you another.")}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 font-medium text-sm text-[var(--success)]">
                    {t("A new verification link has been sent to the email address you provided during registration.")}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>{t("Resend Verification Email")}</PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="underline text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {t("Log Out")}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
