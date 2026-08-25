import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { Link } from "@inertiajs/react";
import {
    Button,
    Box,
    AppBar,
    Toolbar,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

import { usePurchase } from "@/Context/PurchaseContext";
import { t } from '@/i18n';

export default function PurchaseAppBar({setOpenPayment, selectedVendor, disable=true}) {
    const { cartState, cartTotal, } = usePurchase();

    return (
            <AppBar
                position="fixed"
                variant="contained"
                sx={{ top: "auto", bottom: 0 }}
            >
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }} />
                    <Link underline="hover" color="inherit" href="/purchases">
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<ArrowBackIosNewIcon />}
                            sx={{ mr: "1rem" }}
                        >
                            {t("BACK")}
                        </Button>
                    </Link>

                    <Button
                        variant="contained"
                        type="submit"
                        endIcon={<PaymentsIcon />}
                        onClick={() => setOpenPayment(true)}
                        disabled={cartState.length === 0 || !selectedVendor || disable}
                    >
                        {t("PAYMENTS")}
                    </Button>
                </Toolbar>
            </AppBar>
    );
}
