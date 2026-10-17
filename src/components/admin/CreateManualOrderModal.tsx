'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '@/config/api';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  User,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  MapPin,
  Truck,
} from 'lucide-react';
import { COUNTRIES_LIST } from '@/constants/countries';

interface ProductVariant {
  id: string;
  sku: string;
  price: number | string;
  inventories?: { available_quantity: number }[];
  attribute_values?: { attribute_value: { value: string } }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  variants: ProductVariant[];
  images?: { image_url: string }[];
}

interface CustomerAddress {
  id: string;
  country: string;
  city: string;
  area?: string | null;
  street: string;
  building?: string | null;
  postal_code?: string | null;
  is_default?: boolean;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  addresses?: CustomerAddress[];
}

interface DeliveryPartnerOption {
  id: string;
  name: string;
  code: string;
  tracking_url_template?: string | null;
}

export interface ManualItem {
  variant_id: string;
  product_name: string;
  sku: string;
  price: number;
  quantity: number;
  available_stock: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId?: string) => void;
  token: string | null;
}

export default function CreateManualOrderModal({ isOpen, onClose, onOrderCreated, token }: Props) {
  // Customer mode: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // Existing customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');

  // New customer inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Dubai');
  const [state, setState] = useState('Dubai');
  const [country, setCountry] = useState('United Arab Emirates');
  const [postalCode, setPostalCode] = useState('00000');

  // Address selection for existing customer: 'saved' | 'new'
  const [addressSelectMode, setAddressSelectMode] = useState<'saved' | 'new'>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Searchable Country Dropdown state
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  // Products & Variants catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Selected Order Items
  const [orderItems, setOrderItems] = useState<ManualItem[]>([]);

  // Financials & Settings
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH_ON_DELIVERY');
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [orderStatus, setOrderStatus] = useState<string>('CONFIRMED');

  // Delivery Partner & Tracking
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerOption[]>([]);
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch products, customers and delivery partners when modal opens
  useEffect(() => {
    if (!isOpen || !token) return;

    // Fetch Products
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };

    // Fetch Customers
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.items || data.customers || []);
          setCustomers(list);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    };

    // Fetch Delivery Partners
    const fetchPartners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/delivery-partners`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
          setDeliveryPartners(list);
        }
      } catch (err) {
        console.error('Failed to load delivery partners:', err);
      }
    };

    fetchCatalog();
    fetchCustomers();
    fetchPartners();
  }, [isOpen, token]);

  // Load and apply customer addresses when existing customer is selected
  const applySavedAddress = (addr: CustomerAddress) => {
    setStreet([addr.building, addr.street].filter(Boolean).join(', ') || addr.street || '');
    setCity(addr.city || 'Dubai');
    setState(addr.area || 'Dubai');
    setCountry(addr.country || 'United Arab Emirates');
    setPostalCode(addr.postal_code || '00000');
  };

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerAddresses([]);
      setSelectedAddressId('');
      return;
    }

    const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
    if (currentCustomer?.addresses && currentCustomer.addresses.length > 0) {
      setCustomerAddresses(currentCustomer.addresses);
      const def = currentCustomer.addresses.find((a) => a.is_default) || currentCustomer.addresses[0];
      setSelectedAddressId(def.id);
      applySavedAddress(def);
      setAddressSelectMode('saved');
    } else {
      setLoadingAddresses(true);
      fetch(`${API_BASE_URL}/admin/customers/${selectedCustomerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const addrs = data.addresses || [];
          setCustomerAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a: CustomerAddress) => a.is_default) || addrs[0];
            setSelectedAddressId(def.id);
            applySavedAddress(def);
            setAddressSelectMode('saved');
          } else {
            setSelectedAddressId('');
            setAddressSelectMode('new');
          }
        })
        .catch(() => {
          setAddressSelectMode('new');
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [selectedCustomerId, customers, token]);

  const handlePartnerChange = (partnerName: string) => {
    setDeliveryPartner(partnerName);
    const partner = (deliveryPartners || []).find((p) => p.name === partnerName);
    if (partner?.tracking_url_template && trackingNumber.trim()) {
      setTrackingUrl(partner.tracking_url_template.replace('{tracking_number}', encodeURIComponent(trackingNumber.trim())));
    }
  };

  const handleTrackingNumberChange = (num: string) => {
    setTrackingNumber(num);
    const partner = (deliveryPartners || []).find((p) => p.name === deliveryPartner);
    if (partner?.tracking_url_template && num.trim()) {
      setTrackingUrl(partner.tracking_url_template.replace('{tracking_number}', encodeURIComponent(num.trim())));
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 30);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)),
    );
  }, [customers, customerSearch]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 15);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(q)),
    );
  }, [products, productSearch]);

  // Add Item to Order
  const handleAddItem = (product: Product, variant: ProductVariant) => {
    const existingIndex = orderItems.findIndex((it) => it.variant_id === variant.id);
    const availableStock = variant.inventories?.reduce((acc, inv) => acc + (inv.available_quantity || 0), 0) ?? 99;

    if (existingIndex > -1) {
      // Increase quantity if already in order
      setOrderItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it,
        ),
      );
    } else {
      // Add new item
      setOrderItems((prev) => [
        ...prev,
        {
          variant_id: variant.id,
          product_name: product.name,
          sku: variant.sku,
          price: Number(variant.price),
          quantity: 1,
          available_stock: availableStock,
        },
      ]);
    }
  };

  // Adjust item quantity
  const handleUpdateQuantity = (variantId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((it) => {
          if (it.variant_id === variantId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as ManualItem[],
    );
  };

  // Set quantity directly
  const handleSetQuantity = (variantId: string, qty: number) => {
    if (isNaN(qty) || qty <= 0) return;
    setOrderItems((prev) =>
      prev.map((it) => (it.variant_id === variantId ? { ...it, quantity: qty } : it)),
    );
  };

  // Remove Item
  const handleRemoveItem = (variantId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.variant_id !== variantId));
  };

  // Edit item unit price
  const handleEditPrice = (variantId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setOrderItems((prev) =>
      prev.map((it) => (it.variant_id === variantId ? { ...it, price: newPrice } : it)),
    );
  };

  // Calculations
  const subtotal = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const total = Math.max(0, subtotal + Number(deliveryCharge || 0) - Number(discount || 0));

  // Submit Manual Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (orderItems.length === 0) {
      setErrorMsg('Please add at least one product item to the order.');
      return;
    }

    if (customerMode === 'existing' && !selectedCustomerId) {
      setErrorMsg('Please select an existing customer or switch to "New Customer".');
      return;
    }

    if (customerMode === 'new' && (!firstName.trim() || !email.trim())) {
      setErrorMsg('Please provide customer First Name and Email.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload: any = {
        items: orderItems.map((it) => ({
          variant_id: it.variant_id,
          quantity: it.quantity,
          price: it.price,
        })),
        delivery_charge: Number(deliveryCharge || 0),
        discount: Number(discount || 0),
        currency: 'AED',
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: orderStatus,
        delivery_partner: deliveryPartner.trim() || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        tracking_url: trackingUrl.trim() || undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
      };

      if (customerMode === 'existing') {
        payload.customer_id = selectedCustomerId;
      } else {
        payload.customer_first_name = firstName.trim();
        payload.customer_last_name = lastName.trim() || 'Customer';
        payload.customer_email = email.trim();
        payload.customer_phone = phone.trim() || undefined;
      }

      // Always pass the resolved shipping address
      payload.address = {
        street: street.trim() || 'Manual Storefront Order',
        city: city.trim() || 'Dubai',
        state: state.trim() || 'Dubai',
        country: country.trim() || 'United Arab Emirates',
        postal_code: postalCode.trim() || '00000',
      };

      const res = await fetch(`${API_BASE_URL}/admin/orders/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create manual order');
      }

      const createdOrder = await res.json();
      onOrderCreated(createdOrder.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create manual order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-foreground animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">Create Manual Order</h2>
              <p className="text-xs text-muted-foreground">
                Process phone, concierge, or custom client orders with direct inventory allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Customer Information Section */}
          <div className="bg-muted/20 border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User size={15} className="text-primary" /> Customer Details
              </h3>
              <div className="flex items-center bg-background border border-border rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    customerMode === 'existing'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    customerMode === 'new'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  New Client / Phone
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search customer by name, email or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="">-- Choose Customer --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.email}) {c.phone ? `• ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Existing Customer Address Selection Options */}
                {selectedCustomerId && (
                  <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <MapPin size={14} className="text-primary" />
                        <span>Delivery Address for Order</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setAddressSelectMode('saved');
                            if (customerAddresses.length > 0) {
                              const def = customerAddresses.find((a) => a.id === selectedAddressId) || customerAddresses[0];
                              applySavedAddress(def);
                            }
                          }}
                          disabled={customerAddresses.length === 0}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                            addressSelectMode === 'saved'
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          Select from Existing Address ({customerAddresses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressSelectMode('new');
                            setStreet('');
                            setCity('Dubai');
                            setState('Dubai');
                            setCountry('United Arab Emirates');
                            setPostalCode('00000');
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                            addressSelectMode === 'new'
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          + New Address
                        </button>
                      </div>
                    </div>

                    {loadingAddresses ? (
                      <p className="text-xs text-muted-foreground py-2">Loading customer addresses...</p>
                    ) : addressSelectMode === 'saved' && customerAddresses.length > 0 ? (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Select Saved Address</label>
                        <select
                          value={selectedAddressId}
                          onChange={(e) => {
                            setSelectedAddressId(e.target.value);
                            const found = customerAddresses.find((a) => a.id === e.target.value);
                            if (found) applySavedAddress(found);
                          }}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                          {customerAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {[addr.building, addr.street, addr.city, addr.country].filter(Boolean).join(', ')}
                              {addr.is_default ? ' (Default)' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground/80 space-y-1">
                          <p className="font-semibold text-foreground">
                            {[street, city, state, country].filter(Boolean).join(', ')}
                          </p>
                          {postalCode && <p className="text-muted-foreground font-mono">Postal Code: {postalCode}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {customerAddresses.length === 0 && (
                          <p className="text-xs text-amber-500 font-medium">
                            No saved addresses on file for this customer. Enter a new delivery address below:
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Street / Building Address *</label>
                            <input
                              type="text"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="Villa 24, Jumeirah 1"
                              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">City *</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Dubai"
                              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">Area / State</label>
                            <input
                              type="text"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              placeholder="Dubai"
                              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                            />
                          </div>
                          
                          {/* Searchable Country Dropdown */}
                          <div className="relative">
                            <label className="text-xs font-semibold text-muted-foreground">Country * (Search &amp; Select)</label>
                            <button
                              type="button"
                              onClick={() => setIsCountryOpen(!isCountryOpen)}
                              className="w-full mt-1 text-xs bg-background border border-border rounded-lg px-3 py-2 flex items-center justify-between text-left focus:outline-hidden focus:border-primary cursor-pointer hover:border-primary/50 transition"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span>{COUNTRIES_LIST.find((c) => c.name.toLowerCase() === country.toLowerCase())?.flag || '🌐'}</span>
                                <span className="font-medium text-foreground truncate">{country || 'Select Country'}</span>
                              </span>
                              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isCountryOpen ? 'rotate-180 text-primary' : ''}`} />
                            </button>

                            {isCountryOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                                <div className="p-2 border-b border-border bg-muted/40">
                                  <div className="relative">
                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                                <div className="max-h-52 overflow-y-auto divide-y divide-border/30">
                                  {COUNTRIES_LIST.filter(
                                    (c) =>
                                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                      c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                      c.dial_code.includes(countrySearch),
                                  ).map((c) => {
                                    const isSelected = country.toLowerCase() === c.name.toLowerCase();
                                    return (
                                      <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => {
                                          setCountry(c.name);
                                          setIsCountryOpen(false);
                                          setCountrySearch('');
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                          isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'
                                        }`}
                                      >
                                        <span className="flex items-center gap-2 truncate">
                                          <span>{c.flag}</span>
                                          <span className="truncate">{c.name}</span>
                                        </span>
                                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">{c.code}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">Postal Code</label>
                            <input
                              type="text"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              placeholder="00000"
                              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Fatima"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Al Nuaimi"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="fatima@example.ae"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Street / Building Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Villa 24, Jumeirah 1"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dubai"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
                
                {/* Searchable Country Dropdown for New Customer */}
                <div className="relative">
                  <label className="text-xs font-semibold text-muted-foreground">Country (Search &amp; Select)</label>
                  <button
                    type="button"
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className="w-full mt-1 text-xs bg-background border border-border rounded-lg px-3 py-2 flex items-center justify-between text-left focus:outline-hidden focus:border-primary cursor-pointer hover:border-primary/50 transition"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{COUNTRIES_LIST.find((c) => c.name.toLowerCase() === country.toLowerCase())?.flag || '🌐'}</span>
                      <span className="font-medium text-foreground truncate">{country || 'Select Country'}</span>
                    </span>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isCountryOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>

                  {isCountryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                      <div className="p-2 border-b border-border bg-muted/40">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                      <div className="max-h-52 overflow-y-auto divide-y divide-border/30">
                        {COUNTRIES_LIST.filter(
                          (c) =>
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dial_code.includes(countrySearch),
                        ).map((c) => {
                          const isSelected = country.toLowerCase() === c.name.toLowerCase();
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCountry(c.name);
                                setIsCountryOpen(false);
                                setCountrySearch('');
                              }}
                              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span>{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{c.code}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Order Items Selection & Management */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Package size={15} className="text-primary" /> Order Items ({orderItems.length})
            </h3>

            {/* Catalog Item Picker */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search product catalog by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Product quick results */}
              <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-lg bg-background">
                {loadingCatalog ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No matching products found</div>
                ) : (
                  filteredProducts.map((p) =>
                    (p.variants || []).map((v) => {
                      const stock =
                        v.inventories?.reduce((acc, inv) => acc + (inv.available_quantity || 0), 0) ?? 0;
                      return (
                        <div
                          key={v.id}
                          className="p-2.5 flex items-center justify-between hover:bg-accent/50 transition text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="font-semibold text-foreground block truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              SKU: {v.sku} • Stock: <b className={stock > 0 ? 'text-emerald-500' : 'text-red-500'}>{stock}</b>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-primary">AED {Number(v.price).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(p, v)}
                              className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus size={13} /> Add
                            </button>
                          </div>
                        </div>
                      );
                    }),
                  )
                )}
              </div>
            </div>

            {/* Added Items List / Table */}
            {orderItems.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                No items added to this order yet. Search and select products from the catalog above.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-card divide-y divide-border shadow-xs">
                {orderItems.map((item) => (
                  <div key={item.variant_id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-foreground truncate">{item.product_name}</h4>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Price input */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground text-xs">AED</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleEditPrice(item.variant_id, parseFloat(e.target.value))}
                          className="w-20 bg-background border border-border rounded px-2 py-1 text-xs text-right font-medium focus:outline-hidden focus:border-primary"
                        />
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.variant_id, -1)}
                          className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleSetQuantity(item.variant_id, parseInt(e.target.value))}
                          className="w-12 text-center text-xs font-bold bg-transparent focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.variant_id, 1)}
                          className="p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <span className="w-24 text-right font-bold text-xs text-primary">
                        AED {(item.price * item.quantity).toFixed(2)}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.variant_id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Financials, Discounts & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment & Status Options */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard size={15} className="text-primary" /> Payment & Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD_ON_DELIVERY">Card on Delivery</option>
                    <option value="STRIPE">Stripe / Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Order Status</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                  </select>
                </div>
              </div>

              {/* Delivery Courier & Tracking */}
              <div className="pt-2 border-t border-border/60 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck size={13} className="text-primary" /> Courier & Tracking (Optional)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Delivery Partner</label>
                    <select
                      value={deliveryPartner}
                      onChange={(e) => handlePartnerChange(e.target.value)}
                      className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-hidden"
                    >
                      <option value="">None / Self Fulfillment</option>
                      {(deliveryPartners || []).map((dp) => (
                        <option key={dp.id} value={dp.name}>{dp.name}</option>
                      ))}
                      {!(deliveryPartners || []).some((p) => p.name === deliveryPartner) && deliveryPartner && (
                        <option value={deliveryPartner}>{deliveryPartner}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Tracking Number / AWB</label>
                    <input
                      type="text"
                      placeholder="e.g. TRK12345678"
                      value={trackingNumber}
                      onChange={(e) => handleTrackingNumberChange(e.target.value)}
                      className="w-full mt-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {trackingUrl && (
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Tracking Link</label>
                    <input
                      type="text"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full mt-0.5 bg-background border border-border rounded-lg px-2 py-1 text-xs text-muted-foreground focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Calculations Box */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">AED {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Truck size={13} /> Delivery Charge
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">AED</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-background border border-border rounded px-2 py-1 text-xs text-right font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Custom Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">-AED</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-background border border-border rounded px-2 py-1 text-xs text-right font-medium focus:outline-hidden text-emerald-500"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold">
                <span className="font-serif">Grand Total</span>
                <span className="font-serif text-base text-primary">AED {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || orderItems.length === 0}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? 'Creating Order...' : `Create Order (AED ${total.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
