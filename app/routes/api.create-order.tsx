import { json, type ActionFunctionArgs } from "@remix-run/node";
import { createOrder, linkShopifyOrder } from "../models/order.server";
import { getStoreSettings, incrementOrderCount, checkOrderLimit } from "../models/store.server";
import { unauthenticated } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const body = await request.json();
    const { shop, customer, product, quantity = 1 } = body;

    if (!shop) {
      return json({ success: false, error: "Shop is required" }, { status: 400, headers });
    }

    const settings = await getStoreSettings(shop);
    if (!settings.formEnabled) {
      return json({ success: false, error: "COD form is disabled" }, { status: 400, headers });
    }

    const withinLimit = await checkOrderLimit(shop);
    if (!withinLimit) {
      return json({ success: false, error: "Order limit reached. Please upgrade your plan." }, { status: 400, headers });
    }

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.pincode) {
      return json({ success: false, error: "Missing required customer fields" }, { status: 400, headers });
    }

    if (!product?.id || !product?.title || !product?.price) {
      return json({ success: false, error: "Missing required product fields" }, { status: 400, headers });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for") || "";
    const deviceType = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop";

    const order = await createOrder({
      shopifyDomain: shop,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
        state: customer.state,
        email: customer.email || `${customer.phone}@cod.onepik.com`,
      },
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        variantId: product.variantId,
        image: product.image,
      },
      quantity,
      ipAddress,
      userAgent,
      deviceType,
    });

    try {
      const { admin } = await unauthenticated.admin(shop);

      const draftOrderResponse = await admin.graphql(`
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          input: {
            lineItems: [
              {
                variantId: product.variantId ? `gid://shopify/ProductVariant/${product.variantId}` : undefined,
                title: product.title,
                originalUnitPrice: product.price.toString(),
                quantity: quantity,
              }
            ],
            shippingAddress: {
              firstName: customer.name.split(" ")[0],
              lastName: customer.name.split(" ").slice(1).join(" ") || "-",
              address1: customer.address,
              city: customer.city,
              zip: customer.pincode,
              provinceCode: customer.state || "",
              countryCode: "IN",
              phone: customer.phone,
            },
            billingAddress: {
              firstName: customer.name.split(" ")[0],
              lastName: customer.name.split(" ").slice(1).join(" ") || "-",
              address1: customer.address,
              city: customer.city,
              zip: customer.pincode,
              provinceCode: customer.state || "",
              countryCode: "IN",
              phone: customer.phone,
            },
            email: customer.email || `${customer.phone}@cod.onepik.com`,
            note: `COD Order via OnePik COD Form`,
            tags: ["COD", "onepik-cod"],
          },
        },
      });

      const draftOrderData = await draftOrderResponse.json();
      
      if (draftOrderData.data?.draftOrderCreate?.draftOrder) {
        const draftOrderId = draftOrderData.data.draftOrderCreate.draftOrder.id;
        
        const completeResponse = await admin.graphql(`
          mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
            draftOrderComplete(id: $id, paymentPending: $paymentPending) {
              draftOrder {
                order {
                  id
                  name
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            id: draftOrderId,
            paymentPending: true,
          },
        });

        const completeData = await completeResponse.json();
        
        if (completeData.data?.draftOrderComplete?.draftOrder?.order) {
          const shopifyOrder = completeData.data.draftOrderComplete.draftOrder.order;
          const shopifyOrderId = shopifyOrder.id.replace("gid://shopify/Order/", "");
          
          await linkShopifyOrder(order.id, shopifyOrderId, shopifyOrder.name);
          await incrementOrderCount(shop);

          return json({
            success: true,
            orderId: order.id,
            shopifyOrderId,
            orderNumber: shopifyOrder.name,
          }, { headers });
        }
      }

      await incrementOrderCount(shop);
      return json({
        success: true,
        orderId: order.id,
        message: "Order created but Shopify sync pending",
      }, { headers });

    } catch (shopifyError) {
      console.error("Shopify order creation error:", shopifyError);
      await incrementOrderCount(shop);
      return json({
        success: true,
        orderId: order.id,
        message: "Order created but Shopify sync failed",
      }, { headers });
    }

  } catch (error) {
    console.error("Order creation error:", error);
    return json({ success: false, error: "Failed to create order" }, { status: 500, headers });
  }
};

export const loader = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
