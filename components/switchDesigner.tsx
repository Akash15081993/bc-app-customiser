import { Flex, FlexItem, Switch } from "@bigcommerce/big-design";
import { useState } from "react";

const SwitchDesigner = (props) => {

    const {pageLoading, serachButtonLoading, pageSuccess, pageRender, productId, name, modifiers } = props;

    let alreadyDesigner = false;
    if(modifiers?.length > 0){
        modifiers?.map((ls) => {
            if(ls?.display_name == "View Your Design"){ alreadyDesigner = true; }
        })
    }

    const [checked, setChecked] = useState(alreadyDesigner);

    const handleChange = (e) => {
        pageSuccess('')
        const productId = e?.target?.value;
        if(productId > 0){
            pageLoading(true);
            serachButtonLoading(true);
            setChecked(!checked);
            setTimeout(() => {
                pageLoading(false);
                serachButtonLoading(false);
                pageSuccess(`Product ( ${name} ) added successfully for customization.|@|Please go to the admin portal to update the design of the add-on.`);
                pageRender((prev) => !prev);
            }, 4000);
        }
    };

    return (
         <Flex justifyContent="center">
            <FlexItem>
                <Switch checked={checked} onChange={(handleChange)} value={alreadyDesigner ? 0:productId} key={productId} disabled={Boolean(alreadyDesigner)} />
            </FlexItem>
        </Flex>
    );
};

export default SwitchDesigner;
