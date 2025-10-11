import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { formatDate } from '../../../utils/helpers';
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

export const CustomersReportPage: React.FC = () => {
    const { t } = useUI();
    const { orders } = useAdmin();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const customerData = useMemo(() => {
        const customerMap: { [mobile: string]: { name: string; mobile: string; firstOrder: Date; lastOrder: Date; totalOrders: number; totalSpent: number; } } = {};
        
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        
        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });

        filteredOrders.forEach(order => {
            const mobile = order.customer.mobile;
            if (!mobile || order.orderType === 'Dine-in') return; // Exclude dine-in table "customers"

            const orderDate = new Date(order.timestamp);
            if (!customerMap[mobile]) {
                customerMap[mobile] = {
                    name: order.customer.name || 'N/A',
                    mobile: mobile,
                    firstOrder: orderDate,
                    lastOrder: orderDate,
                    totalOrders: 0,
                    totalSpent: 0,
                };
            }
            
            const customer = customerMap[mobile];
            customer.totalOrders += 1;
            customer.totalSpent += order.total;
            if (orderDate < customer.firstOrder) customer.firstOrder = orderDate;
            if (orderDate > customer.lastOrder) customer.lastOrder = orderDate;
        });

        return Object.values(customerMap);
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.customer, accessor: 'name' },
        { Header: t.mobileNumber, accessor: 'mobile' },
        { Header: t.totalOrders, accessor: 'totalOrders' },
        { Header: t.totalSpent, accessor: 'totalSpent', Cell: (row: any) => `${row.totalSpent.toFixed(2)} ${t.currency}` },
        { Header: t.firstOrderDate, accessor: 'firstOrder', Cell: (row: any) => formatDate(row.firstOrder.toISOString()) },
        { Header: t.lastOrderDate, accessor: 'lastOrder', Cell: (row: any) => formatDate(row.lastOrder.toISOString()) },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.customersReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={customerData} />
        </div>
    );
};
