export function getScriptPayload(appDomain: string) {
  return {
    name: "KR Customizer",
    description: "KR Customizer customizer app Script",
    html: `<script>
window.krcustomizer_config = {
    "store_hash": "{{settings.store_hash}}",
    "channel_id": "{{settings.channel_id}}",
    "currencyCode": "{{settings.money.currency_token}}",
    "page_type": "{{page_type}}",
    "storefront_api": "{{settings.storefront_api.token}}",
    "customer_id": "{{#if customer}}{{customer.id}}{{else}}0{{/if}}",
    "customer_email": "{{#if customer}}{{customer.email}}{{else}}0{{/if}}",
    "product_id": "{{product.id}}",
    "product_sku": "{{product.sku}}"
    }
</script>
<script src="${appDomain}/scripts/bigcommerce/product.js" defer></script>`,
    auto_uninstall: true,
    load_method: "default",
    location: "footer",
    visibility: "all_pages",
    kind: "script_tag",
    consent_category: "essential",
    enabled: true,
  };
}
