import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, Box, TextField, Tooltip, MenuItem, Chip, IconButton } from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import Select2 from '@/Components/design/Select';
import numeral from "numeral";

import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import CustomPagination from "@/Components/CustomPagination";
import { t } from '@/i18n';
import SearchField from '@/Components/design/SearchField';
import DataTable from '@/Components/design/DataTable';

const columns = () => [
    {
        field: "id",
        headerName: t("ID"),
        width: 80,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return "#" + params.value.toString().padStart(4, "0");
        },
    },
    {
        field: "contact_name", headerName: t("Customer Name"), width: 200,
        renderCell: (params) => (
            <Tooltip title={'' + params.row.balance} arrow>
                <Button>{params.value}</Button>
            </Tooltip>
        ),
    },
    { field: 'barcode', headerName: t("Barcode"), width: 200, selector: row => row.barcode, sortable: true, hideable: true },
    { field: "product_name", headerName: t("Product Name"), width: 200, },
    {
        field: "quantity", headerName: t("Quantity"), width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "discount", headerName: t("Unit Disc."), width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "unit_cost", headerName: t("Unit Cost"), width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "unit_price", headerName: t("Unit Price"), width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "profit", headerName: t("Profit"), width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: 'total',
        headerName: t("Total"),
        width: 120,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => {
            const total = (params.row.unit_price - params.row.discount) * params.row.quantity;

            if (total === 0) {
                return (
                    <span className="bg-green-600 text-white px-2 py-1 rounded-md">
                        {t("Free")}
                    </span>
                );
            }

            return numeral(total).format('0,0.00');
        },
    },
    // { field: 'profit_amount', headerName: 'Profit Amount', width: 120 },
    {
        field: "sale_date",
        headerName: t("Date"),
        width: 100,
    },
    {
        field: "action",
        headerName: t("Action"),
        width: 80,
        renderCell: (params) => {
            if (params.row.quantity < 0) return null;
            return (
                <Link href={`/pos/${params.row.sale_id}/return`}>
                    <IconButton color="primary">
                        <KeyboardReturnIcon />
                    </IconButton>
                </Link>
            );
        },
    },

];

export default function SoldItem({ sold_items, contacts }) {
    const [dataSoldItems, setDataSoldItems] = useState(sold_items);

    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        store: 0,
        contact_id: '',
        status: 'all',
        query: '',
        order_by: 'default',
        item_type: "all",
        per_page: 100,
    });

    const refreshSoldItems = (url = window.location.pathname) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["sold_items"], // Only reload specified properties
            onSuccess: (response) => {
                setDataSoldItems(response.props.sold_items);
            },
        };
        router.get(
            url, { ...searchTerms }, options
        );
    };

    const [initialized, setInitialized] = useState(false); //To avoid re fetch data on page load
        useEffect(() => {
            if (!initialized) {
                setInitialized(true);
                return; // Skip first run
            }
        refreshSoldItems(window.location.pathname);
    }, [searchTerms]);

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

    return (
        <AuthenticatedLayout>
            <Head title={t("Sold Items")} />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "end", width: "100%" }}
                size={12}
            >

                <Grid size={{ xs: 12, sm: 3 }}>
                    <Select2
                        className="w-full"
                        placeholder={t("Select a contact...")}
                        options={contacts} // Options to display in the dropdown
                        onChange={(selectedOption) => handleSearchChange(selectedOption)}
                        isClearable // Allow the user to clear the selected option
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                    ></Select2>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label={t("Start Date")}
                        name="start_date"
                        placeholder={t("Start Date")}
                        size="small"
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
                        size="small"
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

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label={t("Item type")}
                        name="item_type"
                        size="small"
                        fullWidth
                        value={searchTerms.item_type}
                        onChange={handleSearchChange}
                        required
                        select
                    >
                        <MenuItem value={'all'}>{t("All")}</MenuItem>
                        <MenuItem value={'regular'}>{t("Regular")}</MenuItem>
                        <MenuItem value={'free'}>{t("Free")}</MenuItem>
                        <MenuItem value={'return'}>{t("Return")}</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                    <SearchField
                        name="query"
                        placeholder={t("Search")}
                        value={searchTerms.query}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                refreshSoldItems(window.location.pathname);
                            }
                        }}
                    />
                </Grid>

                {/* <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Order By"
                        name="order_by"
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.order_by}
                        onChange={handleSearchChange}
                        required
                        select
                    >
                        <MenuItem value={'default'}>Default</MenuItem>
                        <MenuItem value={'top_sold'}>Top Sold</MenuItem>
                        <MenuItem value={'top_profit'}>Top Profit</MenuItem>
                        </TextField>
                </Grid> */}
                <Grid size={{ xs: 12, sm: 1 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<FindReplaceIcon />}
                        onClick={() => refreshSoldItems(window.location.pathname)}
                    >
                        {t("Refresh")}
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataTable
                    rows={dataSoldItems.data}
                    getRowId={(row) => row.id}
                    columns={columns()}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                        },
                    }}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                barcode: false,
                                profit: false,
                            },
                        },
                    }}
                    hideFooter
                />
            </Box>
            <Grid size={12} spacing={2} container sx={{ justifyContent: "end" }}>
                <Chip variant="outlined" label={t("Total results") + ': ' + dataSoldItems.total} />
                <Chip variant="outlined" label={t("Total quantity") + ': ' + dataSoldItems.data.reduce((sum, item) => sum + item.quantity, 0)} />

                <CustomPagination
                    refreshTable={refreshSoldItems}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataSoldItems}
                ></CustomPagination>
            </Grid>
        </AuthenticatedLayout>
    );
}
