import db from "../db.server";

export async function getStoreSettings(shopifyDomain: string) {
  let store = await db.store.findUnique({
    where: { shopifyDomain },
  });

  if (!store) {
    store = await db.store.create({
      data: { shopifyDomain },
    });
  }

  return store;
}

export async function updateStoreSettings(
  shopifyDomain: string,
  settings: {
    formEnabled?: boolean;
    buttonText?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    showName?: boolean;
    showPhone?: boolean;
    showAddress?: boolean;
    showCity?: boolean;
    showPincode?: boolean;
    showState?: boolean;
    labelName?: string;
    labelPhone?: string;
    labelAddress?: string;
    labelCity?: string;
    labelPincode?: string;
    labelState?: string;
  }
) {
  return db.store.upsert({
    where: { shopifyDomain },
    update: settings,
    create: { shopifyDomain, ...settings },
  });
}

export async function getPublicStoreSettings(shopifyDomain: string) {
  const store = await getStoreSettings(shopifyDomain);
  return {
    formEnabled: store.formEnabled,
    buttonText: store.buttonText,
    buttonColor: store.buttonColor,
    buttonTextColor: store.buttonTextColor,
    showName: store.showName,
    showPhone: store.showPhone,
    showAddress: store.showAddress,
    showCity: store.showCity,
    showPincode: store.showPincode,
    showState: store.showState,
    labelName: store.labelName,
    labelPhone: store.labelPhone,
    labelAddress: store.labelAddress,
    labelCity: store.labelCity,
    labelPincode: store.labelPincode,
    labelState: store.labelState,
  };
}

export async function incrementOrderCount(shopifyDomain: string) {
  const store = await getStoreSettings(shopifyDomain);
  const now = new Date();
  const resetDate = new Date(store.monthResetDate);

  if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
    await db.store.update({
      where: { shopifyDomain },
      data: {
        ordersThisMonth: 1,
        monthResetDate: now,
      },
    });
  } else {
    await db.store.update({
      where: { shopifyDomain },
      data: {
        ordersThisMonth: { increment: 1 },
      },
    });
  }
}

export async function checkOrderLimit(shopifyDomain: string): Promise<boolean> {
  const store = await getStoreSettings(shopifyDomain);
  const limits: Record<string, number> = {
    free: 60,
    pro: 500,
    unlimited: Infinity,
  };
  const limit = limits[store.plan] || 60;
  return store.ordersThisMonth < limit;
}
