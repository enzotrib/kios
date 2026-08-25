import React from 'react';
import { Box, Button, Grid, Paper, TextField, MenuItem } from '@mui/material';
import { useEffect } from 'react';
import { t } from '@/i18n';

const MiscSetting = ({ handleSubmit, settingFormData, handleChange, setSettingFormData, settings }) => {

    useEffect(() => {
        if (!settings?.misc_settings) return;
        try {
            const parsedSettings = JSON.parse(settings.misc_settings);
            setSettingFormData(prev => ({
                ...prev,
                optimize_image_width: parsedSettings.optimize_image_width,
                optimize_image_size: parsedSettings.optimize_image_size,
                cheque_alert: parsedSettings.cheque_alert,
                product_alert: parsedSettings.product_alert,
                cart_first_focus: parsedSettings.cart_first_focus ?? 'quantity',
                enable_unit_discount: parsedSettings.enable_unit_discount ?? 'yes',
                enable_flat_item_discount: parsedSettings.enable_flat_item_discount ?? 'no',
            }));
        } catch (error) {
            console.error("Failed to parse misc settings:", error);
        }
    }, [settings?.misc_settings]);

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'misc_settings'} />
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
                    sx={{ width: { xs: "100%", sm: "60%" }, flexDirection: 'column' }}
                >
                    <Paper sx={{ padding: 2, marginBottom: "1rem", width: '100%' }}>
                        <Grid size={12} container spacing={3}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Cheque Alert")}
                                    name="cheque_alert"
                                    multiline
                                    required
                                    value={settingFormData.cheque_alert}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Product Alert")}
                                    name="product_alert"
                                    multiline
                                    required
                                    value={settingFormData.product_alert}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Cart First Focus")}
                                    name="cart_first_focus"
                                    required
                                    value={settingFormData.cart_first_focus}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="quantity">{t("Quantity")}</MenuItem>
                                    <MenuItem value="discount">{t("Discount")}</MenuItem>
                                    <MenuItem value="price">{t("Price")}</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Enable Unit Discount")}
                                    name="enable_unit_discount"
                                    required
                                    value={settingFormData.enable_unit_discount}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="yes">{t("Yes")}</MenuItem>
                                    <MenuItem value="no">{t("No")}</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Enable Flat Discount")}
                                    name="enable_flat_item_discount"
                                    required
                                    value={settingFormData.enable_flat_item_discount}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="yes">{t("Yes")}</MenuItem>
                                    <MenuItem value="no">{t("No")}</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Optimize Image Width")}
                                    name="optimize_image_width"
                                    multiline
                                    required
                                    value={settingFormData.optimize_image_width}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={t("Optimize Image Size")}
                                    name="optimize_image_size"
                                    multiline
                                    required
                                    value={settingFormData.optimize_image_size}
                                    onChange={handleChange}
                                />
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
                            {t("UPDATE")}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
};

export default MiscSetting;
