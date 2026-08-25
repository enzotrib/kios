import React from 'react';
import { useState, useEffect, useContext } from "react";
import { Table, TableBody, Button, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TableFooter, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import the Delete icon
import Badge from '@mui/material/Badge';
import { usePurchase } from "@/Context/PurchaseContext";
import { useCurrencyFormatter } from '@/lib/currencyFormatter';
import { t } from '@/i18n';

export default function PurchaseCartItems() {
    const {
        cartState,
        cartTotal,
        removeFromCart,
        updateProductQuantity,
        totalProfit,
    } = usePurchase();
    const formatCurrency = useCurrencyFormatter();

    const handleQuantityChange = (item, newQuantity) => {
        if (newQuantity == '' || newQuantity == null) newQuantity = 0
        updateProductQuantity(item.id, item.batch_number, newQuantity)
    };

    return (
        <TableContainer component={Paper} sx={{ mb: '4rem' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t("Name")}</TableCell>
                        <TableCell>{t("Batch")}</TableCell>
                        <TableCell>{t("Price")}</TableCell>
                        <TableCell>{t("Quantity")}</TableCell>
                        <TableCell>{t("Cost")}</TableCell>
                        <TableCell>{t("Total")}</TableCell>
                        <TableCell>{t("Action")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {cartState.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell sx={{ padding: '10px 10px' }}>{item.name}</TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}>
                                {item.status === "new" ? (
                                    <Button variant="contained" fullWidth sx={{display:'flex', justifyContent:'start', boxShadow:'none'}}>
                                      {item.batch_number}
                                    </Button>
                                ) : (
                                    <Button variant="contained" fullWidth sx={{display:'flex', justifyContent:'start', boxShadow:'none'}}>
                                      {item.batch_number}
                                    </Button>
                                )}</TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}>{parseFloat(item.price).toFixed(2)}</TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}> {item.quantity} </TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}>{parseFloat(item.cost).toFixed(2)}</TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}>{(parseFloat(item.cost) * parseFloat(item.quantity)).toFixed(2)}</TableCell>
                            <TableCell sx={{ padding: '7px 10px' }}>
                                <IconButton
                                    aria-label={t("delete")}
                                    onClick={() => removeFromCart(index)}
                                    color="error"
                                >
                                    <DeleteIcon fontSize={'small'} />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={5} style={{ textAlign: 'right' }}>
                            <strong>{t("Total Cost Amount:")}</strong>
                        </TableCell>
                        <TableCell>
                            <strong>{formatCurrency(cartTotal)}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} style={{ textAlign: 'right' }}>
                            <strong>{t("Total Profit Amount:")}</strong>
                        </TableCell>
                        <TableCell>
                            <strong>{formatCurrency(totalProfit)}</strong>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} style={{ textAlign: 'right' }}>
                            <strong>{t("Total Items:")}</strong>
                        </TableCell>
                        <TableCell>
                            <strong>{cartState.length}</strong>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}
