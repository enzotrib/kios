import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { MenuItem } from "@mui/material";
import ThemeToggle from "@/Components/design/ThemeToggle";
import React, { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import InventoryIcon from "@mui/icons-material/Inventory";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PaidIcon from "@mui/icons-material/Paid";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import CustomerIcon from "@mui/icons-material/PeopleAlt";
import VendorIcon from "@mui/icons-material/ContactEmergency";
import SettingsIcon from "@mui/icons-material/Settings";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import PeopleIcon from "@mui/icons-material/People";
import Tooltip from "@mui/material/Tooltip";
import Collapse from "@mui/material/Collapse";
import PhoneForwardedIcon from "@mui/icons-material/PhoneForwarded";
import WorkIcon from "@mui/icons-material/Work";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import BadgeIcon from "@mui/icons-material/Badge";
import ReceiptIcon from '@mui/icons-material/Receipt';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import HistoryIcon from '@mui/icons-material/History';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyCheck, faFileInvoice, faBoxesStacked, faPercent } from "@fortawesome/free-solid-svg-icons";
import brandLogo from "@/kios-logo.jpg";
import { t } from '@/i18n';
const drawerWidth = 240;

function AuthenticatedLayout({ header, children, ...props }) {
    const user = usePage().props.auth.user;
    const shop_name = usePage().props.settings.shop_name;
    // Logo subido desde Configuracion > Comercio. Si todavia no se subio ninguno,
    // cae en el que viene empaquetado con la app.
    const shop_logo = usePage().props.settings.shop_logo || brandLogo;
    const modules = usePage().props.modules;
    const pageLabel = usePage().props.pageLabel;
    const pathname = usePage().url;
    const permissions = usePage().props.userPermissions;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const childDiv = document.querySelector(".scrollParent");
        if (childDiv) {
            childDiv.setAttribute("data-custom-attribute", "value");
        }
    }, []);

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    const [collapse, setCollapse] = useState(false);

    const handleCollapse = () => {
        setCollapse(!collapse);
    };

    //Logic to selected menu item
    // const isSelected = (href) => pathname === href || pathname.startsWith(href + '/');
    const isSelected = (href) => {
        const baseHref = href.split("?")[0]; // Extract the base path by removing query parameters
        return pathname === baseHref || pathname.startsWith(baseHref);
    };

    const canAccess = (permission) => {
        return user.user_role === 'super-admin' || permissions.includes(permission);
    };

    const NavItem = ({ href, icon: Icon, label, open, selected, onClick, icontype }) => (
        <Link preserveScroll href={href}>
            <ListItem disablePadding sx={{ display: "block" }}>
                <ListItemButton
                    selected={selected}
                    sx={[
                        {
                            minHeight: 40,
                            px: 1.5,
                            // Los colores salen de los design tokens (resources/css/app.css),
                            // por eso el item activo acompana el modo claro/oscuro.
                            "&.Mui-selected": {
                                color: "var(--primary)",
                                backgroundColor: "var(--primary-soft)",
                                fontWeight: 600,
                                "& .MuiListItemIcon-root": {
                                    color: "var(--primary)",
                                },
                                "&:hover": {
                                    backgroundColor: "var(--primary-soft)",
                                },
                            },
                            "&:hover": {
                                backgroundColor: "var(--surface-2)",
                            },
                        },
                        open
                            ? { justifyContent: "initial" }
                            : { justifyContent: "center" },
                    ]}
                    onClick={onClick}
                >
                    <ListItemIcon
                        sx={[
                            {
                                minWidth: 0,
                                justifyContent: "center",
                            },
                            open ? { mr: 3 } : { mr: "auto" },
                        ]}
                    >
                        {icontype && icontype === 'fa' ? (
                            <FontAwesomeIcon icon={Icon} size="xl" />
                        ) : (
                            Icon && <Icon />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={label}
                        sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                    />
                </ListItemButton>
            </ListItem>
        </Link>
    );

    const drawer = (
        <>
            <Toolbar sx={{ display: "flex", justifyContent: "center" }}>
                <img
                    src={shop_logo}
                    alt={shop_name}
                    style={{ objectFit: "contain", height: "100%", maxWidth: "100%" }}
                />
            </Toolbar>
            <Divider />
            <List>
                <NavItem
                    href="/dashboard"
                    icon={DashboardIcon}
                    label={t("Dashboard")}
                    open={open}
                    selected={isSelected("/dashboard")}
                />

                {canAccess("pos") && (
                    <NavItem
                        href="/pos"
                        icon={PointOfSaleIcon}
                        label={t("POS")}
                        open={open}
                        selected={isSelected("/pos")}
                    />
                )}
                {canAccess("products") && (
                    <NavItem
                        href="/products"
                        icon={InventoryIcon}
                        label={t("Products")}
                        open={open}
                        selected={isSelected("/products")}
                    />
                )}

                {canAccess("sales") && (
                    <NavItem
                        href="/sales"
                        icon={PaidIcon}
                        label={t("Sales")}
                        open={open}
                        selected={isSelected("/sales")}
                    />
                )}
                <NavItem
                    href="/reports/dailycash"
                    icon={WorkIcon}
                    label={t("Cash Drawer")}
                    open={open}
                    selected={isSelected("/reports/dailycash")}
                />

                {canAccess("customers") && (
                    <NavItem
                        href="/customers"
                        icon={CustomerIcon}
                        label={t("Customers")}
                        open={open}
                        selected={isSelected("/customers")}
                    />
                )}
                {canAccess("vendors") && (
                    <NavItem
                        href="/vendors"
                        icon={VendorIcon}
                        label={t("Suppliers")}
                        open={open}
                        selected={isSelected("/vendors")}
                    />
                )}

                {(canAccess("inventory") && modules.includes("Inventory")) && (
                    <NavItem
                        href="/inventory"
                        icon={faBoxesStacked}
                        icontype={'fa'}
                        label={t("Inventory")}
                        open={open}
                        selected={isSelected("/inventory")}
                    />
                )}


                {canAccess("collections") && (
                    <NavItem
                        href="/collections"
                        icon={AccountTreeIcon}
                        label={t("Collections")}
                        open={open}
                        selected={isSelected("/collections")}
                    />
                )}

                {canAccess("expenses") && (
                    <NavItem
                        href="/expenses"
                        icon={AccountBalanceWalletIcon}
                        label={t("Expenses")}
                        open={open}
                        selected={isSelected("/expenses")}
                    />
                )}

                {canAccess("charges") && (
                    <NavItem
                        href="/charges"
                        icon={faPercent}
                        icontype={'fa'}
                        label={t("Charges/Tax")}
                        open={open}
                        selected={isSelected("/charges")}
                    />
                )}

                {canAccess("quotations") && (
                    <NavItem
                        href="/quotations"
                        icon={faFileInvoice}
                        icontype={'fa'}
                        label={t("Quotations")}
                        open={open}
                        selected={isSelected("/quotations")}
                    />
                )}

                {(canAccess("reloads") && modules.includes("Reloads")) && (
                    <NavItem
                        href="/reloads"
                        icon={PhoneForwardedIcon}
                        label={t("Reloads")}
                        open={open}
                        selected={isSelected("/reloads")}
                    />
                )}

                {(canAccess("cheques") && modules.includes("Cheques")) && (
                    <NavItem
                        href="/cheques?status=pending"
                        icon={faMoneyCheck}
                        icontype={'fa'}
                        label={t("Cheques")}
                        open={open}
                        selected={isSelected("/cheques")}
                    />
                )}
                {canAccess("sold-items") && (
                    <NavItem
                        href="/sold-items"
                        icon={ShoppingCartCheckoutIcon}
                        label={t("Sold Items")}
                        open={open}
                        selected={isSelected("/sold-items")}
                    />
                )}
                {canAccess("purchases") && (
                    <NavItem
                        href="/purchases"
                        icon={AddShoppingCartIcon}
                        label={t("Purchases")}
                        open={open}
                        selected={isSelected("/purchases")}
                    />
                )}
                {canAccess("payments") && (
                    <NavItem
                        href="/payments/sales"
                        icon={PaymentsIcon}
                        label={t("Payments")}
                        open={open}
                        selected={isSelected("/payments")}
                    />
                )}
                {canAccess("stores") && (
                    <NavItem
                        href="/stores"
                        icon={StoreIcon}
                        label={t("Stores")}
                        open={open}
                        selected={isSelected("/stores")}
                    />
                )}
                {canAccess("employees") && (
                    <NavItem
                        href="/employees"
                        icon={BadgeIcon}
                        label={t("Employees")}
                        open={open}
                        selected={isSelected("/employees")}
                    />
                )}
                {canAccess("payroll") && (
                    <NavItem
                        href="/payroll"
                        icon={ReceiptIcon}
                        label={t("Payroll")}
                        open={open}
                        selected={isSelected("/payroll")}
                    />
                )}
                {canAccess("media") && (
                    <NavItem
                        href="/media"
                        icon={PermMediaIcon}
                        label={t("Media")}
                        open={open}
                        selected={isSelected("/media")}
                    />
                )}
                {canAccess("settings") && (
                    <NavItem
                        href="/settings"
                        icon={SettingsIcon}
                        label={t("Settings")}
                        open={open}
                        selected={isSelected("/settings")}
                    />
                )}
                <NavItem
                    href="/profile"
                    icon={ManageAccountsIcon}
                    label={t("Profile")}
                    open={open}
                    selected={isSelected("/profile")}
                />
                {(user.user_role === "admin" || user.user_role === "super-admin") && (
                    <>
                        <ListItemButton onClick={handleCollapse}>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary={t("User")} />
                            {collapse ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={collapse} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <NavItem
                                    href="/users"
                                    icon={null}
                                    label={t("All")}
                                    open={open}
                                    // sx={{ pl: 5 }}
                                    selected={isSelected("/users")}
                                />
                                <NavItem
                                    href="/user/role"
                                    icon={null}
                                    label={t("User Role")}
                                    open={open}
                                    // sx={{ pl: 5 }}
                                    selected={isSelected("/user/role")}
                                />
                            </List>
                        </Collapse>
                    </>
                )}

                {canAccess("activity-log") && (
                    <NavItem
                        href="/activity-log"
                        icon={HistoryIcon}
                        label={t("Activity Log")}
                        open={open}
                        selected={isSelected("/activity-log")}
                    />
                )}

                <NavItem
                    href={"#"}
                    icon={LogoutIcon}
                    label={t("Logout")}
                    open={open}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent default link behavior
                        router.post(document.location.origin + "/logout"); // Call your logout function here
                    }}
                />
            </List>
        </>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label={t("open drawer")}
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <MenuIcon fontSize="large" />
                    </IconButton>
                    <Grid
                        container
                        spacing={2}
                        sx={{
                            alignItems: { sm: "center", xs: "start" },
                            justifyContent: "space-between",
                            width: "100%",
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                        }}
                    >
                        <Typography
                            variant="h5"
                            noWrap
                            component="div"
                            sx={{
                                textTransform: "capitalize",
                                fontSize: { xs: "1rem", sm: "1.5rem" },
                            }}
                        >
                            {shop_name} | {t(pageLabel ?? '')}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ThemeToggle />
                            <Tooltip title={t("Logout")} arrow>
                                <IconButton
                                    color="inherit"
                                    onClick={(e) =>
                                        router.post(
                                            document.location.origin + "/logout"
                                        )
                                    }
                                    sx={{ display: { xs: "none", sm: "inline-flex" } }}
                                >
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onTransitionEnd={handleDrawerTransitionEnd}
                    onClose={handleDrawerClose}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: "block", sm: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                    open
                    classes={{
                        paper: "scrollParent", // Adds class to the child div
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

export default AuthenticatedLayout;
