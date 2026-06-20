export interface Product {
  dbId: number;
  sku?: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  maxPrice?: number;
  stock: string;
  description?: string;
  newest: number;
  image?: string;
  bestSeller: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

export interface Customer {
  id: number;
  customerCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  addrLine1: string;
  addrLine2: string;
  pincode: string;
  postOffice: string;
  state: string;
  district: string;
  accountStatus: string;
  profileStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface CartLine {
  id: string;
  name: string;
  sku: string;
  size: string;
  image: string;
  quantity: number;
  price: number;
  lineTotal: number;
  category: string;
  subcategory: string;
  gstRate: number;
  hsn: string;
}

export interface Order {
  id: string;
  paymentId?: string;
  method: string;
  status: string;
  cart: CartLine[];
  subtotal: number;
  shippingCost: number;
  codFee: number;
  total: number;
  awb?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPincode?: string;
  shippingState?: string;
  placedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
