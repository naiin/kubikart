export interface ServerCartItemInput {
  productId: number;
  variationId?: number;
  quantity: number;
  customizations?: Record<string, string>;
}

export interface ServerCartRequest {
  items: ServerCartItemInput[];
  country?: string;
  shippingMethodId?: string;
}
