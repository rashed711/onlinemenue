import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import type { User } from '../../../types';

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


export const UserActivityReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, users, roles } = useAdmin();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const activityData = useMemo(() => {
        const userStats: { [userId: string]: { ordersCreated: number; totalSalesValue: number } } = {};

        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return o.createdBy && orderDate >= startDate && orderDate <= endDate;
            })
            .forEach(order => {
                const userId = order.createdBy!.toString();
                if (!userStats[userId]) {
                    userStats[userId] = { ordersCreated: 0, totalSalesValue: 0 };
                }
                userStats[userId].ordersCreated += 1;
                userStats[userId].totalSalesValue += order.total;
            });
        
        return users
            .map(user => ({
                ...user,
                roleName: roles.find(r => r.key === user.role)?.name[language] || user.role,
                ordersCreated: userStats[user.id]?.ordersCreated || 0,
                totalSalesValue: userStats[user.id]?.totalSalesValue || 0,
            }))
            .filter(u => u.ordersCreated > 0);

    }, [orders, users, roles, dateRange, language, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.user, accessor: 'name' },
        { Header: t.role, accessor: 'roleName' },
        { Header: t.ordersCreated, accessor: 'ordersCreated' },
        { Header: t.totalSalesValue, accessor: 'totalSalesValue', Cell: (row: any) => `${row.totalSalesValue.toFixed(2)} ${t.currency}` },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.userActivityReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={activityData} />
        </div>
    );
};
