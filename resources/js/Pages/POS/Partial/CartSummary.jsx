import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import { ListItem, TextField, Divider, Typography, Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSales as useCart } from '@/Context/SalesContext';
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useCurrencyFormatter } from '@/lib/currencyFormatter';
import { useCurrencyStore } from '@/stores/currencyStore';
import { t } from '@/i18n';

export default function CartSummary() {
    const { cartState, cartTotal, totalQuantity, charges, totalChargeAmount, finalTotal, discount, calculateChargeAmountWithDiscount, addCharge, removeCharge } = useCart();
    const { settings: currencySettings } = useCurrencyStore();
    const [availableCharges, setAvailableCharges] = useState([]);
    const [openChargesDialog, setOpenChargesDialog] = useState(false);
    const [selectedCharge, setSelectedCharge] = useState("");
    const formatCurrency = useCurrencyFormatter();

    // Calculate total charges reactively with discount
    const recalculatedTotalCharges = charges.reduce((sum, charge) => sum + calculateChargeAmountWithDiscount(charge), 0);

    // Calculate final total reactively with discount
    const reactiveeFinalTotal = (cartTotal - discount) + recalculatedTotalCharges;

    // Fetch active charges for the add dialog
    useEffect(() => {
        axios
            .get('/api/charges/active')
            .then((resp) => {
                setAvailableCharges(resp.data);
            })
            .catch((error) => {
                console.error('Failed to fetch charges:', error);
            });
    }, []);

    const getAvailableChargesToAdd = () => {
        const chargeIds = charges.map(c => c.id);
        return availableCharges.filter(charge => !chargeIds.includes(charge.id));
    };

    const handleAddCharge = () => {
        if (selectedCharge) {
            const charge = availableCharges.find(c => c.id === parseInt(selectedCharge));
            if (charge) {
                addCharge(charge);
                setSelectedCharge("");
                setOpenChargesDialog(false);
            }
        }
    };

    const handleRemoveCharge = (chargeId) => {
        removeCharge(chargeId);
    };

    const chargesAvailableToAdd = getAvailableChargesToAdd();

    return (
        <List sx={{ width: "100%", bgcolor: "background.paper", pb: 3 }}>
            <Divider
                sx={{
                    borderBottom: "2px dashed",
                    borderColor: "divider",
                    my: 1,
                }}
            />
            <ListItem
                secondaryAction={
                    <Typography variant="h5" color="initial" sx={{ fontSize: { sm: '1rem', xs: '1.2rem' } }}>
                        <strong>{cartState.length} {t("| Qty.")} {totalQuantity}</strong>
                    </Typography>
                }
            >
                <ListItemText primary={t("Total Items")} />
            </ListItem>

            {/* Subtotal */}
            <ListItem
                secondaryAction={
                    <Typography variant="h5" color="initial" sx={{ fontSize: { sm: '1rem', xs: '1.2rem' } }}>
                        <strong>{formatCurrency(cartTotal)}</strong>
                    </Typography>
                }
            >
                <ListItemText primary={t("Subtotal")} />
            </ListItem>

            <Divider sx={{ borderBottom: "1px dashed", borderColor: "divider", my: 1 }} />

            {/* Charges Section */}
            {charges.length > 0 && (
                <>
                    <Box sx={{ px: 2, py: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {t("Charges & Taxes")}
                        </Typography>
                        {charges.map((charge) => (
                            <Box
                                key={charge.id}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1,
                                    py: 0.5,
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                                        {charge.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        {charge.rate_type === 'percentage'
                                            ? `${charge.rate_value}%`
                                            : `Fixed`}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: "70px", textAlign: "right" }}>
                                        {formatCurrency(calculateChargeAmountWithDiscount(charge))}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveCharge(charge.id)}
                                        color="error"
                                    >
                                        <DeleteIcon sx={{ fontSize: "1rem" }} />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                    <Divider sx={{ borderBottom: "1px dashed", borderColor: "divider", my: 1 }} />
                </>
            )}

            {/* Add Charges Button */}
            {chargesAvailableToAdd.length > 0 && (
                <Box sx={{ px: 2, py: 1, mb: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenChargesDialog(true)}
                        fullWidth
                    >
                        {t("Add Charge")}
                    </Button>
                </Box>
            )}

            {/* Total Charges */}
            {charges.length > 0 && (
                <ListItem
                    secondaryAction={
                        <Typography variant="h5" color="initial" sx={{ fontSize: { sm: '1rem', xs: '1.2rem' } }}>
                            <strong>{formatCurrency(recalculatedTotalCharges)}</strong>
                        </Typography>
                    }
                >
                    <ListItemText primary={t("Total Charges")} />
                </ListItem>
            )}

            <Divider sx={{ borderBottom: "2px dashed", borderColor: "divider", my: 1 }} />

            {/* Final Total */}
            <ListItem
                secondaryAction={
                    <Typography
                        variant="h5"
                        sx={{
                            fontSize: { sm: '1.1rem', xs: '1.3rem' },
                            fontWeight: 700,
                            color: "primary.main",
                        }}
                    >
                        {formatCurrency(reactiveeFinalTotal)}
                    </Typography>
                }
            >
                <ListItemText
                    primary={t("FINAL TOTAL")}
                    slotProps={{
                        primary: { sx: { fontWeight: 700, fontSize: "1.1rem" } },
                    }}
                />
            </ListItem>

            {/* Add Charge Dialog */}
            <Dialog open={openChargesDialog} onClose={() => setOpenChargesDialog(false)}>
                <DialogTitle>{t("Add Charge/Tax")}</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label={t("Select Charge")}
                        value={selectedCharge}
                        onChange={(e) => setSelectedCharge(e.target.value)}
                        size="small"
                    >
                        {chargesAvailableToAdd.map((charge) => (
                            <MenuItem key={charge.id} value={charge.id}>
                                {charge.name} ({charge.rate_type === 'percentage' ? `${charge.rate_value}%` : `${currencySettings.currency_symbol}${charge.rate_value}`})
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChargesDialog(false)}>{t("Cancel")}</Button>
                    <Button
                        onClick={handleAddCharge}
                        variant="contained"
                        disabled={!selectedCharge}
                    >
                        {t("Add")}
                    </Button>
                </DialogActions>
            </Dialog>
        </List>
    );
}
