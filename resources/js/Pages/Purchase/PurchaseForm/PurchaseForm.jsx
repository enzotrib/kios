import * as React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect, useContext } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Divider,
    Typography,
     Grid,
    InputLabel,
    IconButton,
    Autocomplete,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Breadcrumbs
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import Swal from "sweetalert2";
import axios from "axios";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ContactFormModal from "@/Pages/Contact/Partial/FormDialog";
import ProductSearch from "./ProductSearch";
import PurchaseCartItems from "./PurchaseCartItems";
import PaymentsCheckoutDialog from "@/Components/PaymentsCheckoutDialog";
import PurchaseAppBar from "./PurchaseAppBar";
import dayjs from 'dayjs';

import { usePurchase } from "@/Context/PurchaseContext";
import { SharedContext } from "@/Context/SharedContext";
import { t } from '@/i18n';

export default function PurchaseForm({ vendors, purchase, stores }) {
    const { cartState, cartTotal, } = usePurchase();
    const { selectedVendor, setSelectedVendor } = useContext(SharedContext);

    const [open, setOpen] = useState(false);
    const [vendorList, setvendorList] = useState(vendors);
    const [openPayment, setOpenPayment] = useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    //   Set selectedVendor state after form success
    const handleFormSuccess = (contact) => {
        setvendorList((prevvendors) => {
            // Create the new vendor object
            const newvendor = {
                id: contact.id,
                name: contact.name,
                balance: contact.balance,
            };

            // Update the vendor list
            const updatedvendorList = [...prevvendors, newvendor];

            // Select the newly added vendor directly
            setSelectedVendor(newvendor); // Set selected vendor to the new vendor

            return updatedvendorList; // Return the updated list
        });
    };

    useEffect(() => {
        if (vendorList) {
            const initialvendor = vendorList.find((vendor) => vendor.id === 1);
            setSelectedVendor(initialvendor || null);
        }
    }, [vendors]);

    useEffect(() => {

    }, [cartState]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(submittedFormData.entries());
        formJson.cartItems = cartState
        formJson.total_amount = cartTotal
        formJson.amount_paid = cartTotal

        axios.post('/purchase/store', formJson)
        .then((resp) => {
            Swal.fire({
                title: "Success!",
                text: resp.data.message,
                icon: "success",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });     
        })
        .catch((error) => {
            console.error("Submission failed with errors:", error);
            console.log(formJson);
        });
    }

    const [purchaseForm, setPurchaseForm] = useState({
        store_id: stores[0].id,
        reference_no: '',
        purchase_date: dayjs().format('YYYY-MM-DD'), // default to today's date
    });

      // Handle changes for store, reference_no, and purchase_date
    const handlePurchaseForm = (e) => {
        const { name, value } = e.target;

        // Update the purchaseData state dynamically based on field name
        setPurchaseForm({
        ...purchaseForm,
        [name]: value, // Dynamically update the state based on input name
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={t("Add Purchase")} />

            <Box className="mb-10">
                <Breadcrumbs aria-label={t("breadcrumb")}>
                    <Link
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center" }}
                        color="inherit"
                        href="/"
                    >
                        <HomeIcon
                            sx={{ mr: 0.5, mb: "3px" }}
                            fontSize="inherit"
                        />
                        {t("Home")}
                    </Link>
                    <Link underline="hover" color="inherit" href="/purchases">
                        {t("Purchases")}
                    </Link>
                    <Typography sx={{ color: "text.primary" }}>
                        {purchase ? "Edit Product" : "Add Purchase"}
                    </Typography>
                </Breadcrumbs>
            </Box>

            <form
                id="purchase-form"
                encType="multipart/form-data"
                onSubmit={handleSubmit}
            >
                <Grid container spacing={2}>
                    <Grid size={3}>
                        <FormControl fullWidth>
                            <InputLabel>{t("Store")}</InputLabel>
                            <Select
                                value={purchaseForm.store_id}
                                label={t("Store")}
                                onChange={handlePurchaseForm}
                                required
                                name="store_id"
                            >
                                {stores.map((store) => (
                                    <MenuItem key={store.id} value={store.id}>
                                        {store.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={2}>
                        <TextField
                            label={t("Reference No")}
                            name="reference_no"
                            value={purchaseForm.reference_no}
                            onChange={handlePurchaseForm}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid size={3}>
                        <TextField
                            label={t("Purchase Date")}
                            name="purchase_date"
                            placeholder={t("Purchase Date")}
                            fullWidth
                            type="date"
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            value={purchaseForm.purchase_date}
                            onChange={handlePurchaseForm}
                            required
                        />
                    </Grid>
                    <Grid size={4} className="flex items-center">
                        {Array.isArray(vendorList) && (
                            <Autocomplete
                                disablePortal
                                // sx={{width:'300px'}}
                                options={vendorList}
                                fullWidth
                                required
                                value={selectedVendor || null}
                                getOptionKey={(option) => option.id}
                                getOptionLabel={(option) =>
                                    typeof option === "string"
                                        ? option
                                        : option.name +
                                          " | " +
                                          parseFloat(option.balance).toFixed(2)
                                }
                                onChange={(event, newValue) => {
                                    setSelectedVendor(newValue);
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label={t("Vendor")} />
                                )}
                            />
                        )}
                        <IconButton
                            onClick={() => setOpen(true)}
                            sx={{
                                ml: "1rem",
                                bgcolor: 'var(--success)',
                                width: "50px",
                                height: "50px",
                                color: 'var(--primary-foreground)',
                                "&:hover": {
                                    bgcolor: "success.dark", // Change the background color on hover
                                },
                            }}
                        >
                            <PersonAddIcon fontSize="inherit" />
                        </IconButton>
                        <ContactFormModal
                            open={open}
                            handleClose={handleClose}
                            onSuccess={handleFormSuccess}
                            contactType={"vendor"}
                        />
                    </Grid>
                </Grid>
            </form>

            <Divider sx={{ my: "1rem" }} />
            <ProductSearch></ProductSearch>
            <Divider sx={{ my: "1rem" }} />
            
            <PurchaseCartItems />

            <PurchaseAppBar setOpenPayment={setOpenPayment} selectedVendor={selectedVendor} disable={!purchaseForm.reference_no}></PurchaseAppBar>
            <PaymentsCheckoutDialog
                open={openPayment}
                setOpen={setOpenPayment}
                useCart={usePurchase}
                selectedContact={selectedVendor}
                formData={purchaseForm}
            />
            
        </AuthenticatedLayout>
    );
}
