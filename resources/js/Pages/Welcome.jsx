import { Link, Head } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import { t } from '@/i18n';

export default function Welcome({ auth }) {

    return (
        <>
            <Head title={t("Welcome")} />
        </>
    );
}
