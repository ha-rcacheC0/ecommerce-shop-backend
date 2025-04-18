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
  product: {
    sku: number;
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
  amount: Decimal;
  date: Date;
  userId: string;
  addressId: string;
  purchaseItems: PurchaseItem[];
  user: User;
  shippingAddress: Address;
  hasUnits?: boolean;
};

export { PurchaseRecord, PurchaseItem };
