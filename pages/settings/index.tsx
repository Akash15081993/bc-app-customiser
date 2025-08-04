import { Box, Button, Flex, FlexItem, FormGroup, Input, Panel, Switch } from "@bigcommerce/big-design";
import { AddIcon, AssignmentIcon, CheckIcon } from "@bigcommerce/big-design-icons";
import { useProductList } from "@lib/hooks";
import { useSession } from "context/session";
import { useState } from "react";

const Settings = () => {
  const [ enableShare, setEnableShare] = useState(false);
  const handleChange = () => setEnableShare(!enableShare);

    return (
        <Panel id="settings">
            
            <h2 style={{margin:'0 0 20px 0'}}><AssignmentIcon /> General Settings</h2>

            <Panel>
                <Flex justifyContent="space-between">
                    Enable share button <Switch checked={enableShare} onChange={handleChange} />
                </Flex>
            </Panel>

            <Panel>
                <Input
                    label="Custom selector for Designer Button"
                    description="Enter the class or ID of the location where you want the button (if using a custom theme)."
                    name="name"
                    required
                    value={''}
                    placeholder="Example: .add-to-cart-buttons"
                    width="small"
                    onChange={(e) => {}}
                />
            </Panel>

            <Box style={{margin:'20px 0 0 0'}}>
                <Button variant="primary">
                    <AddIcon/> Save
                </Button>
            </Box>


        </Panel>
    );
};

export default Settings;
