import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Grid from '@mui/material/Grid';
import { Button, Box, TextField, IconButton, Alert, AlertTitle, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from "@mui/icons-material/Print";
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import numeral from 'numeral';
import { DataGrid } from '@mui/x-data-grid';
import FormDialog from './Partial/FormDialog';
import CustomPagination from '@/Components/CustomPagination';
import AddPaymentDialog from '@/Components/AddPaymentDialog';
import PaymentsIcon from "@mui/icons-material/Payments";
import { CircleXIcon } from 'lucide-react';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import Swal from 'sweetalert2';

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MobileContactsList from './Partial/MobileContactsList';
import { t } from '@/i18n';
import PageToolbar from '@/Components/design/PageToolbar';
import SearchField from '@/Components/design/SearchField';
import StatPill from '@/Components/design/StatPill';

const columns = (handleRowClick, handleDelete) => [
    { field: 'id', headerName: t("ID"), width: 80 },
    {
        field: 'name', headerName: t("Name"), width: 200,
        renderCell: (params) => (
            <Link underline="hover" href='#' className='hover:underline' onClick={(event) => { event.preventDefault(); handleRowClick(params.row, 'contact_edit'); }}>
                <p className='font-bold'>{params.value}</p>
            </Link>
        ),
    },
    {
        field: 'balance', headerName: t("Balance"), width: 160,
        valueGetter: (value) => parseFloat(value),
        renderCell: (params) => (
            <Button
                onClick={() => handleRowClick(params.row, "add_payment")}
                variant="text"
                fullWidth
                sx={{
                    textAlign: "left",
                    fontWeight: "bold",
                    justifyContent: "flex-end",
                }}
            >
                {numeral(params.value).format('0,00.00')}
            </Button>
        ),
    }, // Added balance
    { field: 'phone', headerName: t("Phone"), width: 120 },
    { field: 'whatsapp', headerName: t("Whatsapp"), width: 120 },
    { field: 'email', headerName: t("Email"), width: 100 },
    { field: 'address', headerName: t("Address"), width: 200 }, // Changed from collection_type to address
    { field: 'created_at', headerName: t("Created At"), width: 100 },
    {
        field: "action",
        headerName: t("Actions"),
        width: 220,
        renderCell: (params) => {
            const basePath = params.row.type === 'vendor' ? '/purchases' : '/sales';
            const paymentsPath = params.row.type === 'vendor' ? '/purchases' : '/sales';
            return (
                <>
                    <Link href={"/reports/" + params.row.id + '/' + params.row.type}>
                        <Tooltip title={t("REPORT")}>
                            <IconButton color="primary">
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                    </Link>

                    {params.row.type === "customer" && (
                        <Link href={"/pending-sales-receipt/" + params.row.id}>
                            <Tooltip title={t("PENDING RECEIPT")}>
                                <IconButton color="primary">
                                    <PendingActionsIcon />
                                </IconButton>
                            </Tooltip>

                        </Link>
                    )}

                    {/* Sales or Purchase Link */}
                    <Link href={`${basePath}?contact_id=${params.row.id}&end_date=&query=&start_date=&status=pending&store=0`}>
                        <Tooltip title={t("CREDIT SALE")}>
                            <IconButton color="alert">
                                <HourglassTopIcon />
                            </IconButton>
                        </Tooltip>
                    </Link>

                    {/* Sales or Purchase Link */}
                    <Link href={`/payments${basePath}?contact_id=${params.row.id}&store=0`}>
                        <Tooltip title={t("PAYMENTS")}>
                            <IconButton>
                                <PaymentsIcon />
                            </IconButton>
                        </Tooltip>
                    </Link>

                    <Tooltip title={t("DELETE")}>
                        <IconButton
                            color="error"
                            onClick={() => handleDelete(params.row.id, params.row.name)}
                        >
                            <CircleXIcon />
                        </IconButton>
                    </Tooltip>
                </>
            )
        },
    },
];

export default function Contact({ contacts, type, stores }) {
    const [open, setOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    const [dataContacts, setDataContacts] = useState(contacts);
    const [totalBalance, setTotalBalance] = useState(0);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [searchTerms, setSearchTerms] = useState({
        per_page: 100,
        search_query: "",
    });

    const handleClickOpen = () => {
        setSelectedContact(null);
        setOpen(true);
    };

    const handleRowClick = (contact, funcmethod) => {
        setSelectedContact(contact);
        if (funcmethod == 'contact_edit') setOpen(true);
        else if (funcmethod == 'add_payment') {
            setPaymentModalOpen(true)
        }
    };

    const handleClose = () => {
        setSelectedContact(null);
        setOpen(false);
    };

    const handleDelete = async (contactId, contactName) => {
        const result = await Swal.fire({
            title: 'Delete Contact?',
            text: `Are you sure you want to delete "${contactName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.delete(`/contact/${contactId}`);

                if (response.data.status === 'success') {
                    Swal.fire(
                        'Deleted!',
                        'Contact has been deleted successfully.',
                        'success'
                    );
                    refreshContacts(window.location.pathname);
                } else {
                    Swal.fire(
                        'Error!',
                        response.data.message || 'Failed to delete contact.',
                        'error'
                    );
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'An error occurred while deleting the contact.';
                Swal.fire(
                    'Error!',
                    errorMessage,
                    'error'
                );
            }
        }
    };

    const refreshContacts = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["contacts"], // Only reload specified properties
            onSuccess: (response) => {
                setDataContacts(response.props.contacts);
            },
        };
        router.get(url, { ...searchTerms }, options);
    };

    useEffect(() => {
        refreshContacts(window.location.pathname);
    }, [searchTerms]);

    //   Reload the table after form success
    const handleFormSuccess = (contact) => {
        refreshContacts(window.location.pathname)
    };

    useEffect(() => {
        if (dataContacts) {
            // Calculate the total balance from dataContacts
            const sum = Object.values(dataContacts.data).reduce(
                (acc, contact) => acc + parseFloat(contact.balance),
                0
            );
            setTotalBalance(sum);
        }
    }, [dataContacts]);

    // El original hacia type[0].toUpperCase() + type.slice(1), que devuelve
    // "Vendor"/"Customer" en ingles sin pasar por el diccionario.
    const label = type === 'vendor' ? t('Vendor') : t('Customer');

    return (
        <AuthenticatedLayout>
            {/* Capitalize first letter of type and add s at the end */}
            <Head title={type === "vendor" ? t("Suppliers") : t("Customers")} />

            <PageToolbar>
                <StatPill
                    label={t("Balance:")}
                    value={totalBalance}
                    money
                    tone={parseFloat(totalBalance) < 0 ? "danger" : "neutral"}
                />

                <SearchField
                    name="search_query"
                    value={searchTerms?.search_query}
                    onChange={(e) => setSearchTerms((prev) => ({ ...prev, search_query: e.target.value }))}
                    placeholder={t("Search...")}
                />

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleClickOpen}
                >
                    {t("Add")} {label}
                </Button>
            </PageToolbar>

            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%" }}
            >

                {!isMobile && (
                    <Box
                        className="py-6 w-full"
                        sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 240px)", }}
                    >
                        <DataGrid
                            rows={dataContacts.data}
                            columns={columns(handleRowClick, handleDelete)}
                            getRowId={(row) => row.id}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            initialState={{
                                columns: {
                                    columnVisibilityModel: {
                                        // Hide columns status and traderName, the other columns will remain visible
                                        address: false,
                                        email: false,
                                        created_at: false,
                                    },
                                },
                            }}
                            hideFooter
                        />
                    </Box>
                )}

                {isMobile && (
                    <MobileContactsList contacts={dataContacts.data} handleContactEdit={handleRowClick} handleDelete={handleDelete} />
                )}

                <Grid size={12} container sx={{ justifyContent: "end" }}>
                    <CustomPagination
                        refreshTable={refreshContacts}
                        setSearchTerms={setSearchTerms}
                        searchTerms={searchTerms}
                        data={dataContacts}
                    ></CustomPagination>
                </Grid>
            </Grid>

            <FormDialog
                open={open}
                handleClose={handleClose}
                contact={selectedContact}
                contactType={type}
                onSuccess={handleFormSuccess}
            />
            <AddPaymentDialog
                open={paymentModalOpen}
                setOpen={setPaymentModalOpen}
                selectedContact={selectedContact?.id}
                is_customer={type === "customer" ? true : false}
                stores={stores}
                refreshTable={refreshContacts}
            />
        </AuthenticatedLayout>
    );
}
