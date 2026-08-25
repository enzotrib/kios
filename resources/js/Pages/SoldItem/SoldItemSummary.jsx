import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/Components/ui/card"

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { Head } from "@inertiajs/react";
import numeral from "numeral";
import dayjs from "dayjs";
import { TextField,  Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { t } from '@/i18n';

export default function SoldItemSummary({ sold_items }) {
  const [start_date, setStartDate] = useState(dayjs().format("YYYY-MM-DD"))
  const [end_date, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [sold_items_data, setSoldItemsData] = useState(sold_items)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshSoldItems = (url = "/sold-items-summary") => {
    const options = {
      preserveState: true,
      preserveScroll: true,
      only: ["sold_items"],
      onSuccess: (response) => {
        if (response?.props?.sold_items) {
          setSoldItemsData(response.props.sold_items);
        } else {
          console.error("Missing sold_items in the response.");
        }
      },
    };
    router.get(
      url, { start_date, end_date }, options
    );
  };

  useEffect(() => {
    refreshSoldItems()
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title={t("Sold Items")} />
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t("Start Date")}
                name="start_date"
                placeholder={t("From")}
                type="date"
                fullWidth
                value={start_date}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  refreshSoldItems()
                }}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t("End Date")}
                name="end_date"
                placeholder={t("To")}
                type="date"
                fullWidth
                value={end_date}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  refreshSoldItems()
                }}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardHeader>

        <CardContent className="space-y-2">
          <Table>
            <TableHeader className="text-[var(--muted-foreground)]">
              <TableRow>
                <TableHead >{t("Product")}</TableHead>
                <TableHead className="text-right">{t("Quantity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sold_items_data.map((sold_item) => (
                <TableRow key={sold_item.product_id}>
                  <TableCell className="font-medium">{sold_item.product.name}</TableCell>
                  <TableCell className="text-right">{numeral(Number(sold_item.total_quantity)).format("(0,0.00)")}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell>{t("Total quantity")}</TableCell>
                <TableCell className="text-right font-bold">{numeral(sold_items_data.reduce((total, item) => total + Number(item.total_quantity), 0)).format("(0,0.00)")}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
