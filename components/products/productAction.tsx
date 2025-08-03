import { Button, Dropdown, Flex, FlexItem, Switch } from "@bigcommerce/big-design";
import { MoreHorizIcon } from "@bigcommerce/big-design-icons";
import { useState } from "react";

const ProductActionDropdown = (props) => {

    const {pageRender, pageSuccess, pageLoading, id, productId, jwtToken } = props;

    const handleProductSync = (id:any, productId:any) => {
    };

    const handleRemove = (id, productId) => {
        if(productId > 0){
            setTimeout(async () => {
                pageLoading(true);
                await fetch(`/api/server/products/remove-modifiers?context=${jwtToken}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, productId }),
                });
                pageLoading(false);
                pageSuccess(`Product remove successfully for customization.`);
                pageRender((prev) => !prev);
            }, 100);
        }
    };

    return (
         <Flex justifyContent="center">
            <FlexItem>
                <Dropdown
                items={[
                    {
                        hash: '1',
                        content: 'Sync Product',
                        description: 'Sync products with your BigCommerce Admin panel.',
                        onItemClick: () => { handleProductSync(id, productId) },
                    },
                    {
                        actionType: 'destructive',
                        hash: '2',
                        content: 'Remove',
                        description: 'Remove product for design',
                        onItemClick: () => { handleRemove(id, productId) },
                    }
                ]}
                toggle={<Button variant="subtle"><MoreHorizIcon color="#000" /></Button>}
                placement="right-start"
                style={{textAlign:"left"}}
                />
            </FlexItem>
        </Flex>
    );
};

export default ProductActionDropdown;
