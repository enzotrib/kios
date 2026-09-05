import * as React from "react";
import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Swal from "sweetalert2";
import axios from "axios";
import { t } from '@/i18n';

export default function FormDialog({
    open,
    handleClose,
    contact,
    contactType,
    onSuccess,
}) {
    const { tiposDeDocumento, condicionesIva } = usePage().props.fiscal;

    // Lo que compra en un kiosco es un consumidor final sin documento. Que
    // venga elegido evita que el dato quede vacio en el 95% de los casos.
    const contactoVacio = {
        name: "",
        email: "",
        phone: "",
        address: "",
        whatsapp: '',
        doc_tipo: 99,
        doc_nro: "",
        condicion_iva: 5,
        type: contactType, // Type of contact (customer or vendor)
    };

    const [formData, setFormData] = useState(contactoVacio);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value, // Update specific field based on name
        }));
    };

    // Update form state if the contact prop is filled
    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || "", // Update name if available
                email: contact.email || "", // Update email if available
                phone: contact.phone || "", // Update phone if available
                whatsapp: contact.whatsapp || "",
                address: contact.address || "", // Update address if available
                // Los clientes cargados antes de que existieran estos campos
                // vienen sin nada: se los trata como consumidor final, que es
                // lo que eran.
                doc_tipo: contact.doc_tipo ?? 99,
                doc_nro: contact.doc_nro || "",
                condicion_iva: contact.condicion_iva ?? 5,
                type: contact.type || "", // Update type if available
            });
        }
        else setFormData({ ...contactoVacio })
    }, [contact]); // Dependency array includes contact

    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        formJson.type = contactType;
        // Determine the endpoint based on whether we are editing or adding
        const endpoint = contact ? `/contact/${contact.id}` : "/contact";

        // Send form data via Axios
        axios
            .post(endpoint, formJson)
            .then((response) => {
                // Notify user of success
                Swal.fire({
                    title: "Success!",
                    text: "Successfully saved",
                    icon: "success",
                    position: "bottom-start",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    toast: true,
                });
                handleClose(); // Close dialog on success
                setFormData({ ...contactoVacio })
                onSuccess(response.data.data);
            })
            .catch((error) => {
                console.error(
                    "Submission failed with errors:",
                    error.response.data.errors
                );

                // Show error message if submission fails
                // Un CUIT con un digito de mas se rechaza aca, en el
                // momento. Antes el motivo exacto solo iba a la consola.
                const errores = error.response?.data?.errors;

                Swal.fire({
                    title: "Error!",
                    text: errores
                        ? Object.values(errores).flat().join("\n")
                        : (error.response?.data?.message || "An error occurred while saving."),
                    icon: "error",
                    // position: '-start',
                    showConfirmButton: true,
                });
            });
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleSubmit,
                    }
                }}
            >
                <DialogTitle>{t("Contact Information")}</DialogTitle>
                <DialogContent>
                    {/* Collection Name */}
                    {/* Name of the contact (both customers and vendors) */}
                    <TextField
                        className="py-8 mb-4"
                        autoFocus
                        required
                        margin="dense"
                        id="name"
                        name="name"
                        label={t("Name")}
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.name} // Use formData object
                        onChange={handleChange} // Single handleChange for all fields
                    />

                    {/* Contact's email */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="email"
                        name="email"
                        label={t("Email")}
                        type="email"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.email} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Phone number */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="phone"
                        name="phone"
                        label={t("Phone")}
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.phone} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Whatsapp number */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        name="whatsapp"
                        placeholder={t("94XXXXXXXXX")}
                        label={t("Whatsapp")}
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.whatsapp} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Address */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="address"
                        name="address"
                        label={t("Address")}
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.address} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Datos fiscales. No hacen falta para vender, pero sin
                        ellos no se le puede emitir una factura a este cliente
                        mas adelante, y completarlos despues es llamarlo por
                        telefono uno por uno. */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                        {t("Tax details")}
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                                select
                                margin="dense"
                                name="doc_tipo"
                                label={t("Document type")}
                                fullWidth
                                variant="outlined"
                                value={formData.doc_tipo}
                                onChange={handleChange}
                            >
                                {tiposDeDocumento.map((tipo) => (
                                    <MenuItem key={tipo.codigo} value={tipo.codigo}>
                                        {tipo.etiqueta}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                                margin="dense"
                                name="doc_nro"
                                label={t("Document number")}
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={formData.doc_nro}
                                onChange={handleChange}
                                disabled={Number(formData.doc_tipo) === 99}
                                helperText={
                                    Number(formData.doc_tipo) === 99
                                        ? t("Consumers with no document need no number")
                                        : " "
                                }
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                select
                                margin="dense"
                                name="condicion_iva"
                                label={t("Tax condition")}
                                fullWidth
                                variant="outlined"
                                value={formData.condicion_iva}
                                onChange={handleChange}
                            >
                                {condicionesIva.map((condicion) => (
                                    <MenuItem key={condicion.codigo} value={condicion.codigo}>
                                        {condicion.etiqueta}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{t("Cancel")}</Button>
                    <Button type="submit">{t("SAVE")}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
