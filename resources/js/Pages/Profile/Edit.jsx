import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';
import { t } from '@/i18n';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-[var(--foreground)] leading-tight">{t("Profile")}</h2>}
        >
            <Head title={t("Profile")} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-[var(--card)] shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-[var(--card)] shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {/* <div className="p-4 sm:p-8 bg-[var(--card)] shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div> */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
