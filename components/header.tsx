import { Box, Tabs } from '@bigcommerce/big-design';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InnerHeader from './innerHeader';

export const TabIds = {
    HOME: 'home',
    PRODUCTS: 'products',
    SETTINGS: 'settings',
};

export const TabRoutes = {
    [TabIds.HOME]: '/',
    [TabIds.PRODUCTS]: '/products',
    [TabIds.SETTINGS]: '/settings',
};

const HeaderlessRoutes = [
    '/orders/[orderId]',
    '/orders/[orderId]/labels',
    '/orders/[orderId]/modal',
    '/productAppExtension/[productId]',
];

const InnerRoutes = [
    '/product-form',
    '/products/[pid]',
];

const HeaderTypes = {
    GLOBAL: 'global',
    INNER: 'inner',
    HEADERLESS: 'headerless',
};

const Header = () => {
    const [activeTab, setActiveTab] = useState<string>('');
    const [headerType, setHeaderType] = useState<string>(HeaderTypes.GLOBAL);
    const router = useRouter();
    const { pathname } = router;

    useEffect(() => {
        if (InnerRoutes.includes(pathname)) {
            // Use InnerHeader if route matches inner routes
            setHeaderType(HeaderTypes.INNER);
        } else if (HeaderlessRoutes.includes(pathname)) {
            setHeaderType(HeaderTypes.HEADERLESS);
        } else {
            // Check if new route matches TabRoutes
            const tabKey = Object.keys(TabRoutes).find(key => TabRoutes[key] === pathname);

            // Set the active tab to tabKey or set no active tab if route doesn't match (404)
            setActiveTab(tabKey ?? '');
            setHeaderType(HeaderTypes.GLOBAL);
        }

    }, [pathname]);

    // useEffect(() => {
    //     // Prefetch products page to reduce latency (doesn't prefetch in dev)
    //     //router.prefetch('/products');
    // });

    const items = [
        { ariaControls: 'home', id: TabIds.HOME, title: 'Dashborad' },
        { ariaControls: 'products', id: TabIds.PRODUCTS, title: 'Products' },
        { ariaControls: 'settings', id: TabIds.SETTINGS, title: 'Settings' },
    ];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        return router.push(TabRoutes[tabId]);
    };

    if (headerType === HeaderTypes.HEADERLESS) return null;
    if (headerType === HeaderTypes.INNER) return <InnerHeader />;

    return (
        <header className='app-top-header'>
            <img className='app-top-logo' src='/assets/app-logo.png' width={130} height={40} onClick={() => { router.push(`/`) }} />
            <Tabs
                activeTab={activeTab}
                items={items}
                onTabClick={handleTabClick}
            />
        </header>
    );
};

export default Header;
