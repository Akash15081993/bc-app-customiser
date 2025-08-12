console.log('krcustomizer_config V1')
console.log(krcustomizer_config)

const kr_root_app_id = "kr-customizer-root";
const ele_customize_handel_button = document?.querySelector('body .kr-customize-handel');
const ele_addtocart_handel_button = document?.querySelector('body .kr-addtocart-handel');
const ele_product_form = document?.querySelector('.productView-options form');
let kr_store_form_data = {};


document.addEventListener('DOMContentLoaded', function () {

    if (!document.getElementById(kr_root_app_id)) {
        document.body.insertAdjacentHTML('beforeend', `<div id="${kr_root_app_id}" style="display:none;position: fixed;top: 0;left:0;width:100%;z-index: 9999999999;"></div>`);
    }

    if (typeof window.mountProductCustomizer === 'function') {
        window.mountProductCustomizer(`#${kr_root_app_id}`, {
            productId: 7
        });
    } else {
        console.error('Customizer failed to load');
    }
});

// Validation form
function kr_product_validation_form() {
    document.getElementById(kr_root_app_id).style.display = 'none';
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
}

ele_customize_handel_button?.addEventListener("click", function () {
    kr_store_form_data = {};

    kr_product_validation_form();

    // Collect all form data into an object
    const formData = new FormData(ele_product_form);
    formData.forEach(function (value, key) {
        if (kr_store_form_data[key]) {
            if (Array.isArray(kr_store_form_data[key])) {
                kr_store_form_data[key].push(value);
            } else {
                kr_store_form_data[key] = [kr_store_form_data[key], value];
            }
        } else {
            kr_store_form_data[key] = value;
        }
    });

    document.getElementById(kr_root_app_id).style.display = 'block';

});

ele_addtocart_handel_button?.addEventListener("click", function () {
    console.log('kr_store_form_data')
    console.log(kr_store_form_data)
    kr_product_validation_form();

    if (kr_store_form_data == null || (typeof kr_store_form_data === 'object' && Object.keys(kr_store_form_data).length === 0)) {
        document.getElementById(kr_root_app_id).style.display = 'none';
        return false;
    }

    document.getElementById(kr_root_app_id).style.display = 'block';

});