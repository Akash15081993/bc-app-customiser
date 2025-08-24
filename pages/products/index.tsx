import {
  Button,
  Flex,
  FlexItem,
  Input,
  Message,
  Panel,
  Table,
} from "@bigcommerce/big-design";
import { AddIcon } from "@bigcommerce/big-design-icons";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "@components/loading";
import ProductActionDropdown from "@components/products/productAction";
import { useSession } from "context/session";

const Products = () => {
  const router = useRouter();
  const encodedContext = useSession()?.context;
  const [pageLoading, setpageLoading] = useState(true);
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageRender, setPageRender] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([15, 35, 50, 80]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentItems, setCurrentItems] = useState<[]>([]);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchProductId, setSearchProductId] = useState("");

  const [paginationData, setPaginationData] = useState({
    total: 0,
    current_page: 1,
    per_page: 5,
  });

  const onPageChange = (page) => {
    setCurrentPage(page);
    getProduct(page, itemsPerPage);
  };

  const onItemsPerPageChange = (perPage) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    getProduct(1, perPage);
  };

  const getProduct = async (page = 1, perPage = itemsPerPage) => {
    setpageLoading(true);
    setPageError("");

    if (encodedContext == "") {
      router.push("unthorization-error");

      return;
    }

    try {
      const getProducts = await fetch(
        `/api/server/products/all?context=${encodedContext}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, limit: perPage }),
        }
      );
      const productRes = await getProducts.json();

      if (productRes?.message) {
        setPageError(productRes?.message);
      }

      const products = productRes?.products;
      const pagination = productRes?.pagination;
      setCurrentItems(products);
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

  // useEffect(() => {
  // if (encodedContext) { getProduct(); }else{ setpageLoading(false); }
  // }, [encodedContext, pageRender]);

  useEffect(() => {
    getProduct();
  }, [encodedContext, pageRender]);

  const renderImage = (images) => {
    const thumbnail = images;
    const fallback = "/assets/coming-soon-img.gif";

    return (
      <img src={thumbnail || fallback} width={40} height={40} alt="Product" />
    );
  };

  //handle search
  const handleSearch = async () => {
    if (!searchProductId.trim()) {
      return;
    }
    const getProducts = await fetch(
      `/api/server/products/search-db?context=${encodedContext}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: searchProductId?.trim() }),
      }
    );
    const productRes = await getProducts.json();
    const products = productRes?.products;
    setCurrentItems(products || []);
    setIsSearchActive(true);

    setPaginationData({
      total: products?.length,
      current_page: products?.length,
      per_page: 15,
    });
  };

  return (
    <Panel id="products">
      <Flex justifyContent="space-between" style={{ marginBottom: "20px" }}>
        {/* Search box */}
        <Flex marginBottom="medium" alignItems="center">
          <Input
            maxLength={80}
            placeholder="Search Name & SKU"
            value={searchProductId}
            onChange={(e) => setSearchProductId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button marginLeft="small" onClick={handleSearch}>
            Search
          </Button>
          {isSearchActive && (
            <Button
              variant="secondary"
              marginLeft="small"
              onClick={() => {
                getProduct();
                setSearchProductId("");
                setIsSearchActive(false);
              }}
            >
              Clear
            </Button>
          )}
        </Flex>

        <FlexItem>
          <Button
            actionType="normal"
            isLoading={false}
            variant="primary"
            onClick={() => {
              router.push(`/product-form`);
            }}
          >
            <AddIcon /> Add product for design
          </Button>
        </FlexItem>
      </Flex>

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
        <Table
          columns={[
            {
              header: "Image",
              hash: "images",
              render: ({ productImage }) => renderImage(productImage),
              width: "80",
            },
            {
              header: "Name",
              hash: "name",
              render: ({ productName }) => productName,
            },
            {
              header: "SKU",
              hash: "sku",
              render: ({ productSku }) => productSku,
            },
            {
              header: "Action",
              hash: "action",
              render: ({ productId, id }) => (
                <ProductActionDropdown
                  {...{
                    pageRender: setPageRender,
                    pageLoading: setpageLoading,
                    pageSuccess: setPageSuccess,
                    productId,
                    id,
                    jwtToken: encodedContext,
                  }}
                />
              ),
              align: "left",
              width: 80,
            },
          ]}
          items={currentItems}
          itemName="Products"
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
            <center>
              You have no any product for design. Kindly include a new product
              in the design.
            </center>
          </FlexItem>
        </Flex>
      )}

      {pageLoading && <Loading />}
    </Panel>
  );
};

export default Products;
