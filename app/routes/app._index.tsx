import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineGrid,
  Button,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getStoreSettings } from "../models/store.server";
import { getOrderStats } from "../models/order.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const store = await getStoreSettings(shop);
  const stats = await getOrderStats(store.id);

  return json({ store, stats });
};

export default function Index() {
  const { store, stats } = useLoaderData<typeof loader>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Page title="OnePik COD Dashboard">
      <Layout>
        {!store.formEnabled && (
          <Layout.Section>
            <Banner tone="warning">
              <p>
                Your COD form is currently disabled. Enable it in Settings to start receiving orders.
              </p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 6 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  Total Orders
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.total}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  Pending
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.pending}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  Confirmed
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.confirmed}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  Delivered
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.delivered}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  RTO
                </Text>
                <Text as="p" variant="heading2xl">
                  {stats.rto}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingSm">
                  Revenue
                </Text>
                <Text as="p" variant="heading2xl">
                  {formatCurrency(stats.revenue)}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Plan Usage
              </Text>
              <Text as="p" variant="bodyMd">
                {store.plan === "free" && (
                  <>
                    Free Plan: {store.ordersThisMonth}/60 orders this month
                    {store.ordersThisMonth >= 60 && (
                      <Text as="span" tone="critical">
                        {" "}
                        - Limit reached! Upgrade to continue receiving orders.
                      </Text>
                    )}
                  </>
                )}
                {store.plan === "pro" && (
                  <>Pro Plan: {store.ordersThisMonth}/500 orders this month</>
                )}
                {store.plan === "unlimited" && (
                  <>Unlimited Plan: {store.ordersThisMonth} orders this month</>
                )}
              </Text>
              {store.plan === "free" && (
                <div>
                  <Button variant="primary">Upgrade to Pro</Button>
                </div>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <InlineGrid columns={2} gap="200">
                <Button url="/app/orders">View All Orders</Button>
                <Button url="/app/settings">Configure Form</Button>
              </InlineGrid>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
