import React from 'react';
import { Button, IconButton } from '@mui/material';
import { Barcode, History, Star } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useCurrencyFormatter } from '@/lib/currencyFormatter';
import { t } from '@/i18n';

const ProductsList = ({ products, handleProductEdit }) => {
    const formatCurrency = useCurrencyFormatter();
    return (
        <ul className='faded-bottom no-scrollbar grid gap-2 overflow-auto pt-1 pb-1 w-full'>
            {products.map((product) => (
                <li className="p-3 w-full shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="uppercase tracking-wide text-sm text-[var(--info)] font-semibold">
                            <Link
                                href={"/products/" + product.id + "/edit"}
                            >
                                {product.name}
                            </Link>
                        </div>
                        <div className='flex ml-2'>
                            <IconButton>
                                <Star size={20} />
                            </IconButton>
                            <IconButton onClick={()=>router.visit(`/quantity/${product.stock_id}/log`)}>
                                <History size={20} />
                            </IconButton>
                            <IconButton onClick={()=>router.visit(`/product/${product.batch_id}/barcode-v2`)}>
                                <Barcode size={20} />
                            </IconButton>
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                        <div onClick={() => handleProductEdit(product, 'batch')}>
                            <div className="text-[var(--muted-foreground)] text-sm">{t("Sale Price")}</div>
                            <div className="text-[var(--foreground)] text-sm font-bold">{formatCurrency(product.price, false)}</div>
                        </div>
                        <div onClick={() => handleProductEdit(product, 'batch')}>
                            <div className="text-[var(--muted-foreground)] text-sm">{t("Cost")}</div>
                            <div className="text-[var(--foreground)] text-sm font-bold">{formatCurrency(product.cost, false)}</div>
                        </div>
                        <div onClick={() => handleProductEdit(product, 'qty')}>
                            <div className="text-[var(--muted-foreground)] text-sm">{t("In Stock")}</div>
                            <div className="text-[var(--foreground)] text-sm font-bold">{product.quantity}</div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ProductsList;
