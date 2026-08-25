import * as React from "react";
import { useState, useEffect } from "react";
import {
    Card,
     Grid,
    TextField,
} from "@mui/material";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import axios from "axios";
import numeral from "numeral";
import { t } from '@/i18n';

export default function Summaries() {
    const [topSoldItems, setTopSoldItems] = useState([]);
    const [topProfitItems, setTopProfitItems] = useState([]);
    const [topGrossItems, setTopGrossItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const refreshSummary = async () => {
        try {
            const response = await axios.post("/dashboard/sold-items-summary", {
                start_date: startDate,
                end_date: endDate,
            });
            setTopSoldItems(response.data.top_sold_items);
            setTopProfitItems(response.data.top_profit_items);
            setTopGrossItems(response.data.top_gross_items);
        } catch (error) {
            console.error("Error fetching summary:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSummary(); // Call on component mount
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        refreshSummary(); // Call whenever startDate or endDate changes
    }, [startDate, endDate]);

    if (loading) {
        return <div>{t("Loading...")}</div>;
    }

    return (
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
            <Card sx={{ height: "100%", padding: 2, display: 'flex', flexDirection: "column" }}>
                <Grid container spacing={2} size={12}>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <TextField
                            label={t("Start Date")}
                            name="start_date"
                            placeholder={t("Start Date")}
                            type="date"
                            fullWidth
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            value={startDate}
                            onChange={(e) =>
                                setStartDate(e.target.value)
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                        <TextField
                            label={t("End Date")}
                            name="end_date"
                            placeholder={t("End Date")}
                            type="date"
                            fullWidth
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            value={endDate}
                            onChange={(e) =>
                                setEndDate(e.target.value)
                            }

                        />
                    </Grid>
                </Grid>

                <Grid container size={12} spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 300 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>{t("Top Sold Items")}</strong></TableCell>
                                        <TableCell align="right">{t("Quantity")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topSoldItems.map((item) => (
                                        <TableRow key={item.product_name}>
                                            <TableCell component="th" scope="row">{item.product_name}</TableCell>
                                            <TableCell align="right">{numeral(item.total_quantity).format('0,0')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 300 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>{t("Top Profit Items")}</strong></TableCell>
                                        <TableCell align="right">{t("Profit")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topProfitItems.map((item) => (
                                        <TableRow key={item.product_name}>
                                            <TableCell component="th" scope="row">{item.product_name}</TableCell>
                                            <TableCell align="right">{numeral(item.total_profit).format('0,0.00')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 300 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>{t("Top Gross Items")}</strong></TableCell>
                                        <TableCell align="right">{t("Gross")}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {topGrossItems.map((item) => (
                                        <TableRow key={item.product_name}>
                                            <TableCell component="th" scope="row">{item.product_name}</TableCell>
                                            <TableCell align="right">{numeral(item.total_gross).format('0,0.00')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                </Grid>

            </Card>
        </Grid>
    );
}
