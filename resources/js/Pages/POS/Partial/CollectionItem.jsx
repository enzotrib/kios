import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Folder } from 'lucide-react';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import { t } from '@/i18n';

export default function CollectionItem({ collection, onClick, hasChildren = false }) {

    // El tipo viene crudo de la base ('category' | 'brand' | 'tag'): aca se
    // traduce a una etiqueta legible y se resuelve el color con tokens, igual
    // que en StatCard, para que no aparezcan colores fuera del sistema.
    const TYPES = {
        category: { Icon: CategoryIcon, fg: 'var(--primary)', bg: 'var(--primary-soft)', label: t('Category') },
        brand: { Icon: BrandingWatermarkIcon, fg: 'var(--chart-5)', bg: 'var(--surface-2)', label: t('Brand') },
        tag: { Icon: LocalOfferIcon, fg: 'var(--success)', bg: 'var(--success-soft)', label: t('Tag') },
    };

    const type = TYPES[collection.collection_type] ?? {
        Icon: null, fg: 'var(--muted-foreground)', bg: 'var(--surface-2)', label: collection.collection_type,
    };
    const TypeIcon = type.Icon;

    return (
        <Card
            sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                },
                backgroundColor: 'background.paper',
                position: 'relative'
            }}
            onClick={() => onClick(collection)}
        >
            {/* Parent Category Indicator */}
            {hasChildren && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Folder size={18} />
                </Box>
            )}
            <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 2
            }}>
                <Box sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: type.bg,
                    color: type.fg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {TypeIcon ? <TypeIcon fontSize="large" color="inherit" /> : <Folder size={32} color="currentColor" />}
                </Box>

                <Typography variant="body1" component="div" align="center" noWrap sx={{ width: '100%', fontWeight: 600 }}>
                    {collection.name}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                    {type.label}
                </Typography>
            </CardContent>
        </Card>
    );
}
