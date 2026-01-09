import React from 'react';
import { AdminPage } from './AdminPage';

interface AdminWrapperProps {
    activeSubRoute: string;
    reportSubRoute?: string;
}

const AdminWrapper: React.FC<AdminWrapperProps> = ({ activeSubRoute, reportSubRoute }) => {
    return (
        <AdminPage activeSubRoute={activeSubRoute} reportSubRoute={reportSubRoute} />
    );
};

export default AdminWrapper;