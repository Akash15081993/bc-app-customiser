import {
  Box,
  Button,
  Dropdown,
  Flex,
  FlexItem,
  Grid,
  Modal,
} from "@bigcommerce/big-design";
import { MoreHorizIcon } from "@bigcommerce/big-design-icons";
import { useState } from "react";
import DesignDetails from "./designDetails";

const OrderActionDropdown = (props) => {
  const { id, orderId, jwtToken } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [orderitems, setOrderitems] = useState([]);

  const handleOrderView = async (id: any, orderId: any) => {
     const getOrders = await fetch(`/api/server/orders/details?context=${jwtToken}`,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }
      );
      const orderRes = await getOrders.json();
      if(orderRes?.status === true){
        setOrderitems(orderRes?.orders);
      }else{
        setOrderitems([]);
      }
      setIsOpen(true);
  };

  return (
    <>
      <Flex justifyContent="center">
        <FlexItem>
          <Dropdown
            items={[
              {
                hash: "1",
                content: "Order Items",
                onItemClick: () => {
                  handleOrderView(id, orderId);
                },
              },
            ]}
            toggle={
              <Button variant="subtle">
                <MoreHorizIcon color="#000" />
              </Button>
            }
            placement="right-start"
            style={{ textAlign: "left" }}
          />
        </FlexItem>
      </Flex>

      {isOpen && (
        <Modal
          actions={[
            {
              text: "Cancel",
              variant: "subtle",
              onClick: () => setIsOpen(false),
            }
          ]}
          closeOnClickOutside={false}
          closeOnEscKey={true}
          header="Order Items"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          variant="dialog"
        >
            <Grid style={{
              maxHeight:'calc(100vh - 250px)'
            }}>
                {
                  orderitems?.map((product) => (
                    <>
                    <Flex flexGap={'25px'} alignItems={'flex-start'} style={{borderBottom:'1px solid #3C64F4', paddingBottom:'30px', marginBottom:'30px'}} >
                      <Box style={{border:'1px solid #ccc'}}>
                        { product?.previewUrl != null ? <img src={product?.previewUrl} alt="" width={120} /> : <img src={'/assets/coming-soon-img.gif'} alt="" width={120} height={80} style={{objectFit:'contain'}} /> }
                      </Box>
                      <Flex flexGap={'10px'} flexDirection={'column'}>
                        <Box><b>{product?.productName}</b></Box>
                        <Box><b>SKU:</b> {product?.productSku}</Box>
                        <Box><b>Quantity:</b> {JSON.parse(product?.productJson)?.quantity}</Box>
                        <Box><b>Price:</b> {parseFloat(JSON.parse(product?.productJson)?.total_inc_tax)?.toFixed(2) || 0}</Box>
                        {product?.designId > 0 && (
                          <>
                            <Box><b>Design Id:</b> {product?.designId}</Box>

                            <Box style={{wordBreak:"break-word"}} marginTop={"large"}>
                              <b>Design Area:</b> 
                              <DesignDetails data={JSON.parse(product?.designArea)} />
                            </Box> 
                            {/* <Box style={{wordBreak:"break-word"}}>
                              <b>Design Area:</b> <br />
                              {product?.designArea}
                            </Box> */}
                          </>
                        )}
                      </Flex>
                    </Flex>
                    </>
                  ))
                }
            </Grid>

        </Modal>
      )}
    </>
  );
};

export default OrderActionDropdown;
