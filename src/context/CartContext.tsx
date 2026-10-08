import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dbSelect, rpc } from '../lib/supabase';
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
const refreshOrders=async()=>{if(!isAuthenticated||!session?.access_token){setOrdersHistory([]);return;}try{const rows:any[]=await dbSelect<any>('orders','select=*,order_items(*),order_tracking(*)&order=created_at.desc',session.access_token);setOrdersHistory(rows.map(mapDbOrder));}catch(e){console.error('Order history load failed',e);}};
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
const placeOrder=async():Promise<PlacedOrder>=>{if(!cart.length)throw new Error('Your cart is empty.');if(!customerDetails.name.trim()||!customerDetails.phone.trim()||!customerDetails.city.trim())throw new Error('Please complete your name, phone and city.');if(!customerDetails.email.trim()&&!isAuthenticated)throw new Error('Guest checkout requires an email address.');const items=cart.map(i=>({product_id:(i.product as any).dbId,quantity:i.quantity}));if(items.some(i=>!i.product_id))throw new Error('A product in the cart is no longer available. Please refresh the product list.');const result:any=await rpc('create_order',{p_user_id:user?.id||null,p_customer_email:customerDetails.email||null,p_customer_phone:customerDetails.phone,p_shipping:{first_name:customerDetails.name.split(/\s+/)[0],last_name:customerDetails.name.split(/\s+/).slice(1).join(' '),phone:customerDetails.phone,address_line_1:customerDetails.address,city:customerDetails.city,district:customerDetails.district||'',state:customerDetails.state,postal_code:customerDetails.pincode,country:'India'},p_items:items,p_payment_method:'whatsapp_booking',p_customer_note:customerDetails.notes||null},session?.access_token);const order:PlacedOrder={orderId:String(result.order_number),date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),customer:customerDetails,items:[...cart],totalBoxes:Number(result.total_boxes_count),subtotal:Number(result.subtotal),status:'pending',guestTrackingToken:result.guest_tracking_token,dbId:result.id};setOrdersHistory(prev=>[order,...prev]);clearCart();return order;};
const addPlacedOrder=async()=>placeOrder();const updateOrderStatus=async()=>{await refreshOrders();};const reorder=(items:CartItem[])=>setCart(items.map(i=>({...i})));return <CartContext.Provider value={{cart,addToCart,updateQuantity,removeFromCart,clearCart,getItemQuantity,totalItems,totalBoxes,subtotal,isCartOpen,setIsCartOpen,customerDetails,updateCustomerDetails,ordersHistory,addPlacedOrder,placeOrder,updateOrderStatus,reorder}}>{children}</CartContext.Provider>;};
function mapDbOrder(o:any):PlacedOrder{return{orderId:String(o.order_number),date:new Date(o.created_at||o.placed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),customer:{name:[o.shipping_first_name,o.shipping_last_name].filter(Boolean).join(' '),phone:o.shipping_phone||o.customer_phone||'',email:o.customer_email||'',address:o.shipping_address_line_1||'',city:o.shipping_city||'',state:o.shipping_state||'',pincode:o.shipping_postal_code||'',transportPreference:o.lorry_transporter_id||'',notes:o.customer_note||'',district:o.shipping_district||''},items:(o.order_items||[]).map((i:any)=>({product:{id:Number(i.product_code),dbId:i.product_id,sNo:Number(i.product_code),name:i.product_name,category:i.category,unit:i.pack_type,rate:Number(i.unit_price),description:'',imageUrl:i.product_image},quantity:Number(i.quantity)})),totalBoxes:Number(o.total_boxes_count||0),subtotal:Number(o.subtotal||0),status:o.status,lrNumber:o.lr_number,dbId:o.id,guestTrackingToken:o.guest_tracking_token};}
export const useCart=()=>{const c=useContext(CartContext);if(!c)throw new Error('useCart must be used within CartProvider');return c;};
