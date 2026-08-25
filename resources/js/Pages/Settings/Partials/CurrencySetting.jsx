import React from 'react';
import { Box, Button, Grid, MenuItem, Paper, TextField, Typography } from '@mui/material';
import { formatCurrency } from '../../../lib/currencyFormatter';
import { t } from '@/i18n';

export default function CurrencySetting({ handleSubmit, settingFormData, handleChange }) {

    const previewNumbers = [1500, 1500.50, -1500, -1500.50];

    const getPreviewSettings = () => ({
        currency_symbol: settingFormData.currency_symbol || 'Rs.',
        currency_code: settingFormData.currency_code || 'LKR',
        symbol_position: settingFormData.symbol_position || 'before',
        decimal_separator: settingFormData.decimal_separator || '.',
        thousands_separator: settingFormData.thousands_separator || ',',
        decimal_places: settingFormData.decimal_places || '2',
        negative_format: settingFormData.negative_format || 'minus',
        show_currency_code: settingFormData.show_currency_code || 'no',
    });

    return (
        <form
            encType="multipart/form-data"
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'currency'} />
            <Box
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Grid
                    container
                    spacing={2}
                    sx={{ width: { xs: "100%", sm: "60%" } }}
                >
                    <Paper elevation={3} sx={{ padding: 3, marginBottom: 2, width: '100%' }}>
                        <Grid
                            container
                            sx={{
                                display: "flex",
                                width: "100%",
                            }}
                            spacing={2}
                        >
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Currency Symbol")}
                                    name="currency_symbol"
                                    required
                                    placeholder={t("e.g., Rs, $, €")}
                                    value={settingFormData.currency_symbol || ''}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Currency Code")}
                                    name="currency_code"
                                    required
                                    placeholder={t("e.g., INR, USD, EUR")}
                                    value={settingFormData.currency_code || ''}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Symbol Position")}
                                    name="symbol_position"
                                    value={settingFormData.symbol_position || 'before'}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value="before">{t("Before Amount (")}{settingFormData.currency_symbol || 'Rs.'} 1,500.00)</MenuItem>
                                    <MenuItem value="after">{t("After Amount (1,500.00")} {settingFormData.currency_symbol || 'Rs.'})</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Decimal Separator")}
                                    name="decimal_separator"
                                    value={settingFormData.decimal_separator || '.'}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value=".">{t("Dot (1,500.00)")}</MenuItem>
                                    <MenuItem value=",">{t("Comma (1.500,00)")}</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Thousands Separator")}
                                    name="thousands_separator"
                                    value={settingFormData.thousands_separator || ','}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value=",">{t("Comma (1,500.00)")}</MenuItem>
                                    <MenuItem value=".">{t("Dot (1.500,00)")}</MenuItem>
                                    <MenuItem value=" ">{t("Space (1 500.00)")}</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Decimal Places")}
                                    name="decimal_places"
                                    value={settingFormData.decimal_places || '2'}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value="0">0 ({settingFormData.currency_symbol || 'Rs.'} 1500)</MenuItem>
                                    <MenuItem value="2">2 ({settingFormData.currency_symbol || 'Rs.'} 1500.00)</MenuItem>
                                    <MenuItem value="3">3 ({settingFormData.currency_symbol || 'Rs.'} 1500.000)</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Negative Number Format")}
                                    name="negative_format"
                                    value={settingFormData.negative_format || 'minus'}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value="minus">{t("With Minus Sign (-")}{settingFormData.currency_symbol || 'Rs.'} 1,500.00)</MenuItem>
                                    <MenuItem value="parentheses">{t("Parentheses ((")}{settingFormData.currency_symbol || 'Rs.'} 1,500.00))</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t("Show Currency Code")}
                                    name="show_currency_code"
                                    value={settingFormData.show_currency_code || 'no'}
                                    onChange={handleChange}
                                    variant="outlined"
                                >
                                    <MenuItem value="yes">{t("Yes (")}{settingFormData.currency_symbol || 'Rs.'} ({settingFormData.currency_code || 'LKR'}) 1,500.00)</MenuItem>
                                    <MenuItem value="no">{t("No (")}{settingFormData.currency_symbol || 'Rs.'} 1,500.00)</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Grid
                        size={12}
                        sx={{ display: "flex", justifyContent: "end" }}
                    >
                        <Button
                            type="submit"
                            variant="outlined"
                            fullWidth
                        >
                            {t("UPDATE CURRENCY SETTINGS")}
                        </Button>
                    </Grid>

                    {/* Currency Preview Section */}
                    <Grid size={12}>
                        <Paper elevation={3} sx={{ padding: 3, marginTop: 3, width: '100%', backgroundColor: 'var(--surface-2)' }}>
                            <Typography variant="h6" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                                {t("Format Preview")}
                            </Typography>
                            <Grid container spacing={2}>
                                {previewNumbers.map((num, index) => (
                                    <Grid size={{ xs: 6, sm: 6 }} key={index}>
                                        <Box sx={{
                                            padding: 1.5,
                                            backgroundColor: num < 0 ? 'var(--warning-soft)' : '#e8f5e9',
                                            borderRadius: 1,
                                            border: '1px solid #ddd'
                                        }}>
                                            <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                                {num < 0 ? 'Negative' : 'Positive'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: num < 0 ? 'var(--destructive)' : '#388e3c' }}>
                                                {formatCurrency(num, getPreviewSettings())}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
}
