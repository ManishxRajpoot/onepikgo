import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getStoreSettings } from "../models/store.server";
import { getOrders } from "../models/order.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const store = await getStoreSettings(shop);
  const orders = await getOrders(store.id);

  return json({ orders });
};

export default function Orders() {
  const { orders } = useLoaderData<typeof loader>();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "info" | "success" | "warning" | "critical"> = {
      pending: "warning",
      confirmed: "info",
      delivered: "success",
      rto: "critical",
      cancelled: "critical",
    };
    return <Badge tone={statusMap[status] || "info"}>{status.toUpperCase()}</Badge>;
  };

  const rows = orders.map((order) => [
    order.id.substring(0, 8),
    order.customerName,
    order.customerPhone,
    order.customerCity,
    order.productTitle,
    `₹${order.totalAmount}`,
    getStatusBadge(order.status),
    new Date(order.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page title="Orders" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {orders.length === 0 ? (
              <EmptyState
                heading="No orders yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Orders will appear here once customers start placing COD orders.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text", "numeric", "text", "text"]}
                headings={["Order ID", "Customer", "Phone", "City", "Product", "Amount", "Status", "Date"]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
