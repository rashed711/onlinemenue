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
            // If a specific payment detail is recorded (and it's not just the default COD placeholder),
            // it means the payment has been collected or confirmed, so it's "Paid".
            if (order.paymentDetail && order.paymentDetail !== t.cashOnDelivery) {
                return t.paymentStatusPaidOnline; // Using this as a generic "Paid" status.
            }
            
            // For orders initiated as "Online Payment", we consider them in a "paid" state.
            if (order.paymentMethod === 'online') {
                return t.paymentStatusPaidOnline;
            }
            
            // For "Cash on Delivery" orders where payment hasn't been specifically recorded yet.
            if (order.paymentMethod === 'cod') {
                return t.paymentStatusCod;
            }

            // Default for orders without a predefined payment method (like Dine-in) and no recorded payment.
            return t.paymentStatusUnpaid;
        };

        return [
            { Header: t.orderId, accessor: 'id' },
            { Header: t.date, accessor: 'timestamp', Cell: (row: Order) => formatDateTime(row.timestamp) },
            { 
                Header: t.paymentMethod, 
                accessor: 'paymentMethod', 
                Cell: (row: Order) => {
                    // Priority 1: Show the specific, recorded payment detail if it exists.
                    if (row.paymentDetail) {
                        return row.paymentDetail;
                    }
                    // Priority 2: Fallback to the general method selected at checkout.
                    if (row.paymentMethod === 'cod') {
                        return t.cashOnDelivery;
                    }
                    if (row.paymentMethod === 'online') {
                        return t.onlinePayment;
                    }
                    // Fallback for types like Dine-in before payment is recorded.
                    return 'N/A';
                }
            },
            { Header: t.paymentStatus, accessor: 'status', Cell: getPaymentStatusText },
            { Header: t.total, accessor: 'total', Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}` },
        ];
    }, [t]);
    
    const totals = useMemo(() => paymentData.reduce((acc, order) => {
        if (order.paymentMethod === 'online' || (order.paymentDetail && order.paymentMethod !== 'cod')) {
             acc.online += order.total;
        } else if (order.paymentMethod === 'cod' || (order.paymentDetail && order.paymentMethod === 'cod')) {
             acc.cod += order.total;
        }
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
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.totalPaidOnline}</h4><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.online.toFixed(2)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.totalCOD}</h4><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.cod.toFixed(2)}</p></div>
            </div>
            <DataTable columns={columns} data={paymentData} onRowClick={setViewingOrder} />
        </div>
    );
};