import * as React from 'react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Grid from '@mui/material/Grid';
import { Button, Box, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';


import FormDialog from './UserFormDialog';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';
import { t } from '@/i18n';
import DataTable from '@/Components/design/DataTable';


  const columns = (handleAction) => [
    { field: 'name', headerName: t("Profile Name"), width: 200,
      renderCell: (params) => (
        <p
          onClick={() => handleAction(params.row, 'edit')}
          className='cursor-pointer font-bold'
        >
          {params.value}
        </p>
      ),
    },
    { field: 'user_name', headerName: t("User Name"), width: 150 },
    { field: 'user_role', headerName: t("User Role"), width: 150 },
    { field: 'email', headerName: t("Email"), width: 150 },
    { field: 'store_name', headerName: t("Store"), width: 150 },
    { field: 'created_at', headerName: t("Created At"), width: 200,
      renderCell: (params) => (
        <p>{dayjs(params.value).format('YYYY-MM-DD hh:mm A')}</p>
      )
     },
     {field: "action", headerName: t("Actions"), width: 100,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleAction(params.row, 'deactivate')}
          variant="contained"
          color='error'
          sx={{fontWeight:'bold'}}
        >
          <X />
        </IconButton>
      ),
     }
  ];

 export default function User({users, stores, roles}) {
    const auth = usePage().props.auth.user
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleClickOpen = () => {
        setSelectedUser(null);
        setOpen(true);
    };

    const handleAction = (user, action) => {
        if (action === "edit") {
          setSelectedUser(user); // Set selected user for editing
          setOpen(true);
        }
        else if (action === "deactivate") {
          console.log(user.id);
          Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this action!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, deactivate!'
          }).then((result) => {
            if (result.isConfirmed) {
              axios.post(`/users/${user.id}/deactivate`)
                .then((response) => {
                  Swal.fire(
                    'Deactivated!',
                    `User ${user.name} has been deactivated.`,
                    'success'
                  );
                  router.reload();
                })
                .catch((error) => {
                  Swal.fire(
                    'Failed',
                    error.response.data.message,
                    'error'
                  );
                });
            }
          });
        }
    }

    const handleClose = () => {
        setSelectedUser(null);
        setOpen(false);
    };

   
    return (
        <AuthenticatedLayout>
          
            <Head title={t("User")} />
                <Grid container spacing={2} sx={{ alignItems: 'center', width: "100%" }}>
                    <Grid size={12} container sx={{ justifyContent: 'end' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>{t("Add User")}</Button>
                    </Grid>

                    <Box className='py-6 w-full' sx={{display: 'grid', gridTemplateColumns: '1fr'}}>
                      <DataTable 
                      rows={users}
                      columns={columns(handleAction)}
                      pageSize={5}
                      slotProps={{
                          toolbar: {
                            showQuickFilter: true,
                          },
                        }}
                      />
                  </Box>
                </Grid>

                <FormDialog open={open} handleClose={handleClose} stores={stores} user={selectedUser} roles={roles}/>
            
        </AuthenticatedLayout>
    );
}
