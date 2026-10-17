'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearCart, removeCoupon } from '../../store/cartSlice';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Truck, CheckCircle2, AlertCircle, ShoppingBag, ChevronDown, Search, Check, MapPin, Plus, Phone, ShieldCheck, Lock, Clock, ExternalLink } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { COUNTRIES_LIST } from '@/constants/countries';

const stripePromise = loadStripe('pk_test_mock_holder'); // load client Stripe

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currency, formatPrice } = useCurrency();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const coupon = useSelector((state: RootState) => state.cart.coupon);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [mounted, setMounted] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string;
    country: string;
    city: string;
    area: string;
    street: string;
    building?: string | null;
    postal_code?: string | null;
    is_default: boolean;
  }>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState<boolean>(true);
  const [saveForNextOrder, setSaveForNextOrder] = useState<boolean>(true);
  const [isDefaultAddress, setIsDefaultAddress] = useState<boolean>(false);

  const [addressForm, setAddressForm] = useState({
    country: 'United Arab Emirates',
    phone: '',
    city: '',
    full_address: '',
    street: '',
    area: '',
    building: '',
    postal_code: '',
  });

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });

  const selectedCountryObj =
    COUNTRIES_LIST.find((c) => c.name.toLowerCase() === addressForm.country?.toLowerCase()) ||
    COUNTRIES_LIST[0];

  const [phoneDialCode, setPhoneDialCode] = useState(selectedCountryObj?.dial_code || '+971');
  const [rawPhoneNumber, setRawPhoneNumber] = useState('');

  // Pre-fill phone if user already has it in profile
  useEffect(() => {
    if (user?.phone && !rawPhoneNumber) {
      const p = user.phone.trim();
      const matched = COUNTRIES_LIST.find((c) => p.startsWith(c.dial_code));
      if (matched) {
        setPhoneDialCode(matched.dial_code);
        setRawPhoneNumber(p.slice(matched.dial_code.length).trim());
        setAddressForm((prev) => ({
          ...prev,
          country: matched.name,
          phone: p,
        }));
      } else {
        setRawPhoneNumber(p);
        setAddressForm((prev) => ({
          ...prev,
          phone: `${phoneDialCode} ${p}`.trim(),
        }));
      }
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  // Searchable Country Dropdown state
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES_LIST.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const isCodAvailable = cartItems.length > 0 && cartItems.every((item) => (item as any).is_cod_allowed !== false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'STRIPE'>('CASH_ON_DELIVERY');
  const [siteSettings, setSiteSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/ecommerce/site-settings`)
      .then((res) => res.json())
      .then((data) => setSiteSettings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCodAvailable && paymentMethod === 'CASH_ON_DELIVERY') {
      setPaymentMethod('STRIPE');
    }
  }, [isCodAvailable, paymentMethod]);

  // Calculate Subtotal & Discount
  const subtotal = cartItems.reduce((acc, item) => acc + item.discounted_price * item.quantity, 0);

  let discount = 0;
  if (coupon) {
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = subtotal * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, subtotal);
  }

  const [shippingInfo, setShippingInfo] = useState<{
    base_fee: number;
    final_fee: number;
    discount_amount: number;
    is_free: boolean;
    display_text: string;
    applied_rule: string | null;
    threshold_rule: string | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (mounted && cartItems.length === 0 && !isSuccess) {
      router.push('/cart');
    }
  }, [mounted, cartItems]);

  // Fetch customer saved addresses
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/ecommerce/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          const def = data.find((a: any) => a.is_default) || data[0];
          setSelectedAddressId(def.id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      })
      .catch(() => setUseNewAddress(true));
  }, [token]);

  // Fetch dynamic delivery calculation
  useEffect(() => {
    if (subtotal <= 0) {
      setShippingInfo(null);
      return;
    }
    fetch(`${API_BASE_URL}/ecommerce/shipping-calculator?subtotal=${subtotal}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.final_fee === 'number') {
          setShippingInfo(data);
        }
      })
      .catch(() => {
        // Fallback silently if offline
      });
  }, [subtotal]);

  if (!mounted) return null;

  const shipping = shippingInfo !== null ? shippingInfo.final_fee : (subtotal > 500 ? 0 : 30.00);
  const tax = 0; // VAT removed per user request
  const total = Number((subtotal - discount + shipping).toFixed(2));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    setLoading(true);

    if (!token) {
      setCheckoutError('Please login to place orders.');
      setLoading(false);
      return;
    }

    // Check coupon minimum amount before submitting
    if (coupon && coupon.minimum_amount && subtotal < Number(coupon.minimum_amount)) {
      setCheckoutError(
        `Your coupon "${coupon.code}" requires a minimum subtotal of AED ${Number(coupon.minimum_amount).toFixed(2)}. ` +
        `Your current subtotal is AED ${Number(subtotal).toFixed(2)}. Please add more items or remove the coupon.`
      );
      setLoading(false);
      return;
    }

    try {
      let addressId = selectedAddressId;

      // 1. Resolve or Create Address
      if (useNewAddress || !addressId) {
        if (!addressForm.city.trim() || !addressForm.full_address.trim()) {
          setCheckoutError('Please fill in your City and Full Delivery Address.');
          setLoading(false);
          return;
        }

        if (!rawPhoneNumber.trim()) {
          setCheckoutError('Please provide a contact phone number for delivery updates & courier call.');
          setLoading(false);
          return;
        }

        const fullPhone = `${phoneDialCode} ${rawPhoneNumber.trim()}`.trim();

        const addressRes = await fetch(`${API_BASE_URL}/ecommerce/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            country: addressForm.country,
            city: addressForm.city.trim(),
            area: addressForm.city.trim(),
            street: addressForm.full_address.trim(),
            building: '',
            postal_code: addressForm.postal_code.trim() || null,
            phone: fullPhone,
            is_default: isDefaultAddress,
          }),
        });

        if (!addressRes.ok) {
          const errData = await addressRes.json();
          setCheckoutError(errData.message || 'Failed to register delivery address');
          setLoading(false);
          return;
        }

        const addressData = await addressRes.json();
        addressId = addressData.id;

        // Sync customer profile with the confirmed phone number
        if (token && fullPhone) {
          fetch(`${API_BASE_URL}/ecommerce/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              first_name: user?.first_name || 'Valued',
              last_name: user?.last_name || 'Customer',
              phone: fullPhone,
            }),
          }).catch(() => {});
        }
      }

      // 2. Perform Checkout
      const checkoutRes = await fetch(`${API_BASE_URL}/ecommerce/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: addressId,
          coupon_code: coupon?.code,
          currency: currency,
          payment_method: paymentMethod,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          items: cartItems.map((item) => ({
            variant_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setCheckoutError(checkoutData.message || 'Checkout failed');
        setLoading(false);
        return;
      }

      // If Cash on Delivery, order is confirmed immediately without Stripe intent!
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        // If customer opted NOT to save address for future orders, remove from saved list
        if (useNewAddress && !saveForNextOrder && addressId) {
          fetch(`${API_BASE_URL}/ecommerce/addresses/${addressId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }

        setOrderNum(checkoutData.order_number);
        setIsSuccess(true);
        dispatch(clearCart());
        dispatch(removeCoupon());
        setLoading(false);
        return;
      }

      // 3. For Stripe, redirect to official Stripe Hosted Checkout page
      if (checkoutData.checkout_url) {
        if (useNewAddress && !saveForNextOrder && addressId) {
          fetch(`${API_BASE_URL}/ecommerce/addresses/${addressId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }

        dispatch(clearCart());
        dispatch(removeCoupon());
        window.location.href = checkoutData.checkout_url;
        return;
      }

      setCheckoutError('Could not initialize payment with gateway. Please try again.');
    } catch (err) {
      setCheckoutError('Network connectivity error. Backend offline.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center text-green-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            Thank you for shopping with Saba Al Wadi. Your order <span className="font-bold text-foreground">#{orderNum}</span> is currently being processed.
          </p>
        </div>
        <div className="pt-6 flex flex-col gap-4">
          <Link href="/profile" className="w-full py-3.5 btn-luxury rounded-sm tracking-wider uppercase text-sm font-semibold flex items-center justify-center">
            Track My Order
          </Link>
          <Link href="/catalog" className="text-sm text-primary font-medium hover:underline">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handlePlaceOrder} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6">
            <h2 className="font-serif text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
              <Truck size={20} className="text-primary" /> Delivery Address
            </h2>

            {/* Saved Addresses Selector (if customer has saved addresses) */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3 pb-4 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase block tracking-wider">
                  Select a Shipping Address for this Order
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = !useNewAddress && selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setUseNewAddress(false);
                        }}
                        className={`p-3.5 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between space-y-2 select-none ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <MapPin size={13} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                            {addr.city}, {addr.country}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 border border-primary/20 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed pl-4 font-light">
                          {[addr.building, addr.street, addr.area, addr.city, addr.country, addr.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        {user?.phone && (
                          <div className="flex items-center gap-1.5 pl-4 text-[11px] text-muted-foreground font-mono">
                            <Phone size={11} className="text-primary" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-xs font-semibold text-primary">
                          <input
                            type="radio"
                            name="addressSelection"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-primary cursor-pointer"
                          />
                          <span>{isSelected ? 'Delivering to this address' : 'Select this address'}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Option to enter a different / new address */}
                  <div
                    onClick={() => setUseNewAddress(true)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition flex flex-col items-center justify-center text-center gap-1.5 min-h-[95px] select-none ${
                      useNewAddress
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-dashed border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Plus size={18} className={useNewAddress ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="font-semibold text-xs text-foreground">+ Deliver to a New Address</span>
                    <span className="text-[11px] text-muted-foreground">Use different shipping details for this order</span>
                  </div>
                </div>
              </div>
            )}

            {/* Address Input Form (shown if useNewAddress is true or if no saved addresses) */}
            {(useNewAddress || savedAddresses.length === 0) && (
              <div className="space-y-4 animate-in fade-in">
                {savedAddresses.length > 0 && (
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Truck size={14} className="text-primary" /> Enter New Shipping Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(false)}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      &larr; Back to saved addresses
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Country Field (Searchable) */}
                  <div className="space-y-1 relative" ref={countryDropdownRef}>
                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                      <span>Country</span>
                      <span className="text-xs text-primary font-normal">Searchable Dropdown</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition hover:border-primary/50"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{selectedCountryObj?.flag || '🌐'}</span>
                        <span className="font-medium text-foreground">{addressForm.country || 'Select Country'}</span>
                        <span className="text-xs font-mono text-muted-foreground">({selectedCountryObj?.dial_code || phoneDialCode})</span>
                      </span>
                      <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isCountryOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        <div className="p-2 border-b border-border bg-muted/30">
                          <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search country name or code..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full bg-background border border-border rounded pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
                          {filteredCountries.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                              No countries matching "{countrySearch}"
                            </div>
                          ) : (
                            filteredCountries.map((c) => {
                              const isSelected = addressForm.country?.toLowerCase() === c.name.toLowerCase();
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setAddressForm((prev) => ({
                                      ...prev,
                                      country: c.name,
                                      phone: rawPhoneNumber ? `${c.dial_code} ${rawPhoneNumber.trim()}`.trim() : '',
                                    }));
                                    setPhoneDialCode(c.dial_code);
                                    setIsCountryOpen(false);
                                    setCountrySearch('');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'hover:bg-muted/60 text-foreground'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-sm">{c.flag}</span>
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-[11px] font-mono text-muted-foreground">({c.dial_code})</span>
                                  </span>
                                  {isSelected && <Check size={14} className="text-primary" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Number Field with Country Dial Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-primary" /> Phone Number *
                      </span>
                      <span className="text-[11px] text-primary font-normal">Courier &amp; Delivery Call</span>
                    </label>
                    <div className="flex items-center bg-background border border-border rounded focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden transition">
                      <div className="px-3 py-2.5 bg-muted/40 border-r border-border flex items-center gap-1.5 text-xs font-semibold font-mono text-foreground shrink-0 select-none">
                        <span>{selectedCountryObj?.flag || '🌐'}</span>
                        <span className="text-primary">{phoneDialCode}</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder={
                          phoneDialCode === '+971'
                            ? '50 123 4567'
                            : phoneDialCode === '+880'
                            ? '1712 345678'
                            : phoneDialCode === '+966'
                            ? '50 123 4567'
                            : 'Mobile number'
                        }
                        className="w-full text-sm bg-transparent px-3 py-2.5 focus:outline-none font-mono text-foreground placeholder:text-muted-foreground"
                        value={rawPhoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d\s-]/g, '');
                          setRawPhoneNumber(val);
                          setAddressForm((prev) => ({
                            ...prev,
                            phone: val ? `${phoneDialCode} ${val.trim()}`.trim() : '',
                          }));
                        }}
                        required={useNewAddress}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">City *</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Dubai, Abu Dhabi, Sharjah, Dhaka"
                      className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={addressForm.city}
                      onChange={handleInputChange}
                      required={useNewAddress}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Postal Code / Zip Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      placeholder="e.g. 1216 or 00000"
                      className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      value={addressForm.postal_code}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Full Delivery Address *</label>
                    <textarea
                      rows={2}
                      name="full_address"
                      placeholder="House / Flat / Villa No., Building Name, Street Name, Area / Complete detailed address..."
                      className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      value={addressForm.full_address}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddressForm((prev) => ({
                          ...prev,
                          full_address: val,
                          street: val,
                        }));
                      }}
                      required={useNewAddress}
                    />
                  </div>

                  {/* Save address options */}
                  <div className="sm:col-span-2 space-y-2 pt-2 border-t border-border/60">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveForNextOrder}
                        onChange={(e) => setSaveForNextOrder(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Save this shipping address for my next orders
                      </span>
                    </label>

                    {saveForNextOrder && (
                      <label className="flex items-center gap-2 cursor-pointer select-none pl-6">
                        <input
                          type="checkbox"
                          checked={isDefaultAddress}
                          onChange={(e) => setIsDefaultAddress(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                        />
                        <span className="text-xs text-muted-foreground font-normal">
                          Set as my default shipping address
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" /> Payment Method
                </h2>
                {!isCodAvailable && (
                  <span className="text-xs text-amber-500 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    COD Restricted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery option */}
                <div
                  onClick={() => {
                    if (isCodAvailable) setPaymentMethod('CASH_ON_DELIVERY');
                  }}
                  className={`p-4 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : isCodAvailable
                      ? 'border-border bg-card hover:border-primary/50'
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Truck size={16} className="text-emerald-500" /> Cash on Delivery (COD)
                    </span>
                    {paymentMethod === 'CASH_ON_DELIVERY' && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isCodAvailable
                      ? 'Pay in cash upon doorstep delivery in UAE.'
                      : '⚠️ Unavailable: One or more abayas require prepayment.'}
                  </p>
                </div>

                {/* Card payment option */}
                <div
                  onClick={() => setPaymentMethod('STRIPE')}
                  className={`p-4 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'STRIPE'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <CreditCard size={16} className="text-primary" /> Credit / Debit Card
                    </span>
                    {paymentMethod === 'STRIPE' && (
                      <CheckCircle2 size={16} className="text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Instant secure card payment via Stripe.
                  </p>
                </div>
              </div>

              {/* Stripe Hosted Checkout Notice */}
              {paymentMethod === 'STRIPE' && (() => {
                const isLive = siteSettings?.stripe_mode === 'LIVE';
                return (
                  <div className="bg-background border border-border p-4 sm:p-5 rounded-xl space-y-3 mt-3 animate-in fade-in shadow-xs">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Lock size={13} className="text-primary" /> Official Stripe Hosted Checkout
                      </span>
                      {isLive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck size={12} /> Live Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle size={12} /> Test Sandbox
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs text-muted-foreground space-y-2">
                      <p className="leading-relaxed">
                        You will be redirected securely to the <strong>official Stripe Hosted Checkout page</strong> to complete payment with Credit / Debit card, Apple Pay, Google Pay, or 3D Secure bank OTP.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-medium text-foreground">
                        <span className="flex items-center gap-1 text-primary">
                          <ShieldCheck size={14} /> PCI DSS Level 1 Certified
                        </span>
                        <span className="text-muted-foreground">• Visa, Mastercard, AMEX, Apple Pay</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <Clock size={12} className="text-primary shrink-0" />
                      <span>
                        Order reservation active for <strong>30 minutes</strong>. If payment is not completed or cancelled, you can retry anytime within 30 minutes.
                      </span>
                    </p>
                  </div>
                );
              })()}
            </div>

            {checkoutError && (
              <div className="flex flex-col gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{checkoutError}</span>
                </div>
                {coupon && checkoutError.includes('coupon') && (
                  <button
                    type="button"
                    onClick={() => { dispatch(removeCoupon()); setCheckoutError(''); }}
                    className="self-start text-xs font-semibold underline text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Remove coupon "{coupon.code}"
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-md uppercase font-semibold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'btn-luxury'
                }`}
            >
              {loading
                ? 'Processing Order...'
                : paymentMethod === 'STRIPE'
                ? `Proceed to Stripe Payment (${formatPrice(total)})`
                : `Place Order (Cash on Delivery)`}
            </button>
          </form>
        </div>

        {/* Order review */}
        <div className="bg-card border border-border p-6 rounded-md shadow-sm h-fit space-y-6">
          <h2 className="font-serif text-lg font-bold border-b border-border pb-3">Review Items</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <img src={item.image || ''} alt="" className="h-16 w-12 object-cover rounded border border-border" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-muted-foreground font-light">Qty: {item.quantity}</p>
                </div>
                <span className="text-xs font-semibold">{formatPrice(item.discounted_price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs font-light">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-500 font-semibold">
                <span>Discount ({coupon.code})</span>
                <span>- {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted-foreground block">Shipping</span>
                {shippingInfo?.applied_rule && (
                  <span className="text-xs text-green-500 block font-normal">
                    ✓ {shippingInfo.applied_rule}
                  </span>
                )}
              </div>
              <div className="text-right">
                {shipping === 0 ? (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                    FREE
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-foreground font-medium">{formatPrice(shipping)}</span>
                    {shippingInfo && shippingInfo.discount_amount > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(shippingInfo.base_fee)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {shippingInfo?.threshold_rule && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-1.5">
                <span>✈ {shippingInfo.threshold_rule}</span>
              </div>
            )}

            <div className="border-t border-border pt-3 flex justify-between text-sm font-bold">
              <span>Grand Total</span>
              <span className="text-primary font-serif">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
