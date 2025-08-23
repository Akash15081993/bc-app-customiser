import {
  Button,
  Flex,
  FlexItem,
  Input,
  Message,
  Panel,
  Table,
} from "@bigcommerce/big-design";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "@components/loading";
import OrderActionDropdown from "@components/orders/orderAction";
import { useSession } from "context/session";

const Orders = () => {
  const router = useRouter();
  const encodedContext = useSession()?.context;
  const [pageLoading, setpageLoading] = useState(true);
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([15, 35, 50, 80]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentItems, setCurrentItems] = useState<any[]>([]);

  const [paginationData, setPaginationData] = useState({
    total: 0,
    current_page: 1,
    per_page: 15,
  });

  const [searchOrderId, setSearchOrderId] = useState("");

  const onPageChange = (page) => {
    setCurrentPage(page);
    getOrders(page, itemsPerPage);
  };

  const onItemsPerPageChange = (perPage) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    getOrders(1, perPage);
  };

  const getOrders = async (page = 1, perPage = itemsPerPage) => {
    setpageLoading(true);
    setPageError("");

    if (encodedContext == "") {
      router.push("unthorization-error");
      return;
    }

    try {
      const getOrders = await fetch(
        `/api/server/orders/all?context=${encodedContext}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, limit: perPage }),
        }
      );
      const orderRes = await getOrders.json();

      if (orderRes?.message) {
        setPageError(orderRes?.message);
      }

      const orders = orderRes?.orders;
      const pagination = orderRes?.pagination;
      setCurrentItems(orders);
      setPaginationData({
        total: pagination?.totalItems,
        current_page: pagination?.totalItems,
        per_page: pagination?.perPage,
      });

      setpageLoading(false);
    } catch (error) {
      setpageLoading(false);
      setPageError(error?.message);
    }
  };

  // handle search
  const handleSearch = async () => {
    if (!searchOrderId.trim()) {
      return;
    }
    const getOrders = await fetch(
      `/api/server/orders/search?context=${encodedContext}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchOrderId }),
      }
    );
    const orderRes = await getOrders.json();
    const orders = orderRes?.orders;
    setCurrentItems(orders || []);
  };

  useEffect(() => {
    getOrders();
  }, [encodedContext]);

  return (
    <Panel id="orders">
      {pageSuccess && (
        <Message
          header={pageSuccess.split("|@|")[0]}
          marginVertical="medium"
          messages={[{ text: "" }]}
          onClose={() => setPageSuccess("")}
          type="success"
          style={{ marginBottom: "20px" }}
        />
      )}

      {pageError && (
        <Message
          marginVertical="medium"
          messages={[{ text: pageError }]}
          onClose={() => setPageError("")}
          type="error"
          style={{ marginBottom: "20px" }}
        />
      )}

      {!pageLoading && currentItems?.length > 0 && (
        <p style={{ marginBottom: "25px" }}>
          You will only see orders for customized products in this list.
        </p>
      )}

      {/* Search box */}
      <Flex marginBottom="medium" alignItems="center">
        <Input
          placeholder="Search by Order ID"
          value={searchOrderId}
          onChange={(e) => setSearchOrderId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button marginLeft="small" onClick={handleSearch}>
          Search
        </Button>

        <Button
          variant="secondary"
          marginLeft="small"
          onClick={() => {
            getOrders();
            setSearchOrderId("");
          }}
        >
          Clear
        </Button>
      </Flex>

      {!pageLoading && currentItems?.length > 0 && (
        <Table
          columns={[
            {
              header: "Order Id",
              hash: "orderId",
              render: ({ orderId }) => orderId,
              isSortable: true,
            },
            {
              header: "Total Items",
              hash: "totalItems",
              render: ({ order_items_total }) => order_items_total,
            },
            {
              header: "Inc. Total",
              hash: "totalItems",
              render: ({ order_total_inc_tax }) => order_total_inc_tax,
              isSortable: true,
            },
            {
              header: "Ex. Total",
              hash: "totalItems",
              render: ({ order_total_ex_tax }) => order_total_ex_tax,
              isSortable: true,
            },
            {
              header: "Action",
              hash: "action",
              render: ({ id, orderId }) => (
                <OrderActionDropdown
                  {...{
                    id,
                    orderId,
                    jwtToken: encodedContext,
                  }}
                />
              ),
              align: "left",
              width: 80,
            },
          ]}
          items={currentItems}
          itemName="Orders"
          stickyHeader
          pagination={{
            currentPage,
            totalItems: paginationData.total,
            itemsPerPage,
            onPageChange,
            onItemsPerPageChange,
            itemsPerPageOptions,
          }}
        />
      )}

      {!pageLoading && currentItems?.length == 0 && (
        <Flex justifyContent="center" style={{ padding: "40px 0" }}>
          <FlexItem>
            <center>You have no any order.</center>
          </FlexItem>
        </Flex>
      )}

      {pageLoading && <Loading />}
    </Panel>
  );
};

export default Orders;
