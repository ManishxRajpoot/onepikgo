import { Page, Card, Text } from "@shopify/polaris";

export default function AppIndex() {
  return (
    <Page title="Onepik GO">
      <Card>
        <Text as="h2" variant="headingMd">
          App Loaded Successfully
        </Text>
      </Card>
    </Page>
  );
}
