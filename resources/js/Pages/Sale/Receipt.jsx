import React from "react";
import { Head } from "@inertiajs/react";
import { ReceiptDisplay } from "./ReceiptDisplay";
import { t } from '@/i18n';

export default function Receipt({ sale, salesItems, settings, user_name, credit_sale = false }) {

    return (
        <>
            <Head title={t("Sale Receipt")} />
            <ReceiptDisplay
                sale={sale}
                salesItems={salesItems}
                settings={settings}
                user_name={user_name}
                credit_sale={credit_sale}
                autoTriggerPrint={false}
                hideActionButtons={false}
            />
        </>
    );
}
