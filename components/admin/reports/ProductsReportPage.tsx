import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { useData } from '../../../contexts/DataContext';
import { getStartAndEndDates } from '../../../utils/helpers';
import type { Product } from '../../../types';

export const ProductsReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders } = useAdmin();
    const { products, categories } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const productsData = useMemo(() => {
        const productStats: { [id: string]: { quantitySold: number; revenue: number } } = {};

        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= startDate && orderDate <= endDate;
            })
            .forEach(order => {
                order.items.forEach(item => {
                    if (!productStats[item.product.id]) {
                        productStats[item.product.id] = { quantitySold: 0, revenue: 0 };
                    }
                    productStats[item.product.id].quantitySold += item.quantity;
                    productStats[item.product.id].revenue += item.product.price * item.quantity;
                });
            });

        return products.map(product => ({
            ...product,
            categoryName: categories.find(c => c.id === product.categoryId)?.name[language] || 'N/A',
            quantitySold: productStats[product.id]?.quantitySold || 0,
            revenue: productStats[product.id]?.revenue || 0,
        })).filter(p => p.quantitySold > 0);

    }, [orders, products, categories, dateRange, language, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.product, accessor: 'name', Cell: (row: Product) => row.name[language] },
        { Header: t.category, accessor: 'categoryName' },
        { Header: t.quantitySold, accessor: 'quantitySold' },
        { Header: t.revenue, accessor: 'revenue', Cell: (row: any) => `${row.revenue.toFixed(2)} ${t.currency}` },
    ], [t, language]);

    return (
        <div>
            <ReportHeader 
                title={t.productsReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={productsData} />
        </div>
    );
};