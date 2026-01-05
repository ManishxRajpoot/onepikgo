import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Checkbox,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { getStoreSettings, updateStoreSettings } from "../models/store.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getStoreSettings(session.shop);
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = {
    formEnabled: formData.get("formEnabled") === "true",
    buttonText: formData.get("buttonText") as string,
    buttonColor: formData.get("buttonColor") as string,
    buttonTextColor: formData.get("buttonTextColor") as string,
    showName: formData.get("showName") === "true",
    showPhone: formData.get("showPhone") === "true",
    showAddress: formData.get("showAddress") === "true",
    showCity: formData.get("showCity") === "true",
    showPincode: formData.get("showPincode") === "true",
    showState: formData.get("showState") === "true",
    labelName: formData.get("labelName") as string,
    labelPhone: formData.get("labelPhone") as string,
    labelAddress: formData.get("labelAddress") as string,
    labelCity: formData.get("labelCity") as string,
    labelPincode: formData.get("labelPincode") as string,
    labelState: formData.get("labelState") as string,
  };

  await updateStoreSettings(session.shop, settings);

  return json({ success: true });
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [formEnabled, setFormEnabled] = useState(settings.formEnabled);
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [buttonColor, setButtonColor] = useState(settings.buttonColor);
  const [buttonTextColor, setButtonTextColor] = useState(settings.buttonTextColor);
  const [showName, setShowName] = useState(settings.showName);
  const [showPhone, setShowPhone] = useState(settings.showPhone);
  const [showAddress, setShowAddress] = useState(settings.showAddress);
  const [showCity, setShowCity] = useState(settings.showCity);
  const [showPincode, setShowPincode] = useState(settings.showPincode);
  const [showState, setShowState] = useState(settings.showState);
  const [labelName, setLabelName] = useState(settings.labelName);
  const [labelPhone, setLabelPhone] = useState(settings.labelPhone);
  const [labelAddress, setLabelAddress] = useState(settings.labelAddress);
  const [labelCity, setLabelCity] = useState(settings.labelCity);
  const [labelPincode, setLabelPincode] = useState(settings.labelPincode);
  const [labelState, setLabelState] = useState(settings.labelState);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("formEnabled", formEnabled.toString());
    formData.append("buttonText", buttonText);
    formData.append("buttonColor", buttonColor);
    formData.append("buttonTextColor", buttonTextColor);
    formData.append("showName", showName.toString());
    formData.append("showPhone", showPhone.toString());
    formData.append("showAddress", showAddress.toString());
    formData.append("showCity", showCity.toString());
    formData.append("showPincode", showPincode.toString());
    formData.append("showState", showState.toString());
    formData.append("labelName", labelName);
    formData.append("labelPhone", labelPhone);
    formData.append("labelAddress", labelAddress);
    formData.append("labelCity", labelCity);
    formData.append("labelPincode", labelPincode);
    formData.append("labelState", labelState);
    submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Settings"
      primaryAction={{
        content: isSubmitting ? "Saving..." : "Save",
        onAction: handleSubmit,
        loading: isSubmitting,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">General Settings</Text>
              <Checkbox
                label="Enable COD Form"
                checked={formEnabled}
                onChange={setFormEnabled}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Button Customization</Text>
              <FormLayout>
                <TextField
                  label="Button Text"
                  value={buttonText}
                  onChange={setButtonText}
                  autoComplete="off"
                />
                <InlineStack gap="400">
                  <TextField
                    label="Button Color"
                    value={buttonColor}
                    onChange={setButtonColor}
                    autoComplete="off"
                    prefix="#"
                  />
                  <TextField
                    label="Text Color"
                    value={buttonTextColor}
                    onChange={setButtonTextColor}
                    autoComplete="off"
                    prefix="#"
                  />
                </InlineStack>
              </FormLayout>
              <Box paddingBlockStart="200">
                <Text as="p" variant="bodyMd">Preview:</Text>
                <Box paddingBlockStart="200">
                  <button
                    style={{
                      backgroundColor: buttonColor,
                      color: buttonTextColor,
                      padding: "12px 24px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    {buttonText}
                  </button>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Form Fields</Text>
              <FormLayout>
                <InlineStack gap="400" align="start">
                  <Checkbox label="Name" checked={showName} onChange={setShowName} />
                  <Checkbox label="Phone" checked={showPhone} onChange={setShowPhone} />
                  <Checkbox label="Address" checked={showAddress} onChange={setShowAddress} />
                  <Checkbox label="City" checked={showCity} onChange={setShowCity} />
                  <Checkbox label="Pincode" checked={showPincode} onChange={setShowPincode} />
                  <Checkbox label="State" checked={showState} onChange={setShowState} />
                </InlineStack>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Field Labels</Text>
              <FormLayout>
                <FormLayout.Group>
                  <TextField label="Name Label" value={labelName} onChange={setLabelName} autoComplete="off" />
                  <TextField label="Phone Label" value={labelPhone} onChange={setLabelPhone} autoComplete="off" />
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField label="Address Label" value={labelAddress} onChange={setLabelAddress} autoComplete="off" />
                  <TextField label="City Label" value={labelCity} onChange={setLabelCity} autoComplete="off" />
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField label="Pincode Label" value={labelPincode} onChange={setLabelPincode} autoComplete="off" />
                  <TextField label="State Label" value={labelState} onChange={setLabelState} autoComplete="off" />
                </FormLayout.Group>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
