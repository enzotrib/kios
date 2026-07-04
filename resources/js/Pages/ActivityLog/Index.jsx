import * as React from "react";
import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    Tooltip,
} from "@mui/material";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HistoryIcon from "@mui/icons-material/History";
import dayjs from "dayjs";
import axios from "axios";
import Swal from "sweetalert2";

import { DataGrid } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";

const formatProps = (properties) => {
    if (!properties || typeof properties !== "object") return "-";
    const attrs = properties.attributes || {};
    const old = properties.old || {};
    if (Object.keys(attrs).length === 0 && Object.keys(old).length === 0) {
        return "-";
    }
    const keys = Object.keys(attrs).length ? Object.keys(attrs) : Object.keys(old);
    return keys
        .map((k) => {
            const newVal = attrs[k] ?? "";
            const oldVal = old[k] ?? "";
            if (oldVal === "" && newVal === "") return null;
            return `${k}: ${oldVal} → ${newVal}`;
        })
        .filter(Boolean)
        .join("  •  ") || "-";
};

const columns = (subjectTypes) => [
    {
        field: "created_at",
        headerName: "When",
        width: 170,
        renderCell: (params) =>
            params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm:ss") : "-",
    },
    {
        field: "causer_name",
        headerName: "User",
        width: 160,
        renderCell: (params) =>
            params.value ? params.value : <Chip size="small" label="System" />,
    },
    { field: "description", headerName: "Description", width: 280 },
    {
        field: "subject_label",
        headerName: "Model",
        width: 130,
    },
    {
        field: "subject_id",
        headerName: "Subject",
        width: 90,
        renderCell: (params) =>
            params.value ? `#${params.value}` : "-",
    },
    {
        field: "event",
        headerName: "Event",
        width: 110,
        renderCell: (params) => {
            const colors = {
                created: "success",
                updated: "info",
                deleted: "error",
                restored: "warning",
            };
            const color = colors[params.value] || "default";
            return <Chip size="small" label={params.value || "-"} color={color} />;
        },
    },
    {
        field: "log_name",
        headerName: "Log",
        width: 120,
        renderCell: (params) => params.value || <Chip size="small" label="default" />,
    },
    {
        field: "properties_text",
        headerName: "Changes",
        flex: 1,
        minWidth: 320,
        sortable: false,
        renderCell: (params) => (
            <Box sx={{ whiteSpace: "normal", lineHeight: 1.4, fontSize: 12, py: 0.5 }}>
                {params.value || "-"}
            </Box>
        ),
    },
];

export default function Index({ logs, subjectTypes, logNames, events, filters, flash }) {
    const user = usePage().props.auth.user;
    const permissions = usePage().props.userPermissions || [];
    const canAccess = (perm) =>
        user?.user_role === "super-admin" || permissions.includes(perm);

    const [dataLogs, setDataLogs] = useState(logs);
    const [searchTerms, setSearchTerms] = useState({
        subject_type: filters.subject_type || "",
        log_name: filters.log_name || "",
        event: filters.event || "",
        date_from: filters.date_from || "",
        date_to: filters.date_to || "",
        page: 1,
        per_page: 50,
    });

    const [pruneOpen, setPruneOpen] = useState(false);
    const [pruneDays, setPruneDays] = useState(90);
    const [pruneCount, setPruneCount] = useState(null);
    const [pruneLoading, setPruneLoading] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                title: "Success",
                text: flash.success,
                icon: "success",
                timer: 2500,
                showConfirmButton: false,
            });
        }
    }, [flash?.success]);

    useEffect(() => {
        if (!pruneOpen) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setPruneCount(null);
        const days = parseInt(pruneDays, 10);
        if (!days || days < 1 || days > 3650) return;
        debounceRef.current = setTimeout(async () => {
            try {
                const { data } = await axios.get("/activity-log/prune-count", {
                    params: { days },
                });
                setPruneCount(data.count);
            } catch {
                setPruneCount(null);
            }
        }, 300);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [pruneDays, pruneOpen]);

    const refreshLogs = (url) => {
        const options = {
            preserveState: true,
            preserveScroll: true,
            only: ["logs"],
            onSuccess: (response) => {
                setDataLogs(response.props.logs);
            },
        };
        router.get(url || window.location.pathname, { ...searchTerms }, options);
    };

    useEffect(() => {
        refreshLogs(window.location.pathname);
    }, [searchTerms]);

    const handleFilterChange = (key, value) => {
        setSearchTerms((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleClearFilters = () => {
        setSearchTerms({
            subject_type: "",
            log_name: "",
            event: "",
            date_from: "",
            date_to: "",
            page: 1,
            per_page: 50,
        });
    };

    const handlePrune = async () => {
        setPruneLoading(true);
        try {
            await router.post(
                "/activity-log/prune",
                { days: pruneDays },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setPruneOpen(false);
                        refreshLogs(window.location.pathname);
                    },
                    onError: (errors) => {
                        const msg = errors?.days?.[0] || "Failed to prune activity logs.";
                        Swal.fire({ title: "Error", text: msg, icon: "error" });
                    },
                }
            );
        } finally {
            setPruneLoading(false);
        }
    };

    const rows = (dataLogs?.data || []).map((log) => ({
        id: log.id,
        created_at: log.created_at,
        causer_name: log.causer?.name || null,
        description: log.description,
        subject_label: log.subject_type
            ? subjectTypes[log.subject_type] || log.subject_type.split("\\").pop()
            : null,
        subject_id: log.subject_id,
        event: log.event,
        log_name: log.log_name,
        properties_text: formatProps(log.properties),
    }));

    return (
        <AuthenticatedLayout
            header={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <HistoryIcon />
                    <Typography variant="h6">Activity Log</Typography>
                </Box>
            }
        >
            <Head title="Activity Log" />
            <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Model</InputLabel>
                            <Select
                                value={searchTerms.subject_type}
                                label="Model"
                                onChange={(e) => handleFilterChange("subject_type", e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {Object.entries(subjectTypes).map(([fqcn, label]) => (
                                    <MenuItem key={fqcn} value={fqcn}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Log</InputLabel>
                            <Select
                                value={searchTerms.log_name}
                                label="Log"
                                onChange={(e) => handleFilterChange("log_name", e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {logNames.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Event</InputLabel>
                            <Select
                                value={searchTerms.event}
                                label="Event"
                                onChange={(e) => handleFilterChange("event", e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {events.map((ev) => (
                                    <MenuItem key={ev} value={ev}>
                                        {ev}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            type="date"
                            label="From"
                            InputLabelProps={{ shrink: true }}
                            value={searchTerms.date_from}
                            onChange={(e) => handleFilterChange("date_from", e.target.value)}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="To"
                            InputLabelProps={{ shrink: true }}
                            value={searchTerms.date_to}
                            onChange={(e) => handleFilterChange("date_to", e.target.value)}
                        />

                        <Button size="small" onClick={handleClearFilters}>
                            Clear
                        </Button>

                        <Box sx={{ flex: 1 }} />

                        {canAccess("activity-log") && (
                            <Tooltip title="Prune old log entries">
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<DeleteSweepIcon />}
                                    onClick={() => setPruneOpen(true)}
                                >
                                    Prune Old Logs
                                </Button>
                            </Tooltip>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ height: 640, width: "100%" }}>
                        <DataGrid
                            rows={rows}
                            columns={columns(subjectTypes)}
                            getRowId={(row) => row.id}
                            hideFooter
                            disableRowSelectionOnClick
                            density="compact"
                            getRowHeight={() => "auto"}
                            sx={{
                                "& .MuiDataGrid-cell": {
                                    py: 1,
                                },
                            }}
                        />
                    </Box>
                </Grid>

                <Grid item xs={12} container sx={{ justifyContent: "end" }}>
                    <CustomPagination
                        refreshTable={refreshLogs}
                        setSearchTerms={setSearchTerms}
                        searchTerms={searchTerms}
                        data={dataLogs}
                    />
                </Grid>
            </Grid>

            <Dialog open={pruneOpen} onClose={() => !pruneLoading && setPruneOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Prune Old Activity Logs</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Delete activity log entries older than the specified number of days. This cannot be undone.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        type="number"
                        label="Older than (days)"
                        value={pruneDays}
                        onChange={(e) => setPruneDays(e.target.value)}
                        inputProps={{ min: 1, max: 3650 }}
                    />
                    <Box sx={{ mt: 2 }}>
                        {pruneCount === null ? (
                            <Typography variant="body2" color="text.secondary">
                                Enter a number of days to see how many records will be affected.
                            </Typography>
                        ) : pruneCount === 0 ? (
                            <Alert severity="info">No log records older than {pruneDays} days.</Alert>
                        ) : (
                            <Alert severity="warning">
                                This will permanently delete <strong>{pruneCount.toLocaleString()}</strong>{" "}
                                log record(s) older than {pruneDays} days.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPruneOpen(false)} disabled={pruneLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePrune}
                        color="warning"
                        variant="contained"
                        disabled={pruneLoading || !pruneCount}
                    >
                        {pruneLoading ? "Pruning..." : "Prune"}
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthenticatedLayout>
    );
}