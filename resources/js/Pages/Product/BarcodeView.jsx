import React, { useEffect, useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Box,  Grid, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import Swal from 'sweetalert2';
import Alpine from 'alpinejs';
import numeral from 'numeral';
import Mustache from 'mustache';
import { t } from '@/i18n';
const BarcodeView = ({ product, template, barcode_settings, }) => {
    const [renderedTemplate, setRenderedTemplate] = useState('');

    useEffect(() => {
        const renderTemplate = async () => {
            try {
                // e.g. {{quotation.name}} will render "Sample Quotation"
                // e.g. {{#quotation.items}}<p>{{name}}: {{price}}</p>{{/quotation.items}}
                const renderedTemplate = Mustache.render(template, {product_name:product.name, price:product.price, logo:window.location.origin +"/" +barcode_settings.shop_logo});
                setRenderedTemplate(renderedTemplate);
                if (!window.Alpine || !window.Alpine.version) {
                    window.Alpine = Alpine
                    Alpine.start();
                }
            } catch (error) {
                console.error("Error rendering template:", error);
                Swal.fire('Error', 'Failed to render template', 'error');
            }
        };
        renderTemplate();
    }, [template]);

    return (
        <>
            <Head title={t("Barcode")} />
            <div dangerouslySetInnerHTML={{ __html: renderedTemplate }} />
        </>

    );
};

export default BarcodeView;

