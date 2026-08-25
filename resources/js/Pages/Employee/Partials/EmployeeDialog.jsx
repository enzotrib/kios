import React, { useState, useEffect } from "react";
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
    MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { t } from '@/i18n';

const initialEmployeeFormState = {
    name: '',
    contact_number: '',
    address: '',
    joined_at: dayjs().format("YYYY-MM-DD"), // Today's date in 'YYYY-MM-DD' format
    salary: 0,
    salary_frequency: 'Monthly',
    role: '',
    status: 'Active',
    gender: 'Male',
    store_id: 1,
};

export default function EmployeeDialog({
    open,
    setOpen,
    stores,
    refreshEmployees,
    employee
}) {

    const [employeeForm, setEmployeeFormState] = useState(initialEmployeeFormState);
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setEmployeeFormState({
            ...employeeForm,
            [name]: value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        const endpoint = employee ? `/employee/${employee.id}` : "/employee";
        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        axios
            .post(endpoint, formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                refreshEmployees(window.location.pathname)
                setEmployeeFormState(initialEmployeeFormState);
                setOpen(false)
                setLoading(false);
            })
            .catch((error) => {
                const errorMessages = JSON.stringify(error.response, Object.getOwnPropertyNames(error));
                Swal.fire({
                    title: "Error!",
                    text: errorMessages || "An unexpected error occurred.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
                setLoading(false);
            });
    };

    useEffect(() => {
        if (employee) {
            setEmployeeFormState({ ...employee, joined_at: dayjs(employee.joined_at).format("YYYY-MM-DD") });
        }
        else setEmployeeFormState(initialEmployeeFormState)
    }, [employee]);

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"sm"}
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleSubmit,
                    }
                }}
            >
                <DialogTitle>{employee?'UPDATE EMPLOYEE':'ADD EMPLOYEE'}</DialogTitle>
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
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="text"
                                name="name"
                                label={t("Name")}
                                variant="outlined"
                                autoFocus
                                value={employeeForm.name}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={t("Contact Number")}
                                name="contact_number"
                                fullWidth
                                type="number"
                                value={employeeForm.contact_number}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 12 }}>
                            <TextField
                                label={t("Address")}
                                name="address"
                                fullWidth
                                type="text"
                                value={employeeForm.address}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={t("Joined At")}
                                name="joined_at"
                                fullWidth
                                type="date"
                                value={employeeForm.joined_at}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={t("Salary")}
                                name="salary"
                                fullWidth
                                type="number"
                                value={employeeForm.salary}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                value={employeeForm.salary_frequency}
                                label={t("Salary Frequency")}
                                onChange={handleFieldChange}
                                required
                                name="salary_frequency"
                                fullWidth
                                select
                            >
                                <MenuItem value={"Monthly"}>
                                    {t("Monthly")}
                                </MenuItem>
                                <MenuItem value={"Weekly"}>
                                    {t("Weekly")}
                                </MenuItem>
                                <MenuItem value={"Daily"}>
                                    {t("Daily")}
                                </MenuItem>
                                <MenuItem value={"Hourly"}>
                                    {t("Hourly")}
                                </MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label={t("Role")}
                                name="role"
                                fullWidth
                                type="text"
                                placeholder={t("Staff...")}
                                value={employeeForm.role}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>



                        <Grid size={{ xs: 12, sm: 6 }}>

                            <TextField
                                value={employeeForm.gender}
                                label={t("Gender")}
                                onChange={handleFieldChange}
                                required
                                name="gender"
                                fullWidth
                                select
                            >
                                <MenuItem value={"Male"}>
                                    {t("Male")}
                                </MenuItem>
                                <MenuItem value={"Female"}>
                                    {t("Female")}
                                </MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                value={employeeForm.store_id}
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
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                value={employeeForm.status}
                                label={t("Status")}
                                onChange={handleFieldChange}
                                required
                                name="status"
                                fullWidth
                                select
                            >
                                <MenuItem value={"Active"}>
                                    {t("Active")}
                                </MenuItem>
                                <MenuItem value={"Inactive"}>
                                    {t("Inactive")}
                                </MenuItem>
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
                        disabled={employeeForm.name == '' && loading}
                    >
                        {employee?'UPDATE EMPLOYEE':'ADD EMPLOYEE'}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
