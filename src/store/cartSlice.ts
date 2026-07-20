import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string; // variant_id
  product_id: string;
  name: string;
  sku: string;
  price: number;
  compare_price: number | null;
  discounted_price: number;
  image: string | null;
  attributes: { name: string; value: string }[];
  quantity: number;
  available_stock: number;
}

export interface AppliedCoupon {
  code: string;
  discount_amount: number;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  minimum_amount?: number;
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
}

const getInitialState = (): CartState => {
  if (typeof window !== 'undefined') {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }
  return {
    items: [],
    coupon: null,
  };
};

const saveToLocalStorage = (state: CartState) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cart', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: getInitialState(),
  reducers: {
    addToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        // Enforce stock ceiling limit
        const targetQty = existing.quantity + 1;
        existing.quantity = Math.min(targetQty, existing.available_stock);
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      saveToLocalStorage(state);
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.quantity = Math.max(1, Math.min(action.payload.quantity, existing.available_stock));
      }
      saveToLocalStorage(state);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveToLocalStorage(state);
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      saveToLocalStorage(state);
    },
    applyCoupon(state, action: PayloadAction<AppliedCoupon>) {
      state.coupon = action.payload;
      saveToLocalStorage(state);
    },
    removeCoupon(state) {
      state.coupon = null;
      saveToLocalStorage(state);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon } = cartSlice.actions;
export default cartSlice.reducer;
