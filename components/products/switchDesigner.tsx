import { Flex, FlexItem, Switch } from "@bigcommerce/big-design";
import languageEN from "lang/en";
import { useState } from "react";

const SwitchDesigner = (props) => {

    const {jwtToken, pageLoading, serachButtonLoading, pageSuccess, pageRender, productId, productName, productSku, modifiers, defaultImage } = props;
    const { modifierDisplayNames } = languageEN;

    let alreadyDesigner = false;
    if(modifiers?.length > 0){
        modifiers?.map((ls) => {
            if(ls?.display_name == modifierDisplayNames.viewDesign){ alreadyDesigner = true; }
        })
    }

    const [checked, setChecked] = useState(alreadyDesigner);

    const handleChange = (e) => {
        pageSuccess('')
        const productId = parseInt(e?.target?.value);
        if(productId > 0){
            pageLoading(true);
            serachButtonLoading(true);
            setChecked(!checked);
            setTimeout(async () => {
                
                await fetch(`/api/server/products/modifiers?context=${jwtToken}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, productSku, productName, defaultImage, designerChecked:checked }),
                });
                
                pageLoading(false);
                serachButtonLoading(false);
                pageSuccess(`Product ( ${productName} ) added successfully for customization.|@|Please go to the admin portal to update the design of the add-on.`);
                pageRender((prev) => !prev);

            }, 100);
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
