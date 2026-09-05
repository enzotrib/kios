import * as React from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import {
    MenuItem,
    Typography,
    Tab,
    Tabs,
    Switch,
    TextField,
    CardMedia,
    CardActions,
    Box,
    FormControlLabel,
    Card,
    Paper,
} from "@mui/material";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import MiscSetting from "./Partials/MiscSetting";
import ModuleSetting from "./Partials/ModuleSetting";
import Template from "./Partials/Template";
import MailSetting from "./Partials/MailSetting";
import TelegramSetting from "./Partials/TelegramSetting";
import LoyaltyPointsSetting from "./Partials/LoyaltyPointsSetting";
import CurrencySetting from "./Partials/CurrencySetting";
import BarcodeTemplateEditor from "./Partials/BarcodeTemplateEditor";
import { t } from '@/i18n';

const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

const fontOptions = [
    { label: "Arial", fontFamily: "Arial, sans-serif" },
    { label: "Helvetica", fontFamily: "Helvetica, sans-serif" },
    { label: "Times New Roman", fontFamily: "'Times New Roman', serif" },
    { label: "Georgia", fontFamily: "Georgia, serif" },
    { label: "Courier New", fontFamily: "'Courier New', monospace" },
    { label: "Verdana", fontFamily: "Verdana, sans-serif" },
    { label: "Tahoma", fontFamily: "Tahoma, sans-serif" },
    { label: "Trebuchet MS", fontFamily: "'Trebuchet MS', sans-serif" },
    { label: "Comic Sans MS", fontFamily: "'Comic Sans MS', cursive" },
    { label: "OCR A Extended", fontFamily: "'OCR A Extended', monospace" },
    { label: "Monaco", fontFamily: "Monaco, monospace" },
    { label: "Lucida Console", fontFamily: "'Lucida Console', monospace" },
    { label: "Consolas", fontFamily: "Consolas, monospace" },
    {
        label: "Bitstream Vera Sans Mono",
        fontFamily: "'Bitstream Vera Sans Mono', monospace",
    },
    { label: "DejaVu Sans Mono", fontFamily: "'DejaVu Sans Mono', monospace" },
    { label: "Inconsolata", fontFamily: "'Inconsolata', monospace" },
    { label: "Source Code Pro", fontFamily: "'Source Code Pro', monospace" },
    { label: "Fira Code", fontFamily: "'Fira Code', monospace" },
    { label: "Droid Sans Mono", fontFamily: "'Droid Sans Mono', monospace" },
    { label: "Ubuntu Mono", fontFamily: "'Ubuntu Mono', monospace" },
    { label: "PT Mono", fontFamily: "'PT Mono', monospace" },
    { label: "Noto Mono", fontFamily: "'Noto Mono', monospace" },
    { label: "Hack", fontFamily: "'Hack', monospace" },
    { label: "Tisa Mono", fontFamily: "'Tisa Mono', monospace" },
    { label: "Space Mono", fontFamily: "'Space Mono', monospace" },
];

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function Setting({ settings }) {
    const esEscritorio = usePage().props.esEscritorio;
    const [settingFormData, setSettingFormData] = useState(() => {
        let currencySettings = {
            currency_symbol: 'Rs.',
            currency_code: 'LKR',
            symbol_position: 'before',
            decimal_separator: '.',
            thousands_separator: ',',
            decimal_places: '2',
            negative_format: 'minus',
            show_currency_code: 'no',
        };

        if (settings.currency_settings) {
            try {
                const parsed = JSON.parse(settings.currency_settings);
                currencySettings = { ...currencySettings, ...parsed };
            } catch (error) {
                console.error("Failed to parse currency settings:", error);
            }
        }

        return {
            shop_logo: settings.shop_logo,
            shop_logo_light: settings.shop_logo_light,
            app_icon: settings.app_icon,
            sale_receipt_note: settings.sale_receipt_note,
            shop_name: settings.shop_name,
            sale_print_padding_right: settings.sale_print_padding_right,
            sale_print_padding_left: settings.sale_print_padding_left,
            sale_print_font: settings.sale_print_font,
            show_receipt_shop_name: settings.show_receipt_shop_name ?? 1,
            show_barcode_store: settings.show_barcode_store,
            show_barcode_product_price: settings.show_barcode_product_price,
            show_barcode_product_name: settings.show_barcode_product_name,
            sale_receipt_second_note: settings.sale_receipt_second_note,
            auto_open_print_dialog: settings.auto_open_print_dialog ?? '0',
            receipt_paper_width: settings.receipt_paper_width ?? '80mm',
            receipt_printer: settings.receipt_printer ?? '',
            receipt_silent_print: settings.receipt_silent_print ?? 'off',
            enable_unit_discount: 'yes',
            enable_flat_item_discount: 'no',
            cart_first_focus: 'quantity',
            ...currencySettings,
        };
    });

    const [barcodeSettings, setBarcodeSettings] = useState(() => {
        const initialBarcodeSettings = new Map([
            ["container_height", "28mm"],
            ["store_font_size", "0.8em"],
            ["price_font_size", "0.8em"],
            ["price_margin_top", "-3px"],
            ["price_margin_bottom", "-5px"],
            ["barcode_margin_top", "-10px"],
            ["barcode_height", 35],
            ["barcode_font_size", 14],
            ["barcode_width", 1.5],
            ["barcode_format", "CODE128"],
            ["product_name_margin_top", "-4px"],
            ["product_name_font_size", "0.7em"],
        ]);

        // Parse JSON if barcode_settings exists in settings
        if (settings.barcode_settings) {
            try {
                const parsedSettings = JSON.parse(settings.barcode_settings);
                Object.entries(parsedSettings).forEach(([key, value]) => {
                    initialBarcodeSettings.set(key, value);
                });
            } catch (error) {
                console.error("Failed to parse barcode settings:", error);
            }
        }

        return initialBarcodeSettings;
    });

    const handleBarcodeFieldChange = (e) => {
        const { name, value } = e.target;
        setBarcodeSettings((prevSettings) => new Map(prevSettings).set(name, value));
    };

    const handleFontChange = (event) => {
        const selectedFontFamily = event.target.value;
        setSettingFormData({
            ...settingFormData,
            sale_print_font: selectedFontFamily,
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettingFormData({
            ...settingFormData,
            [name]: type === "checkbox" ? (checked ? "on" : "off") : value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const { name } = e.target;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettingFormData({
                    ...settingFormData,
                    [name]: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Las impresoras que ve Windows. Solo existen en el paquete de escritorio;
    // en la web la ruta devuelve 404 y la lista queda vacia, que es lo
    // correcto: ahi el ticket lo imprime el navegador de quien atiende.
    const [impresoras, setImpresoras] = useState([]);
    useEffect(() => {
        if (!esEscritorio) return;
        axios.get('/impresoras')
            .then((r) => setImpresoras(r.data.impresoras ?? []))
            .catch(() => setImpresoras([]));
    }, [esEscritorio]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(submittedFormData.entries());

        if (formJson.setting_type === 'barcode') {
            const barcodeSettingsObject = Object.fromEntries(barcodeSettings);
            formJson.barcodeSettings = JSON.stringify(barcodeSettingsObject);
        }

        axios.post('/settings-update', formJson, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then((response) => {
                Swal.fire({
                    title: "Success!",
                    text: "Successfully saved",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
            })
            .catch((error) => {
                console.error("Submission failed with errors:", error);

                // Un 422 traia los motivos exactos pero solo se logueaban en la
                // consola: para el usuario el boton "no hacia nada". Se muestran.
                const errors = error.response?.data?.errors;
                const message = errors
                    ? Object.values(errors).flat().join('\n')
                    : (error.response?.data?.message || t('Something went wrong. Please try again.'));

                Swal.fire({
                    title: t('Update Failed'),
                    text: message,
                    icon: "error",
                });
            });
    };

    const [tabValue, setTabValue] = useState('shop');

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <AuthenticatedLayout>
            <Head title={t("Settings")} />
            <Box component="div">
                <Box
                    sx={{
                        flexGrow: 1,
                        maxWidth: { xs: 350, sm: '100%' },
                        bgcolor: 'background.paper',
                    }}
                >
                    <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                        <Tab label={t("SHOP")} value="shop" />
                        <Tab label={t("RECEIPT")} value="receipt" />
                        <Tab label={t("BARCODE")} value="barcode" />
                        <Tab label={t("CURRENCY")} value="currency" />
                        <Tab label={t("MISC")} value="misc" />
                        <Tab label={t("MODULES")} value="modules" />
                        <Tab label={t("MAIL")} value="mail" />
                        <Tab label={t("TELEGRAM")} value="telegram" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index="shop">
                    <form
                        encType="multipart/form-data"
                        onSubmit={handleSubmit}
                        method="post"
                    >
                        <input type="hidden" name="setting_type" value={'shop_information'} />
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
                                sx={{ width: { xs: "100%", sm: "60%" } }}
                            >
                                <Paper sx={{ padding: { xs: '0.5rem', sm: "1rem" }, marginBottom: "1rem", width: '100%' }}>
                                    <Grid size={12} container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Card>
                                                <CardMedia
                                                    sx={{
                                                        width: "100%",
                                                        height: 200,
                                                        contain: "content",
                                                        padding: "8px",
                                                        backgroundSize: "contain",
                                                        backgroundOrigin: "content-box",
                                                    }}
                                                    image={settingFormData.shop_logo}
                                                    title={t("Logo oscuro (o principal)")}
                                                />
                                                <CardActions className="mt-0">
                                                    <Button
                                                        component="label"
                                                        role={undefined}
                                                        variant="contained"
                                                        tabIndex={-1}
                                                        startIcon={<CloudUploadIcon />}
                                                        fullWidth
                                                    >
                                                        {t("Logo oscuro / principal")}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            onChange={handleFileChange}
                                                            name="shop_logo"
                                                        />
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Card>
                                                <CardMedia
                                                    sx={{
                                                        width: "100%",
                                                        height: 200,
                                                        contain: "content",
                                                        padding: "8px",
                                                        backgroundSize: "contain",
                                                        backgroundOrigin: "content-box",
                                                    }}
                                                    image={settingFormData.shop_logo_light}
                                                    title={t("Logo claro")}
                                                />
                                                <CardActions className="mt-0">
                                                    <Button
                                                        component="label"
                                                        role={undefined}
                                                        variant="contained"
                                                        tabIndex={-1}
                                                        startIcon={<CloudUploadIcon />}
                                                        fullWidth
                                                    >
                                                        {t("Logo modo claro")}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            onChange={handleFileChange}
                                                            name="shop_logo_light"
                                                        />
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Card>
                                                <CardMedia
                                                    sx={{
                                                        width: "100%",
                                                        height: 200,
                                                        contain: "content",
                                                        padding: "8px",
                                                        backgroundSize: "contain",
                                                        backgroundOrigin: "content-box",
                                                    }}
                                                    image={settingFormData.app_icon}
                                                    title={t("app icon")}
                                                />
                                                <CardActions className="mt-0">
                                                    <Button
                                                        component="label"
                                                        role={undefined}
                                                        variant="contained"
                                                        tabIndex={-1}
                                                        startIcon={<CloudUploadIcon />}
                                                        fullWidth
                                                    >
                                                        {t("Upload app icon")}
                                                        <VisuallyHiddenInput
                                                            type="file"
                                                            onChange={handleFileChange}
                                                            name="app_icon"
                                                        />
                                                    </Button>
                                                </CardActions>
                                            </Card>
                                        </Grid>

                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Shop name")}
                                                name="shop_name"
                                                multiline
                                                required
                                                sx={{ mt: "2rem" }}
                                                value={settingFormData.shop_name}
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
                </TabPanel>

                <TabPanel value={tabValue} index={'receipt'}>
                    <form
                        encType="multipart/form-data"
                        onSubmit={handleSubmit}
                        method="post"
                    >
                        <input type="hidden" name="setting_type" value={'receipt'} />
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
                                <Paper elevation={3} sx={{ padding: 3, marginBottom: 2 }}>
                                    <Grid
                                        container
                                        sx={{
                                            display: "flex",
                                            width: "100%",
                                        }}
                                        spacing={2}
                                    >
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Receipt note")}
                                                name="sale_receipt_note"
                                                multiline
                                                required
                                                value={settingFormData.sale_receipt_note}
                                                onChange={handleChange}
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Second note")}
                                                name="sale_receipt_second_note"
                                                multiline
                                                value={settingFormData.sale_receipt_second_note}
                                                onChange={handleChange}
                                            />
                                        </Grid>
                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Show shopname")}
                                                name="show_receipt_shop_name"
                                                multiline
                                                required
                                                value={settingFormData.show_receipt_shop_name}
                                                onChange={handleChange}
                                                select
                                            >
                                                <MenuItem value={1}>{t("Show")}</MenuItem>
                                                <MenuItem value={0}>{t("Hide")}</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Padding Right")}
                                                name="sale_print_padding_right"
                                                multiline
                                                required
                                                value={settingFormData.sale_print_padding_right}
                                                onChange={handleChange}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Padding Left")}
                                                name="sale_print_padding_left"
                                                multiline
                                                required
                                                value={settingFormData.sale_print_padding_left}
                                                onChange={handleChange}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                name="sale_print_font"
                                                label={t("Choose Font for Receipt")}
                                                value={settingFormData.sale_print_font}
                                                onChange={handleFontChange}
                                                select
                                            >
                                                {fontOptions.map((option) => (
                                                    <MenuItem
                                                        key={option.fontFamily}
                                                        value={option.fontFamily}
                                                    >
                                                        <Typography style={{ fontFamily: option.fontFamily }}>
                                                            {option.label}
                                                        </Typography>
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                fullWidth
                                                name="receipt_paper_width"
                                                label={t("Paper width")}
                                                value={settingFormData.receipt_paper_width}
                                                onChange={handleChange}
                                                helperText={t("The width of the roll in your printer")}
                                                select
                                            >
                                                <MenuItem value="80mm">80 mm</MenuItem>
                                                <MenuItem value="58mm">58 mm</MenuItem>
                                                <MenuItem value="A4">A4</MenuItem>
                                            </TextField>
                                        </Grid>

                                        {esEscritorio && (
                                            <>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        name="receipt_printer"
                                                        label={t("Printer")}
                                                        value={settingFormData.receipt_printer}
                                                        onChange={handleChange}
                                                        helperText={t("Leave empty to use the Windows default printer")}
                                                        select
                                                    >
                                                        <MenuItem value="">{t("Default printer")}</MenuItem>
                                                        {impresoras.map((impresora) => (
                                                            <MenuItem key={impresora.nombre} value={impresora.nombre}>
                                                                {impresora.etiqueta}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>

                                                <Grid size={12}>
                                                    <TextField
                                                        fullWidth
                                                        name="receipt_silent_print"
                                                        label={t("Print without asking")}
                                                        value={settingFormData.receipt_silent_print}
                                                        onChange={handleChange}
                                                        helperText={t("The receipt goes straight to the printer, with no Windows dialog")}
                                                        select
                                                    >
                                                        <MenuItem value="off">{t("Show the print dialog")}</MenuItem>
                                                        <MenuItem value="on">{t("Print directly")}</MenuItem>
                                                    </TextField>
                                                </Grid>
                                            </>
                                        )}

                                        <Grid size={12}>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                label={t("Auto Open Print Dialog")}
                                                name="auto_open_print_dialog"
                                                required
                                                value={settingFormData.auto_open_print_dialog}
                                                onChange={handleChange}
                                                select
                                            >
                                                <MenuItem value="1">{t("Yes")}</MenuItem>
                                                <MenuItem value="0">{t("No")}</MenuItem>
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
                                        {t("UPDATE")}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </form>
                </TabPanel>
                <TabPanel value={tabValue} index={'barcode'}>
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
                            sx={{ width: { xs: "100%", sm: "60%" } }}
                        >
                            <form
                                encType="multipart/form-data"
                                onSubmit={handleSubmit}
                                method="post"
                                style={{ marginBottom: '2rem', width: '100%' }}
                            >
                                <input type="hidden" name="setting_type" value={'barcode'} />
                                <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        {t("Barcode Display Options")}
                                    </Typography>
                                    <Grid
                                        container
                                        spacing={2}
                                        sx={{
                                            display: "flex",
                                            width: "100%",
                                        }}
                                    >
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        name="show_barcode_store"
                                                        value={settingFormData.show_barcode_store}
                                                        onChange={handleChange}
                                                        checked={settingFormData.show_barcode_store === "on"}
                                                    />
                                                }
                                                label={t("STORE NAME")}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        name="show_barcode_product_price"
                                                        value={settingFormData.show_barcode_product_price}
                                                        onChange={handleChange}
                                                        checked={settingFormData.show_barcode_product_price === "on"}
                                                    />
                                                }
                                                label={t("PRODUCT PRICE")}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        name="show_barcode_product_name"
                                                        value={settingFormData.show_barcode_product_name}
                                                        onChange={handleChange}
                                                        checked={settingFormData.show_barcode_product_name === "on"}
                                                    />
                                                }
                                                label={t("PRODUCT NAME")}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid spacing={2} container sx={{ mt: 2 }}>
                                        {[...barcodeSettings.keys()].map((key) => (
                                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                                                <TextField
                                                    fullWidth
                                                    variant="outlined"
                                                    label={key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                                    name={key}
                                                    value={barcodeSettings.get(key)}
                                                    onChange={handleBarcodeFieldChange}
                                                    size="small"
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                        <Button
                                            type="submit"
                                            variant="outlined"

                                        >
                                            {t("UPDATE OPTIONS")}
                                        </Button>
                                    </Box>
                                </Paper>
                            </form>

                            <Box sx={{ width: '100%' }}>
                                <BarcodeTemplateEditor settings={settings} />
                            </Box>
                        </Grid>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={'currency'}>
                    <CurrencySetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} />
                </TabPanel>

                <TabPanel value={tabValue} index={'misc'}>
                    <MiscSetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} setSettingFormData={setSettingFormData} settings={settings} />
                </TabPanel>
                <TabPanel value={tabValue} index={'modules'}>
                    <ModuleSetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} setSettingFormData={setSettingFormData} settings={settings} />
                </TabPanel>
                <TabPanel value={tabValue} index={'template'}>
                    <Template />
                </TabPanel>
                <TabPanel value={tabValue} index={'mail'}>
                    <MailSetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} setSettingFormData={setSettingFormData} settings={settings} />
                </TabPanel>
                <TabPanel value={tabValue} index={'telegram'}>
                    <TelegramSetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} setSettingFormData={setSettingFormData} settings={settings} />
                </TabPanel>
                <TabPanel value={tabValue} index={'loyalty'}>
                    <LoyaltyPointsSetting handleSubmit={handleSubmit} settingFormData={settingFormData} handleChange={handleChange} setSettingFormData={setSettingFormData} settings={settings} />
                </TabPanel>
            </Box>
        </AuthenticatedLayout>
    );
}
