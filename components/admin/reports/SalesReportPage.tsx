import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, formatNumber } from '../../../utils/helpers';
import type { Order } from '../../../types';

const getStartAndEndDates = (dateRange: string, customStart?: string, customEnd?: string): { startDate: Date, endDate: Date } => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (dateRange) {
        case 'today':
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return { startDate: todayStart, endDate: todayEnd };
        case 'yesterday':
            const yesterdayStart = new Date();
            yesterdayStart.setDate(now.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return { startDate: yesterdayStart, endDate: yesterdayEnd };
        case 'last7days':
            const last7Start = new Date();
            last7Start.setDate(now.getDate() - 6);
            last7Start.setHours(0, 0, 0, 0);
            return { startDate: last7Start, endDate: todayEnd };
        case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: thisMonthStart, endDate: todayEnd };
        case 'last30days':
             const last30Start = new Date();
            last30Start.setDate(now.getDate() - 29);
            last30Start.setHours(0, 0, 0, 0);
            return { startDate: last30Start, endDate: todayEnd };
        case 'custom':
            const customStartDateObj = customStart ? new Date(customStart) : new Date(0);
            if (customStart) customStartDateObj.setHours(0, 0, 0, 0);
            const customEndDateObj = customEnd ? new Date(customEnd) : new Date();
            if (customEnd) customEndDateObj.setHours(23, 59, 59, 999);
            return { startDate: customStartDateObj, endDate: customEndDateObj };
        default:
             const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: defaultStart, endDate: todayEnd };
    }
}

export const SalesReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useAdmin();
    const { restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    const completedStatusId = useMemo(() => {
        return restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
    }, [restaurantInfo]);

    const salesData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        return orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return o.status === completedStatusId && orderDate >= startDate && orderDate <= endDate;
            })
            .map(o => ({
                ...o,
                itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0)
            }));
    }, [orders, dateRange, completedStatusId, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.orderId, accessor: 'id' },
        { 
            Header: t.date, 
            accessor: 'timestamp',
            Cell: (row: Order) => formatDateTime(row.timestamp)
        },
        { 
            Header: t.customer, 
            accessor: 'customer',
            Cell: (row: Order) => row.customer.name
        },
        { 
            Header: t.orderType, 
            accessor: 'orderType',
            Cell: (row: Order) => t[row.orderType === 'Dine-in' ? 'dineIn' : row.orderType === 'Delivery' ? 'delivery' : 'takeaway']
        },
        { Header: t.items, accessor: 'itemCount' },
        { 
            Header: t.total, 
            accessor: 'total',
            Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}`
        },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.salesReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={salesData} onRowClick={setViewingOrder} />
        </div>
    );
};