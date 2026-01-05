import db from "../db.server";
import { Decimal } from "@prisma/client/runtime/library";

interface CreateOrderInput {
  shopifyDomain: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    state?: string;
    email?: string;
  };
  product: {
    id: string;
    title: string;
    price: number;
    variantId?: string;
    image?: string;
  };
  quantity: number;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const store = await db.store.findUnique({
    where: { shopifyDomain: input.shopifyDomain },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const totalAmount = input.product.price * input.quantity;

  return db.order.create({
    data: {
      storeId: store.id,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerAddress: input.customer.address,
      customerCity: input.customer.city,
      customerPincode: input.customer.pincode,
      customerState: input.customer.state,
      customerEmail: input.customer.email,
      productId: input.product.id,
      productTitle: input.product.title,
      productPrice: new Decimal(input.product.price),
      productVariantId: input.product.variantId,
      productImage: input.product.image,
      quantity: input.quantity,
      totalAmount: new Decimal(totalAmount),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceType: input.deviceType,
    },
  });
}

export async function getOrders(
  shopifyDomain: string,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const store = await db.store.findUnique({
    where: { shopifyDomain },
  });

  if (!store) return [];

  return db.order.findMany({
    where: {
      storeId: store.id,
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return db.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function linkShopifyOrder(
  orderId: string,
  shopifyOrderId: string,
  shopifyOrderNumber: string
) {
  return db.order.update({
    where: { id: orderId },
    data: {
      shopifyOrderId,
      shopifyOrderNumber,
      status: "confirmed",
    },
  });
}

export async function getOrderStats(shopifyDomain: string) {
  const store = await db.store.findUnique({
    where: { shopifyDomain },
  });

  if (!store) {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      deliveredOrders: 0,
      rtoOrders: 0,
      totalRevenue: 0,
    };
  }

  const [total, pending, confirmed, delivered, rto, revenue] = await Promise.all([
    db.order.count({ where: { storeId: store.id } }),
    db.order.count({ where: { storeId: store.id, status: "pending" } }),
    db.order.count({ where: { storeId: store.id, status: "confirmed" } }),
    db.order.count({ where: { storeId: store.id, status: "delivered" } }),
    db.order.count({ where: { storeId: store.id, status: "rto" } }),
    db.order.aggregate({
      where: { storeId: store.id },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalOrders: total,
    pendingOrders: pending,
    confirmedOrders: confirmed,
    deliveredOrders: delivered,
    rtoOrders: rto,
    totalRevenue: revenue._sum.totalAmount?.toNumber() || 0,
  };
}
