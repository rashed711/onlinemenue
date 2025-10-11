import React from 'react';
import { ReportsSidebar } from './ReportsSidebar';
import { DashboardPage } from './DashboardPage';
import { SalesReportPage } from './SalesReportPage'; 
import { OrdersReportPage } from './OrdersReportPage';
import { ProfitReportPage } from './ProfitReportPage';
import { CustomersReportPage } from './CustomersReportPage';
import { ProductsReportPage } from './ProductsReportPage';
import { PaymentsReportPage } from './PaymentsReportPage';
import { DeliveryReportPage } from './DeliveryReportPage';
import { UserActivityReportPage } from './UserActivityReportPage';


interface ReportsRootPageProps {
  activeSubRoute?: string;
}

export const ReportsRootPage: React.FC<ReportsRootPageProps> = ({ activeSubRoute = 'dashboard' }) => {
  const renderContent = () => {
    switch (activeSubRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'sales':
        return <SalesReportPage />;
      case 'orders':
        return <OrdersReportPage />;
      case 'profit':
        return <ProfitReportPage />;
       case 'customers':
        return <CustomersReportPage />;
      case 'products':
        return <ProductsReportPage />;
      case 'payments':
        return <PaymentsReportPage />;
      case 'delivery':
        return <DeliveryReportPage />;
      case 'userActivity':
        return <UserActivityReportPage />;
      default:
        return <DashboardPage />; // Fallback to dashboard
    }
  };

  return (
    <div className="flex flex-col md:flex-row -mx-4 sm:-mx-6 lg:-mx-8 -my-8 h-[calc(100vh-5rem)]">
        <ReportsSidebar activeReport={activeSubRoute} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            {renderContent()}
        </main>
    </div>
  );
};
