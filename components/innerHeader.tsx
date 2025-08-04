import { Box, Button, H1, HR, Text } from '@bigcommerce/big-design';
import { ArrowBackIcon } from '@bigcommerce/big-design-icons';
import { useRouter } from 'next/router';
import { useProductList } from '../lib/hooks';
import { TabIds, TabRoutes } from './header';

const InnerHeader = () => {
    const router = useRouter();
    const { pid } = router.query;
    const { list = [] } = useProductList();
    const { name } = list.find(item => item.id === Number(pid)) ?? {};

    const handleBackClick = () => router.push(TabRoutes[TabIds.PRODUCTS]);

    return (
        <Box marginBottom="xxLarge" style={{background:"#fff","padding":"10px", borderRadius : "0.25rem", boxShadow:"0px 1px 6px rgba(49,52,64,0.2)"}}>
            <Button iconLeft={<ArrowBackIcon color="secondary50" />} variant="subtle" onClick={handleBackClick}>
                <Text bold color="secondary50">Products</Text>
            </Button>
            {name &&
                <H1>{name}</H1>
            }
        </Box>
    );
};

export default InnerHeader;
