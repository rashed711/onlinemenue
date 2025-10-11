import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const PaymentsReportPage: React.FC = () => {
    const { t } = useUI();
    const { orders, setViewingOrder } = useAdmin();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const paymentData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => {
        const getPaymentStatusText = (order: Order) => {
            if (order.orderType === 'Delivery') {
                return order.paymentMethod === 'cod' ? t.paymentStatusCod : t.paymentStatusPaidOnline;
            }
            return t.paymentStatusUnpaid;
        };
        return [
            { Header: t.orderId, accessor: 'id' },
            { Header: t.date, accessor: 'timestamp', Cell: (row: Order) => formatDateTime(row.timestamp) },
            { Header: t.paymentMethod, accessor: 'paymentMethod', Cell: (row: Order) => row.paymentMethod ? t[row.paymentMethod as 'cod' | 'online'] : 'N/A' },
            { Header: t.paymentStatus, accessor: 'status', Cell: getPaymentStatusText },
            { Header: t.total, accessor: 'total', Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}` },
        ];
    }, [t]);
    
    const totals = useMemo(() => paymentData.reduce((acc, order) => {
        if (order.paymentMethod === 'online') acc.online += order.total;
        else if (order.paymentMethod === 'cod') acc.cod += order.total;
        return acc;
    }, { online: 0, cod: 0}), [paymentData]);

    return (
        <div>
            <ReportHeader 
                title={t.paymentsReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.totalPaidOnline}</h4><p className="text-2xl font-bold">{totals.online.toFixed(2)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.totalCOD}</h4><p className="text-2xl font-bold">{totals.cod.toFixed(2)}</p></div>
            </div>
            <DataTable columns={columns} data={paymentData} onRowClick={setViewingOrder} />
        </div>
    );
};