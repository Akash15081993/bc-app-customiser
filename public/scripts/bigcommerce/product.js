
const krAppConfig = window?.krcustomizer_config;
console.log('krAppConfig');
console.log(krAppConfig);

const kr_endpoint = "https://app.krcustomizer.com/";
const kr_store_hash = krAppConfig?.store_hash;
const kr_page_type = krAppConfig?.page_type;
const bc_storefront_token = krAppConfig?.storefront_api;
const kr_product_id = krAppConfig?.product_id;
const kr_currencyCode = krAppConfig?.currencyCode;
const kr_customer_id = krAppConfig?.customer_id;
const kr_customer_email = krAppConfig?.customer_email;

const kr_root_app_id = "kr-customizer-root";
const ele_product_form = document.querySelector('.productView-options form') || document.querySelector('form[action*="/cart.php"]') || document.querySelector('form[data-cart-item-add]');
let kr_store_form_data = {};

//set Alertbox
function krSetAlert(message, action) {
    let otherClass = ""
    if (action == "error") {
        otherClass = "kr-alert-box--error";
    }
    const eleMesage = `<div class="kr-alert-box ${otherClass}"><p>${message}</p><button>X</button></p>`;
    document.body.insertAdjacentHTML('beforeend', eleMesage);

    document.querySelectorAll(".kr-alert-box").forEach(alertBox => {
        alertBox.addEventListener("click", function () {
            this.remove();
        });
    });
}

//Hide kr fields
function hideFields() {
    var hideLabels = ["design id", "view design", "design area"];
    document.querySelectorAll(".form-field").forEach(function (field) {
        var label = field.querySelector("label");
        if (label) {
            var text = label.textContent.replace(/\s+/g, " ").trim().toLowerCase();
            if (hideLabels.some(l => text.includes(l))) {
                field.style.display = "none";
            }
        }
    });
}

//Mount app
document.addEventListener('DOMContentLoaded', function () {
    if (kr_page_type === "product") {
        hideFields();
        if (!document.getElementById(kr_root_app_id)) {
            document.body.insertAdjacentHTML('beforeend', `<div id="${kr_root_app_id}" style="display:none;position: fixed;top: 0;left:0;width:100%;z-index: 9999999999;"></div>`);
        }
    }
});

//Set custom css
function appendCSS(cssCode) {
    const style = document.createElement("style");
    style.innerHTML = cssCode;
    document.head.appendChild(style);
}

//App authentication
async function appAuthentication() {
    const bodyPaylod = { "kr_store_hash": kr_store_hash, "bc_storefront_token": bc_storefront_token, "kr_product_id": kr_product_id };
    const reqAuthentication = await fetch(`${kr_endpoint}api/widget/authentication`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(bodyPaylod)
    });
    const resultAuthentication = await reqAuthentication?.json();

    if (resultAuthentication?.status === true) {
        const appSettings = resultAuthentication?.appSettings;
        const cssCode = appSettings?.cssCode;
        const designerButton = appSettings?.designerButton;
        const designerButtonName = appSettings?.designerButtonName != "" ? appSettings?.designerButtonName : "Customize";
        const enableShare = appSettings?.enableShare;

        const customize_handel_button = `<button type="button" class="button button--primary kr-customize-handel" data-kr-customize-handel>${designerButtonName}</button>`;

        //Set custom css
        if (cssCode != "") { appendCSS(cssCode); }

        //Button append
        if(esignerButton != ""){
            const designerButtonEle = document.querySelector(designerButton);
            if (designerButtonEle) {
                designerButtonEle.insertAdjacentHTML('beforeend', customize_handel_button);
            } else {
                document.querySelector(".productView-options .form").insertAdjacentHTML('beforeend', customize_handel_button);
            }
        } else {
            document.querySelector(".productView-options .form").insertAdjacentHTML('beforeend', customize_handel_button);
        }

    } else {
        console.log("%c" + "Your subscription is not valid. Please contact to 'KR Customizer' administrator", "background: #79d000; color: #1d1d1d;padding:5px; border-radius:5px");
    }
}
if (kr_page_type === "product") { appAuthentication(); }

async function getCart() {
    const reqCart = await fetch('/api/storefront/cart?include=lineItems.digitalItems.options,lineItems.physicalItems.options', {
        credentials: 'same-origin'
    });
    const resultCart = await reqCart?.json();
    if (resultCart?.length > 0) {
        return resultCart[0];
    } else {
        return null
    }
}

//Root app model visibility
function appModelVisibility(action) {
    const root = document.getElementById(kr_root_app_id);
    if (!root) return;
    root.style.display = action === "show" ? "block" : "none";
}

//Mount app pass data
function mountCustomizerApp(productData) {
    if (typeof window.mountProductCustomizer === 'function') {
        appModelVisibility('show');
        window.mountProductCustomizer(`#${kr_root_app_id}`, {
            currencyCode: kr_currencyCode,
            productId: kr_product_id,
            productPrice: parseFloat(productData?.kr_product_price),
            storeHash: kr_store_hash,
            pageLoading: false,
            productQuantity: parseInt(productData?.productQuantity),
        });
    } else {
        console.error("Customizer function not found.");
    }
}

//Get product variant id
async function getProductVariantId(productData) {
    const responseReq = await fetch("/graphql", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bc_storefront_token },
        body: JSON.stringify({ query: `query product{ site{ product(sku:"${productData}"){ variants(skus:["${productData}"]){ edges{ node{ entityId } } } } } } ` })
    });
    const resultData = await responseReq?.json();
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
    let productQuantity = 1;

    Object.entries(options).forEach(([key, value]) => {

        if (key === "qty[]") {
            productQuantity = value
        }

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

    const cartData = await getCart();
    const cartId = cartData?.id || null;

    return {
        kr_product_sku: sku,
        kr_product_variant,
        kr_product_price,
        kr_product_id,
        kr_store_form_data,
        kr_store_hash,
        kr_customer_id,
        kr_design_id: krDesignData?.krDesignId,
        cartId,
        productQuantity
    };
}

//customize root hide
document.addEventListener("click", async function (e) {
    const ele_close_handle = e.target.closest('button[data-kr-close-handle]');
    if (ele_close_handle) { appModelVisibility('hide'); }
})

//Validation bc form
function validateForm(form) {
    if (form.checkValidity && !form.checkValidity()) {
        if (form.reportValidity) form.reportValidity();
        else {
            const firstInvalid = form.querySelector(":invalid");
            if (firstInvalid) {
                alert("Please fill out all required fields.");
                firstInvalid.focus();
            }
        }
        
return false;
    }
    
return true;
}

//customize button Validation & handel
document.addEventListener("click", async function (e) {
    const ele_customize_handel_button = e.target.closest('button[data-kr-customize-handel]');
    if (ele_customize_handel_button) {

        kr_store_form_data = {};
        appModelVisibility('hide');

        //Validation form
        if (!validateForm(ele_product_form)) return;

        // disable button + change text
        ele_customize_handel_button.disabled = true;
        const originalText = ele_customize_handel_button.innerText;
        ele_customize_handel_button.innerText = "Loading...";

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

        try {
            const scriptAppUrl = "https://front.krcustomizer.com/bc-app/bc-customiser-app.umd.js";
            const productData = await productWithSelectedOptions(kr_store_form_data);

            //Mount App Start
            if (!document.querySelector(`script[src="${scriptAppUrl}"]`)) {
                const scriptEle = document.createElement("script");
                scriptEle.src = scriptAppUrl;
                scriptEle.type = "text/javascript";
                scriptEle.async = true;
                scriptEle.onload = () => {
                    mountCustomizerApp(productData);
                };
                document.head.appendChild(scriptEle);
            } else {
                mountCustomizerApp(productData);
            }
            //Mount App End

        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => {
                ele_customize_handel_button.disabled = false;
                ele_customize_handel_button.innerText = originalText;
            }, 2000);
        }

    }
})

//Product add to cart
async function kr_addtocart(productData) {

    const bodyPaylod = {
        "kr_product_sku": productData?.kr_product_sku,
        "kr_customer_id": productData?.kr_customer_id,
        "kr_product_variant": productData?.kr_product_variant,
        "kr_product_price": productData?.kr_product_price,
        "kr_product_id": productData?.kr_product_id,
        "kr_store_form_data": productData?.kr_store_form_data,
        "kr_store_hash": productData?.kr_store_hash,
        "kr_design_id": productData?.kr_design_id,
        "cartId": productData?.cartId,
        "bc_storefront_token": bc_storefront_token
    };

    const reqCart = await fetch(`${kr_endpoint}api/widget/cart`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(bodyPaylod)
    });
    const resultCart = await reqCart?.json();

    if (resultCart?.status === true) {
        const redirect_urls = resultCart?.data?.redirect_urls?.cart_url;
        window.location.href = redirect_urls;
        setTimeout(() => { window?.setCustomizerLoading(false); }, 2000);
    } else {
        appModelVisibility('hide');
        window?.setCustomizerLoading(false);
        setTimeout(() => {
            const message = resultCart?.message;
            krSetAlert(message, 'error');
        }, 200);
    }

}

//Add to Cart Handel
document.addEventListener("click", async function (e) {
    const addtocartButton = e.target.closest('button[data-kr-addtocart-handel]');
    if (addtocartButton) {

        //Validation form
        if (!validateForm(ele_product_form)) return;

        window?.setCustomizerLoading(true);

        if (kr_store_form_data == null || (typeof kr_store_form_data === 'object' && Object.keys(kr_store_form_data).length === 0)) {
            appModelVisibility('hide');
            
return false;
        }
        appModelVisibility('show');

        const productData = await productWithSelectedOptions(kr_store_form_data);
        kr_addtocart(productData)

    }
});


//Cart updateCartItems
function updateCartItems() {
    document.querySelectorAll(".cart-item").forEach(item => {
        const dl = item.querySelector(".definitionList");
        if (!dl) return;

        dl.querySelectorAll("dt").forEach(dt => {
            const label = dt.textContent.trim().toLowerCase();

            if (label === "view design:") {
                const dd = dt.nextElementSibling;
                if (dd) {
                    const designUrl = dd.textContent.trim();

                    if (designUrl) {
                        const figure = item.querySelector(".cart-item-figure");
                        if (figure) {
                            // remove old image
                            figure.innerHTML = "";

                            // append new image
                            const newImg = document.createElement("img");
                            newImg.src = designUrl;
                            newImg.alt = "Custom Design";
                            newImg.style.maxWidth = "100%";
                            figure.appendChild(newImg);
                        }
                    }

                    // hide row + change link
                    dt.style.display = "none";
                    dd.style.display = "none";
                    const changeLink = item.querySelector('[data-item-edit]');
                    if (changeLink) changeLink.style.display = "none";
                }
            }

            if (["design id:", "design area:"].includes(label)) {
                const dd = dt.nextElementSibling;
                if (dd) dd.style.display = "none";
                dt.style.display = "none";
            }
        });
    });
}

//Cart initCartObserver
function initCartObserver() {
    const cartContainer = document.querySelector('.cart');
    if (!cartContainer) return;

    let timeout;
    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            updateCartItems();
        }, 150);
    });
    observer.observe(cartContainer, { childList: true, subtree: true });
    
return observer;
}

if (kr_page_type == "cart") {
    document.addEventListener('DOMContentLoaded', () => {
        updateCartItems();
        //Watch parent of cart so if .cart gets replaced → reattach observer
        const parent = document.querySelector('.cart')?.parentNode;
        if (!parent) return;
        let cartObserver = initCartObserver();
        const parentObserver = new MutationObserver(() => {
            const newCart = document.querySelector('.cart');
            if (newCart && (!cartObserver || !newCart.isSameNode(cartObserver.target))) {
                if (cartObserver) cartObserver.disconnect();
                cartObserver = initCartObserver();
                updateCartItems();
            }
        });
        parentObserver.observe(parent, { childList: true });
    });
}


//Checkout updateCartItems
function updateCheckoutImages() {
    document.querySelectorAll(".productList-item").forEach(item => {
        const options = item.querySelectorAll(".product-option");
        let designUrl = null;

        options.forEach(opt => {
            const text = opt.textContent.trim();

            // Grab "View Design" URL
            if (text.toLowerCase().startsWith("view design")) {
                const parts = text.split(" ");
                designUrl = parts[parts.length - 1]; // last part = URL
                opt.style.display = "none"; // hide this row
            }

            // Hide "Design Id" & "Design Area"
            if (
                text.toLowerCase().startsWith("design id") ||
                text.toLowerCase().startsWith("design area")
            ) {
                opt.style.display = "none";
            }
        });

        // Replace product thumbnail
        if (designUrl) {
            const figure = item.querySelector(".product-figure");
            if (figure && !figure.querySelector("img.custom-design")) {
                figure.innerHTML = ""; // remove old image
                const newImg = document.createElement("img");
                newImg.src = designUrl;
                newImg.alt = "Custom Design";
                newImg.className = "custom-design";
                newImg.style.maxWidth = "100%";
                newImg.style.height = "auto";
                figure.appendChild(newImg);
            }
        }
    });
}

if (kr_page_type == "checkout") {
    document.addEventListener("DOMContentLoaded", () => {
        updateCheckoutImages();

        //for desktop
        const checkoutContainerDesktop = document.querySelector("#checkout-app") || document.body;
        if (checkoutContainerDesktop) {
            const observer = new MutationObserver(() => {
                updateCheckoutImages();
            });
            observer.observe(checkoutContainerDesktop, { childList: true, subtree: true });
        }

        //for mobile
        const checkoutContainerMobile = document.querySelector(".ReactModalPortal") || document.body;
        if (checkoutContainerMobile) {
            const observer = new MutationObserver(() => {
                updateCheckoutImages();
            });
            observer.observe(checkoutContainerMobile, { childList: true, subtree: true });
        }

        // Handle "See All" button
        document.addEventListener("click", e => {
            const btn = e.target.closest("button");
            if (btn && btn.textContent.trim().startsWith("See All")) {
                setTimeout(() => {
                    updateCheckoutImages();
                }, 500);
            }
        });

    });
}
