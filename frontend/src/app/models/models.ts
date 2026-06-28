export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_best_seller: number; // 0 | 1
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  image_url?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
}

export type OrderStatus = 'Placed' | 'Confirmed' | 'Packaging' | 'Shipped' | 'Delivered';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: { product_id: number; quantity: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
