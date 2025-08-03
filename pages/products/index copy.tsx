import { Button, Dropdown, Panel, Small, Link as StyledLink, Switch, Table, TableSortDirection } from '@bigcommerce/big-design';
import { MoreHorizIcon } from '@bigcommerce/big-design-icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactElement, useState } from 'react';
import ErrorMessage from '../../components/error';
import Loading from '../../components/loading';
import { useProductList } from '../../lib/hooks';
import { TableItem } from '../../types';
import SwitchDesigner from '@components/products/switchDesigner';

const Products = () => {
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [columnHash, setColumnHash] = useState('');
    const [direction, setDirection] = useState<TableSortDirection>('ASC');
    const router = useRouter();

    

    const { error, isLoading, list = [], meta = {} } = useProductList({
      page: String(currentPage),
      limit: String(itemsPerPage),
      ...(columnHash && { sort: columnHash }),
      ...(columnHash && { direction: direction.toLowerCase() }),
    });
    const itemsPerPageOptions = [10, 20, 50, 100];
    const tableItems: TableItem[] = list.map(({ id, inventory_level: stock, name, price }) => ({
        id,
        name,
        price,
        stock,
    }));

    const onItemsPerPageChange = newRange => {
        setCurrentPage(1);
        setItemsPerPage(newRange);
    };

    const onSort = (newColumnHash: string, newDirection: TableSortDirection) => {
        setColumnHash(newColumnHash === 'stock' ? 'inventory_level' : newColumnHash);
        setDirection(newDirection);
    };

    const renderName = (id: number, name: string): ReactElement => (
        <Link href={`/products/${id}`}>
            <StyledLink>{name}</StyledLink>
        </Link>
    );

    const renderAction = (id: number): ReactElement => (
        <Dropdown
            items={[ { content: 'Edit product', onItemClick: () => router.push(`/products/${id}`), hash: 'edit' } ]}
            toggle={<Button iconOnly={<MoreHorizIcon color="secondary60" />} variant="subtle" />}
        />
    );
    const renderDesigner = (id: number): ReactElement => (
        <SwitchDesigner id={id} />
    );

    if (isLoading) return <Loading />;
    if (error) return <ErrorMessage error={error} />;

    

    return (
        <Panel id="products">
            <Table
                columns={[
                    { header: 'Product name', hash: 'name', render: ({ id, name }) => renderName(id, name), isSortable: true },
                    { header: 'Designer', hash: 'designer', render: ({id}) => renderDesigner(id), isSortable: false },
                    { header: 'Action', hideHeader: true, hash: 'id', render: ({ id }) => renderAction(id) },
                ]}
                items={tableItems}
                itemName="Products"
                pagination={{
                    currentPage,
                    totalItems: meta?.pagination?.total,
                    onPageChange: setCurrentPage,
                    itemsPerPageOptions,
                    onItemsPerPageChange,
                    itemsPerPage,
                }}
                sortable={{
                  columnHash,
                  direction,
                  onSort,
                }}
                stickyHeader
            />
        </Panel>
    );
};

export default Products;
