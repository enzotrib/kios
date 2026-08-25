import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    MenuItem,
    TextField,
    Chip,
    IconButton
} from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import dayjs from "dayjs";
import Select2 from '@/Components/design/Select';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Swal from "sweetalert2";
import { useCurrencyFormatter } from '@/lib/currencyFormatter';

import CustomPagination from "@/Components/CustomPagination";
import ViewDetailsDialog from "@/Components/ViewDetailsDialog";
import { t } from '@/i18n';
import DataTable from '@/Components/design/DataTable';

const columns = (handleRowClick, formatCurrency) => [
    {
        field: "id", headerName: t("ID"), width: 80,
        renderCell: (params) => {
            return params.value.toString().padStart(4, "0");
        },
    },
    {
        field: "transaction_date",
        headerName: t("Date"),
        width: 100,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return dayjs(params.value).format("YYYY-MM-DD");
        },
    },
    {
        field: "transaction_type", headerName: t("Type"), width: 100,
        renderCell: (params) => {
            return params.value.toUpperCase();
        },
    },
    { field: "contact_name", headerName: t("Customer Name"), width: 200 },
    {
        field: "reference_id",
        headerName: t("Reference"),
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
            if (params.value === null) {
                return "N/A"; // Or any other suitable message for null values
            }
            return (
                <Button variant="text" onClick={() => handleRowClick("view_details", params.value)}>
                    {"#" + params.value.toString().padStart(4, "0")}
                </Button>
            );
        },
    },
    { field: "payment_method", headerName: t("Payment Method"), width: 150 },
    { field: "note", headerName: t("Note"), width: 100 },
    {
        field: "amount", headerName: t("Total Amount"), width: 120, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return formatCurrency(params.value, false);
        },
    },
    {
        field: "actions",
        headerName: t("Actions"),
        width: 100,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return (
                <>
                    <IconButton disabled={params.row.payment_method === 'Credit' || params.row.parent_id !== null} color="error" onClick={() => handleRowClick('delete', params.row.id)}>
                        <HighlightOffIcon />
                    </IconButton>
                </>
            )
        },
    },
];

export default function Payment({ payments, transactionType, contacts, selected_contact }) {
    const formatCurrency = useCurrencyFormatter();
    const [dataPayments, setDataPayments] = useState(payments);
    const [paymentSelect, setPaymentSelect] = useState(transactionType);
    const [totalAmount, setTotalAmount] = useState(0)
    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        payment_method: 'All',
        store: 0,
        per_page: 100,
        contact_id: selected_contact
    });

    const handleRowClick = (type, id) => {
        if (type == 'delete') {
            Swal.fire({
                title: "Do you want to remove the payment?",
                showDenyButton: true,
                confirmButtonText: "YES",
                denyButtonText: `NO`,
            }).then((result) => {
                if (result.isConfirmed) {
                    axios.post(`/delete-payment/${transactionType}`, { transaction_id: id })
                        .then((response) => {
                            const updatedData = dataPayments.data.filter((item) => item.id !== id);
                            setDataPayments({ ...dataPayments, data: updatedData });
                            Swal.fire({
                                title: "Success!",
                                text: response.data.message,
                                icon: "success",
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: true,
                            });
                        })
                        .catch((error) => {
                            Swal.fire({ title: error.response.data.error, showConfirmButton: true, icon: "error", })
                            console.error("Deletion failed with errors:", error);
                        });
                }
            });
        } else if (type == 'view_details') {
            setSelectedTransaction(id);
            setViewDetailsModalOpen(true);
        }
    };

    const refreshPayments = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["payments"], // Only reload specified properties
            onSuccess: (response) => {
                setDataPayments(response.props.payments);
            },
        };
        router.get(url, searchTerms,
            options);
    };

    const handleSelectPayments = (type) => {
        setPaymentSelect(type);
        if (type == "sales") router.get("/payments/sales?page=1");
        if (type == "purchases") router.get("/payments/purchases?page=1");
    };

    useEffect(() => {
        const total = Object.values(dataPayments.data).reduce((accumulator, current) => {
            return accumulator + parseFloat(current.amount);
        }, 0);
        setTotalAmount(total);
    }, [dataPayments]);

    const handleSearchChange = (input) => {
        if (input?.target) {
            // Handle regular inputs (e.g., TextField)
            const { name, value } = input.target;
            setSearchTerms((prev) => ({ ...prev, [name]: value }));
        } else {
            // Handle Select2 inputs (e.g., contact selection)
            setSearchTerms((prev) => ({
                ...prev,
                contact_id: input?.id, // Store selected contact or null
            }));
        }
    };

    useEffect(() => {
        refreshPayments(window.location.pathname);
    }, [searchTerms]);

    return (
        <AuthenticatedLayout>
            <Head title={t("Payments")} />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%", justifyContent: "end" }}
                size={12}
            >

                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        value={paymentSelect}
                        label={t("Select payments")}
                        onChange={(e) => handleSelectPayments(e.target.value)}
                        required
                        name="payment_type"
                        fullWidth
                        select
                        size="small"
                    >
                        <MenuItem value={"sales"}>{t("Sales Payment")}</MenuItem>
                        <MenuItem value={"purchases"}>
                            {t("Purchase Payment")}
                        </MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                    <Select2
                        className="w-full"
                        placeholder={t("Select a contact...")}
                        options={contacts}
                        onChange={(selectedOption) => handleSearchChange(selectedOption)}
                        isClearable
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                    ></Select2>
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        value={searchTerms.payment_method}
                        label={t("Select Payment Method")}
                        onChange={handleSearchChange}
                        required
                        name="payment_method"
                        size="small"
                        select
                        fullWidth
                    >
                        <MenuItem value={"All"}>{t("All")}</MenuItem>
                        <MenuItem value={"Cash"}>{t("Cash")}</MenuItem>
                        <MenuItem value={"Card"}>{t("Card")}</MenuItem>
                        <MenuItem value={"Credit"}>{t("Credit")}</MenuItem>
                        <MenuItem value={"Cheque"}>{t("Cheque")}</MenuItem>
                        <MenuItem value={"Account Balance"}>{t("Account Balance")}</MenuItem>
                        <MenuItem value={"Account"}>{t("Account")}</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label={t("Start Date")}
                        name="start_date"
                        placeholder={t("Start Date")}
                        fullWidth
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.start_date}
                        onChange={handleSearchChange}
                        required
                    />
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label={t("End Date")}
                        name="end_date"
                        placeholder={t("End Date")}
                        fullWidth
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.end_date}
                        onChange={handleSearchChange}
                        required
                    />
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: '73vh' }}
            >
                <DataTable
                    rows={dataPayments?.data}
                    columns={columns(handleRowClick, formatCurrency)}
                    hideFooter
                />
            </Box>
            <Grid size={12} container spacing={2} sx={{ justifyContent: "end", alignItems: "center" }}>
                <Chip label={'Total: ' + formatCurrency(totalAmount, false)} color="primary" />
                <CustomPagination
                    refreshTable={refreshPayments}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataPayments}
                ></CustomPagination>
            </Grid>

            {viewDetailsModalOpen && (
                <ViewDetailsDialog
                    open={viewDetailsModalOpen}
                    setOpen={setViewDetailsModalOpen}
                    type={"sale"}
                    selectedTransaction={selectedTransaction}
                />
            )}
        </AuthenticatedLayout>
    );
}
