import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
     Grid,
    Divider,
    MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { useCurrencyStore } from "@/stores/currencyStore";
import { t } from '@/i18n';
export default function DailyCashDialog({
    open,
    setOpen,
    stores,
    refreshTransactions,
    auth
}) {
    const { settings: currencySettings } = useCurrencyStore();
    const initialFormState = {
        amount: 0,
        transaction_date: dayjs().format("YYYY-MM-DD"), // Today's date in 'YYYY-MM-DD' format
        description: "",
        store_id: auth.store_id,
        transaction_type: "deposit", // Added transaction_type
    };

    const [formState, setFormState] = useState(initialFormState);
    const [loading, setLoading] = useState(false);

    // Handle closing of the dialog
    const handleClose = () => {
        setOpen(false);
    };

    // Handle changes in the form fields
    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormState({
            ...formState,
            [name]: value,
        });
    };

    // Handle form submission
    const handleSubmit = (event) => {
        event.preventDefault();
        if (loading) return;
        setLoading(true);
        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        let url = "/reports/dailycash"; // Assuming your endpoint is '/transaction'

        // Send the POST request to save the transaction
        axios
            .post(url, formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                refreshTransactions(window.location.pathname);
                setFormState(initialFormState);
                setOpen(false);
            })
            .catch((error) => {
                console.error("Submission failed with errors:", error);
                console.log(formJson);
            }).finally(() => {
                setLoading(false); // Reset submitting state
            });
    };

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"sm"}
                open={open}
                onClose={handleClose}
                aria-labelledby="transaction-dialog-title"
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleSubmit,
                    }
                }}
            >
                <DialogTitle id="transaction-dialog-title">
                    {t("ADD CASH LOG")}
                </DialogTitle>
                <IconButton
                    aria-label={t("close")}
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.text.secondary,
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                name="amount"
                                label={t("Amount")}
                                variant="outlined"
                                autoFocus
                                required
                                sx={{ input: { fontWeight: "bold" } }}
                                value={formState.amount}
                                onChange={handleFieldChange}
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {currencySettings.currency_symbol}
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label={t("Date")}
                                name="transaction_date"
                                fullWidth
                                type="date"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={formState.transaction_date}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                select
                                label={t("Transaction Type")}
                                name="transaction_type"
                                fullWidth
                                value={formState.transaction_type}
                                required
                                onChange={(e) => {
                                    const { name, value } = e.target;
                                    const currentTime = dayjs().format('h:mm A');
                                    // Set default description based on transaction type
                                    let defaultDescription = "";
                                    if (e.target.value === "open_cashier") {
                                        defaultDescription = "Opening Cashier Balance - " + currentTime;
                                    } else if (e.target.value === "close_cashier") {
                                        defaultDescription = "Closing Cashier Balance - " + currentTime;
                                    } else defaultDescription = '';

                                    setFormState({
                                        ...formState,
                                        [name]: value,
                                        description: defaultDescription,
                                    });
                                }}
                            >
                                <MenuItem value="deposit">{t("Deposit")}</MenuItem>
                                <MenuItem value="withdrawal">
                                    {t("Withdrawal")}
                                </MenuItem>
                                <MenuItem value="open_cashier">{t("Open Cashier")}</MenuItem>
                                <MenuItem value="close_cashier">{t("Close Cashier")}</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={t("Description")}
                                name="description"
                                value={formState.description}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                value={formState.store_id}
                                label={t("Store")}
                                onChange={handleFieldChange}
                                required
                                name="store_id"
                                select
                                fullWidth
                            >
                                {stores?.map((store) => (
                                    <MenuItem
                                        key={store.id}
                                        value={store.id}
                                    >
                                        {store.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Divider sx={{ py: "0.5rem" }}></Divider>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        disabled={
                            formState.amount === 0 ||
                            !formState.transaction_type || loading
                        }
                    >
                        {loading ? 'Loading...' : 'SAVE'}

                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
