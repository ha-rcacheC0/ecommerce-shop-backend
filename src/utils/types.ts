import Decimal from "decimal.js";

type UserProfile = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  // Other fields as necessary
};

type User = {
  id: string;
  email: string;
  profiles?: UserProfile | null;
  // Other fields as necessary
};

type PurchaseItem = {
  id: string;
  productId: string;
  quantity: number;
  isUnit: boolean;
  Product: {
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
  PurchaseItems: PurchaseItem[];
  User: User;
  shippingAddress: Address;
  hasUnits?: boolean;
};

export { PurchaseRecord, PurchaseItem };
