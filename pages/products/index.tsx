import { Button, Flex, FlexItem, Panel } from "@bigcommerce/big-design";
import { AddIcon } from "@bigcommerce/big-design-icons";
import { useRouter } from "next/router";

const Products = () => {
    const router = useRouter();

    return (
        <Panel id="products">
            <Flex justifyContent="flex-start">
                <FlexItem>
                    <Button actionType="normal" isLoading={false} variant="primary" onClick={() => { router.push(`/product-form`) }}>
                        <AddIcon /> Add product for design
                    </Button>
                </FlexItem>
            </Flex>
        </Panel>
    );
};

export default Products;
