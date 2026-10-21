import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { Product } from '../data/products';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';
import { useToast } from './ToastContext';
export interface CartItem { product: Product & { dbId?: string }; quantity: number; }
export interface CustomerDetails { name:string;phone:string;email:string;address:string;city:string;state:string;pincode:string;transportPreference:string;notes:string;district?:string; }
export interface PlacedOrder { orderId:string;date:string;customer:CustomerDetails;items:CartItem[];totalBoxes:number;subtotal:number;status:any;lorryTransport?:string;lrNumber?:string;dbId?:string;guestTrackingToken?:string; }
interface CartContextType {cart:CartItem[];addToCart:(p:Product,q?:number)=>void;updateQuantity:(id:number,q:number)=>void;removeFromCart:(id:number)=>void;clearCart:()=>void;getItemQuantity:(id:number)=>number;totalItems:number;totalBoxes:number;subtotal:number;isCartOpen:boolean;setIsCartOpen:(v:boolean)=>void;customerDetails:CustomerDetails;updateCustomerDetails:(d:Partial<CustomerDetails>)=>void;ordersHistory:PlacedOrder[];addPlacedOrder:(order:PlacedOrder)=>Promise<PlacedOrder>;placeOrder:()=>Promise<PlacedOrder>;updateOrderStatus:(orderId:string,status:any,lrNumber?:string,lorryTransport?:string)=>void;reorder:(items:CartItem[])=>void;}
const CartContext=createContext<CartContextType|undefined>(undefined);const CART_KEY='redthunder_cart_v4';const CUSTOMER_KEY='redthunder_customer_v4';
const defaultCustomer:CustomerDetails={name:'',phone:'',email:'',address:'',city:'Chennai',state:'Tamil Nadu',pincode:'',transportPreference:'Parcel Office Pickup in My City (Standard & Cheap)',notes:'',district:''};
function loadJson<T>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
export const CartProvider:React.FC<{children:React.ReactNode}>=({children})=>{const{user,session,isAuthenticated}=useAuth();const{products}=useProducts();const[cart,setCart]=useState<CartItem[]>(()=>loadJson(CART_KEY,[]));const[customerDetails,setCustomerDetails]=useState<CustomerDetails>(()=>loadJson(CUSTOMER_KEY,defaultCustomer));const[ordersHistory,setOrdersHistory]=useState<PlacedOrder[]>([]);const[isCartOpen,setIsCartOpen]=useState(false);useEffect(()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));},[cart]);useEffect(()=>{localStorage.setItem(CUSTOMER_KEY,JSON.stringify(customerDetails));},[customerDetails]);useEffect(()=>{if(user)setCustomerDetails(p=>({...p,name:user.name||p.name,phone:user.phone||p.phone,email:user.email||p.email,city:user.city||p.city,address:user.address||p.address,state:user.state||p.state,pincode:user.pincode||p.pincode,district:user.district||p.district}));},[user]);
const refreshOrders=async()=>{if(!isAuthenticated||!session?.access_token){setOrdersHistory([]);return;}try{const rows:any[]=await dbSelect<any>('orders','select=*,order_items(*),order_addresses(*),order_status_history(*)&order=placed_at.desc',session.access_token);setOrdersHistory(rows.map((row)=>mapDbOrder(row,products)));}catch(e){console.error('Order history load failed',e);}};
useEffect(()=>{refreshOrders();},[session?.access_token,isAuthenticated]);

// Keep the persisted cart honest: prices, names and availability always come from the live catalogue,
// so a cart saved days ago can never show (or message) an outdated rate or a withdrawn product.
const { showToast } = useToast();
useEffect(()=>{
  if(!products.length) return;
  const byCode=new Map(products.map(p=>[p.id,p]));
  let changedPrice=0, removed=0;
  setCart(prev=>{
    const next:CartItem[]=[];
    for(const item of prev){
      const live=byCode.get(item.product.id);
      if(!live||live.stockStatus==='OUT_OF_STOCK'){removed++;continue;}
      if(live.rate!==item.product.rate) changedPrice++;
      next.push({quantity:item.quantity,product:{...item.product,...live}});
    }
    const same=next.length===prev.length&&next.every((n,i)=>n.product.rate===prev[i].product.rate&&n.product.name===prev[i].product.name&&(n.product as any).dbId===(prev[i].product as any).dbId);
    return same?prev:next;
  });
  if(removed||changedPrice){
    showToast({type:'warning',title:'Cart updated',message:[removed?`${removed} item${removed>1?'s':''} no longer available were removed.`:'',changedPrice?`${changedPrice} price${changedPrice>1?'s':''} refreshed to today\'s rate.`:''].filter(Boolean).join(' ')});
  }
},[products]);
const addToCart=(product:Product,q=1)=>setCart(prev=>{const found=prev.find(i=>i.product.id===product.id);return found?prev.map(i=>i.product.id===product.id?{...i,quantity:i.quantity+Math.max(1,q)}:i):[...prev,{product,quantity:Math.max(1,q)}];});
const updateQuantity=(id:number,q:number)=>setCart(prev=>q<=0?prev.filter(i=>i.product.id!==id):prev.map(i=>i.product.id===id?{...i,quantity:q}:i));const removeFromCart=(id:number)=>setCart(prev=>prev.filter(i=>i.product.id!==id));const clearCart=()=>setCart([]);const getItemQuantity=(id:number)=>cart.find(i=>i.product.id===id)?.quantity||0;const updateCustomerDetails=(d:Partial<CustomerDetails>)=>setCustomerDetails(p=>({...p,...d}));const totalBoxes=useMemo(()=>cart.reduce((s,i)=>s+i.quantity,0),[cart]);const totalItems=cart.length;const subtotal=useMemo(()=>cart.reduce((s,i)=>s+i.product.rate*i.quantity,0),[cart]);
const placeOrder=async():Promise<PlacedOrder>=>{throw new Error('This website is a catalogue and does not accept online fireworks orders. Please call +91 8124100501 for product information and lawful offline enquiries.');};const addPlacedOrder=async()=>placeOrder();const updateOrderStatus=async()=>{await refreshOrders();};const reorder=(items:CartItem[])=>setCart(items.map(i=>({...i})));return <CartContext.Provider value={{cart,addToCart,updateQuantity,removeFromCart,clearCart,getItemQuantity,totalItems,totalBoxes,subtotal,isCartOpen,setIsCartOpen,customerDetails,updateCustomerDetails,ordersHistory,addPlacedOrder,placeOrder,updateOrderStatus,reorder}}>{children}</CartContext.Provider>;};
function mapDbOrder(o:any, liveProducts: Product[] = []):PlacedOrder {
  const addressRows = Array.isArray(o.order_addresses) ? o.order_addresses : [];
  const address = addressRows.find((row:any) => /delivery|shipping/i.test(String(row.address_role || ''))) || addressRows[0] || {};
  const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
  return {
    orderId:String(o.order_number || o.order_id),
    date:new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
    customer:{
      name: address.recipient_name || '', phone: address.recipient_mobile || '', email: '',
      address: [address.address_line_1,address.address_line_2,address.landmark].filter(Boolean).join(', '),
      city: address.city || o.delivery_city || '', state: address.state || o.delivery_state || '',
      pincode: address.postal_code || o.delivery_postal_code || '', transportPreference: o.delivery_region || '',
      notes: o.customer_notes || '', district: address.district || '',
    },
    items:orderItems.map((i:any)=>{
      const live = liveProducts.find((p:any) => String((p as any).dbId || '') === String(i.product_id));
      const product: any = live ? { ...live } : {
        id: Number(i.product_id), dbId: String(i.product_id), sNo: Number(i.product_id),
        name: i.product_name_snapshot || 'Product from prior order', category: 'Previous order',
        unit: i.pack_type_snapshot || 'Box', rate: Number(i.unit_price || 0), description: '',
      };
      product.name = i.product_name_snapshot || product.name;
      product.unit = i.pack_type_snapshot || product.unit;
      product.rate = Number(i.unit_price || product.rate || 0);
      return { product, quantity:Number(i.quantity || 0) };
    }),
    totalBoxes:orderItems.reduce((sum:number,item:any)=>sum+Number(item.quantity||0),0),
    subtotal:Number(o.subtotal_amount ?? o.order_amount ?? o.total_amount ?? 0),
    status:o.status, lrNumber:undefined, dbId:String(o.order_id), guestTrackingToken:undefined,
  };
}
export const useCart=()=>{const c=useContext(CartContext);if(!c)throw new Error('useCart must be used within CartProvider');return c;};
