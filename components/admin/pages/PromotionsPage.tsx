import React from 'react';
import type { Promotion, Product } from '../../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../../icons/Icons';
import { useUI } from '../../../contexts/UIContext';
import { formatDate } from '../../../utils/helpers';

interface PromotionsPageProps {
    hasPermission: (permission: string) => boolean;
    setEditingPromotion: (promotion: Promotion | 'new') => void;
    allPromotions: Promotion[];
    allProducts: Product[];
    handleTogglePromotionStatus: (promotion: Promotion) => void;
    deletePromotion: (promotionId: number) => void;
}

export const PromotionsPage: React.FC<PromotionsPageProps> = (props) => {
    const { t, language } = useUI();
    const {
        hasPermission, setEditingPromotion, allPromotions, allProducts,
        handleTogglePromotionStatus, deletePromotion
    } = props;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.managePromotions}</h2>
                {hasPermission('add_promotion') && <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewPromotion}</button>}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.promotionTitleEn}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.linkedProduct}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.discountPercent}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.endDate}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.isActive}</th>
                            {(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {allPromotions.map(promo => {
                            const product = allProducts.find(p => p.id === promo.productId);
                            return (
                            <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{promo.title[language]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{product?.name[language] || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{promo.discountPercent}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDate(promo.endDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={promo.isActive} onChange={() => hasPermission('edit_promotion') && handleTogglePromotionStatus(promo)} disabled={!hasPermission('edit_promotion')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></td>
                                {(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_promotion') && <button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_promotion') && <button onClick={() => deletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
