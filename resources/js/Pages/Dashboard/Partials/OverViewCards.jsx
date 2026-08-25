import { Box } from "@mui/material"
import { ChartLine, Package, PackageCheck, User } from "lucide-react"
import { usePage } from "@inertiajs/react"
import StatCard from "@/Components/design/StatCard"
import { t } from '@/i18n';

export function OverViewCards() {
    const { data } = usePage().props;
    const auth = usePage().props.auth.user;

    if (auth.user_role !== "admin" && auth.user_role !== "super-admin") return null;

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
        >
            <StatCard
                label={t("Total Items")}
                value={data.totalItems}
                icon={Package}
                tone="primary"
                footer={`${data.totalQuantities} ${t("QTY")}`}
            />
            <StatCard
                label={t("Total valuation")}
                value={data.totalValuation}
                money
                icon={ChartLine}
                tone="warning"
            />
            <StatCard
                label={t("Sold Items")}
                value={data.soldItems}
                icon={PackageCheck}
                tone="success"
                onClick={() => window.location.href = route('sales.items.summary')}
            />
            <StatCard
                label={t("Customer balance")}
                value={data.customerBalance}
                money
                icon={User}
                tone="danger"
            />
        </Box>
    )
}
