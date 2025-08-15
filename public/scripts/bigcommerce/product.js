const krAppConfig = window?.krcustomizer_config;
console.log('krAppConfig');
console.log(krAppConfig);

const bc_storefront_token = krAppConfig?.storefront_api;
const kr_product_id = krAppConfig?.product_id;
const kr_store_hash = krAppConfig?.store_hash;

const kr_root_app_id = "kr-customizer-root";
const ele_customize_handel_button = document?.querySelector('body .kr-customize-handel');
const ele_addtocart_handel_button = document?.querySelector('body .kr-addtocart-handel');
const ele_product_form = document?.querySelector('.productView-options form');
let kr_store_form_data = {};


//Root app model visibility
function appModelVisibility(action) {
    if (action === "show") {
        document.getElementById(kr_root_app_id).style.display = 'block';
    } else {
        document.getElementById(kr_root_app_id).style.display = 'none';
    }
}

//Mount app
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById(kr_root_app_id)) {
        document.body.insertAdjacentHTML('beforeend', `<div id="${kr_root_app_id}" style="display:none;position: fixed;top: 0;left:0;width:100%;z-index: 9999999999;"></div>`);
    }

    if (typeof window.mountProductCustomizer === 'function') {
        window.mountProductCustomizer(`#${kr_root_app_id}`, {
            productId: kr_product_id,
            storeHash: kr_store_hash
        });
    } else {
        console.error('Customizer failed to load');
    }
});

//customize button Validation & handel
ele_customize_handel_button?.addEventListener("click", function () {
    kr_store_form_data = {};
    appModelVisibility('hide');

    //Validation form
    if (ele_product_form.checkValidity && !ele_product_form.checkValidity()) {
        if (ele_product_form.reportValidity) {
            ele_product_form.reportValidity();
        } else {
            // IE fallback
            const firstInvalid = ele_product_form.querySelector(":invalid");
            if (firstInvalid) {
                alert("Please fill out all required fields.");
                firstInvalid.focus();
            }
        }
        return;
    }

    // Collect all form data into an object
    const formData = new FormData(ele_product_form);
    formData.forEach(function (value, key) {
        value = value?.trim?.() || ""; // remove spaces

        // skip unwanted keys and empty values
        if (key === "action" || value === "") { return; }

        // Extract attribute id if key is like attribute[170]
        const match = key.match(/^attribute\[(\d+)\]$/);
        if (match) {
            kr_store_form_data[match[1]] = value; // store only the number as key
        } else {
            kr_store_form_data[key] = value;
        }
    });

    appModelVisibility('show');

});


//Get product variant id
async function getProductVariantId(productData) {
    const responseReq = await fetch("/graphql", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bc_storefront_token },
        body: JSON.stringify({ query: `query product{ site{ product(sku:"${productData}"){ variants(skus:["${productData}"]){ edges{ node{ entityId } } } } } } ` })
    });
    const resultData = await responseReq?.json();
    console.log('graphql getProducts')
    console.log(resultData)
    if (resultData?.data?.site?.product && resultData?.data?.site?.product?.variants?.edges?.length > 0) {
        return resultData?.data?.site?.product?.variants?.edges[0]?.node?.entityId;
    } else {
        return 0;
    }
}


//Get product details based on selected options
async function productWithSelectedOptions(options) {
    let query_parameters = ``;
    let optionEntity = ``;

    Object.entries(options).forEach(([key, value]) => {
        // Skip unwanted keys and empty values
        if (key === "product_id" || key === "qty[]" || value === "" || isNaN(Number(value))) return;
        optionEntity += `{ optionEntityId: ${parseInt(key)}, valueEntityId: ${parseInt(value)} },`;
    });

    query_parameters = `product (entityId: ${parseInt(options.product_id)} optionValueIds: [${optionEntity.slice(0, -1)}] )`;

    const responseReq = await fetch("/graphql", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bc_storefront_token },
        body: JSON.stringify({ query: `query ProductsWithOptionSelections { site { productWithSelectedOptions: ${query_parameters} { ...ProductFields } } } fragment ProductFields on Product { sku prices{ price{ value } } }` })
    });
    const resultData = await responseReq?.json();
    const productData = resultData?.data?.site?.productWithSelectedOptions;
    const sku = productData?.sku;
    const kr_product_price = productData?.prices?.price?.value;
    const kr_product_variant = await getProductVariantId(sku);

    const krDesignData = JSON.parse(window?.localStorage?.getItem("krDesignData"));
    return { kr_product_variant, kr_product_price, kr_product_id, kr_store_form_data, kr_store_hash, krDesignData };
}


//Add to Cart Handel
document.addEventListener("click", async function (e) {
    console.clear();
    const addtocartButton = e.target.closest('[title="Add design to cart"]');
    if (addtocartButton) {

        //Validation form
        if (ele_product_form.checkValidity && !ele_product_form.checkValidity()) {
            appModelVisibility('hide');
            if (ele_product_form.reportValidity) {
                ele_product_form.reportValidity();
            } else {
                // IE fallback
                const firstInvalid = ele_product_form.querySelector(":invalid");
                if (firstInvalid) {
                    alert("Please fill out all required fields.");
                    firstInvalid.focus();
                }
            }
            return;
        }

        if (kr_store_form_data == null || (typeof kr_store_form_data === 'object' && Object.keys(kr_store_form_data).length === 0)) {
            appModelVisibility('hide');
            return false;
        }
        appModelVisibility('show');

        const productData = await productWithSelectedOptions(kr_store_form_data);

        console.log('productData Final');
        console.log(productData)

    }
});
