import {
  Button,
  FormGroup,
  Input,
  Message,
  Panel,
  Table,
} from "@bigcommerce/big-design";
import Loading from "@components/loading";
import SwitchDesigner from "@components/switchDesigner";
import { StringKeyValue } from "@types";
import { useSession } from "context/session";
import { useEffect, useState } from "react";

const FormErrors = {
  name: "Product name is required",
  price: "Default price is required",
};

const ProductForm = () => {
  const encodedContext = useSession()?.context;
  const [searchTerm, setSearchTerm] = useState("");
  const [serachButtonLoading, setSerachButtonLoading] = useState(false);
  const [errors, setErrors] = useState<StringKeyValue>({});
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageLoading, setpageLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([10,5]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentItems, setCurrentItems] = useState<[]>([]);
  
  const [pageRender, setPageRender] = useState(false);

  const [paginationData, setPaginationData] = useState({
    total: 0,
    current_page: 1,
    per_page: 5,
  });

  console.log("encodedContext V1");
  console.log(encodedContext);

  const searchProduct = async (page = 1, perPage = itemsPerPage) => {
    console.log('Init searchProduct')
    setSerachButtonLoading(true);
    setpageLoading(false)
    setPageSuccess('')
    const res = await fetch(`/api/products/search?context=${encodedContext}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: searchTerm, page, limit: perPage }),
    });

    const productRes = await res.json();
    if(productRes?.message) {
      setPageError(productRes?.message);
    }

    const products = productRes?.data;
    const pagination = productRes?.meta?.pagination;

    setCurrentItems(products);

    setPaginationData({
      total: pagination?.total,
      current_page: pagination?.current_page,
      per_page: pagination?.per_page,
    });

    setSerachButtonLoading(false);
  };

  const handleSearch = async () => {
    if (searchTerm === "") {
      setErrors({ name: FormErrors.name });
      return;
    }
    setCurrentPage(1);
    searchProduct(1, itemsPerPage);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
    searchProduct(page, itemsPerPage);
    setPageSuccess('')
  };

  const onItemsPerPageChange = (perPage) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    searchProduct(1, perPage);
  };

  const renderImage = (images: any[] = []) => {
    const thumbnail = images.find((img) => img?.is_thumbnail)?.url_thumbnail;
    const fallback = "https://cdn11.bigcommerce.com/s-vpkhnmqpak/stencil/fb255700-2286-013d-541b-7ab15761d798/img/ProductDefault.gif";
    return (
      <img
        src={thumbnail || fallback}
        width={40}
        height={40}
        alt="Product"
      />
    );
  };

  useEffect(() => {
    if (searchTerm) {
      searchProduct(currentPage, itemsPerPage);
    }
  //}, [currentPage, itemsPerPage, pageRender]);
  }, [pageRender]);

  //if (pageLoading) return <Loading />;

  return (
    <>
      <Panel>
        {pageError && (
          <Message
            marginVertical="medium"
            messages={[{ text: pageError }]}
            type="error"
          />
        )}

        <FormGroup>
          <Input
            error={errors.name}
            label="Product Search"
            name="name"
            required
            value={searchTerm}
            placeholder="Search by Name or SKU"
            width="small"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setErrors({ name: "" });
              setPageError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={Boolean(serachButtonLoading)}
          />
        </FormGroup>
        <Button
          variant="secondary"
          isLoading={serachButtonLoading}
          onClick={handleSearch}
        >
          Search
        </Button>
      </Panel>

      {pageSuccess && (
        <Message
          header={pageSuccess.split("|@|")[0]}
          marginVertical="medium"
          messages={[{ text: pageSuccess.split("|@|")[1] }]}
          type="success"
        />
      )}

      {!pageLoading && currentItems?.length > 0 && (
        <Panel>
          <h4 className="success50" style={{marginTop:"0"}}>Results for '{searchTerm}'</h4>
          
          <Table
            columns={[
              {
                header: "Image",
                hash: "images",
                render: ({ images }) => renderImage(images),
                width: "80",
              },
              { header: "Name", hash: "name", render: ({ name }) => name },
              { header: "SKU", hash: "sku", render: ({ sku }) => sku ? sku : "-" },
              {
                header: "Designer",
                hash: "designer",
                render: ({ id, name, modifiers }) => (
                  <SwitchDesigner
                    {...{
                      pageLoading: setpageLoading,
                      serachButtonLoading: setSerachButtonLoading,
                      pageSuccess: setPageSuccess,
                      pageRender: setPageRender,
                      productId: id,
                      name,
                      modifiers,
                    }}
                  />
                ),
                isSortable: false,
                width: "120",
                align: "center",
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
        </Panel>
      )}

      {currentItems?.length == 0 && <Panel>No Data</Panel>}

      {pageLoading && <Loading />}
    </>
  );
};

export default ProductForm;
