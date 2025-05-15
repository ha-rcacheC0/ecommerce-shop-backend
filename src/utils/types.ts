import Decimal from "decimal.js";

type UserProfile = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
};

type User = {
  id: string;
  email: string;
  profile?: UserProfile | null;
};

type PurchaseItem = {
  id: string;
  productId: string;
  quantity: number;
  isUnit: boolean;
  itemSubtotal: Decimal;
  product: {
    sku: string;
    title: string;
  };
};

type Address = {
  id: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  postalCode: string;
};

type PurchaseRecord = {
  id: string;
  grandTotal: Decimal;
  subTotal: Decimal;
  tax: Decimal;
  liftGateFee: Decimal;
  shippingCost: Decimal;
  discountAmount: Decimal;
  discountCode: string | null;
  discountType: string | null;
  date: Date;
  userId: string;
  addressId: string;
  purchaseItems: PurchaseItem[];
  user: User;
  shippingAddress: Address;
  hasUnits?: boolean;
};

export { PurchaseRecord, PurchaseItem };
