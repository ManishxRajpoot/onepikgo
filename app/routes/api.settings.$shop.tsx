import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getPublicStoreSettings } from "../models/store.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const shop = params.shop;
  
  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  const settings = await getPublicStoreSettings(shop);

  return json(settings, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
};
