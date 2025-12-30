import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Droplet, Plus, Minus, X, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  menuItemId: number;
  menuItemName: string;
  sizeId: number;
  sizeName: string;
  quantity: number;
  itemPrice: number;
  addOnIds: number[];
  addOnNames: string[];
  addOnsTotal: number;
}

export default function Menu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showCart, setShowCart] = useState(false);

  const { data: menuItems } = trpc.menu.getItems.useQuery();
  const { data: sizes } = trpc.menu.getSizes.useQuery();
  const { data: addOns } = trpc.menu.getAddOns.useQuery();

  // Auto-select first size when dialog opens
  useEffect(() => {
    if (showDialog && sizes && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0].id);
    }
  }, [showDialog, sizes]);

  const categories = ["All", ...new Set(menuItems?.map(item => item.category).filter(Boolean) || [])];
  
  const filteredItems = activeCategory === "All" 
    ? menuItems 
    : menuItems?.filter(item => item.category === activeCategory);

  const handleAddToCart = () => {
    if (!selectedItem || !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const size = sizes?.find((s) => s.id === selectedSize);
    const addOnsData = addOns?.filter((a) => selectedAddOns.includes(a.id)) || [];

    const itemPrice = parseFloat(selectedItem.basePrice) * parseFloat(size?.priceMultiplier || "1");
    const addOnsTotal = addOnsData.reduce((sum, a) => sum + parseFloat(a.price), 0);

    const cartItem: CartItem = {
      menuItemId: selectedItem.id,
      menuItemName: selectedItem.name,
      sizeId: selectedSize,
      sizeName: size?.name || "",
      quantity,
      itemPrice,
      addOnIds: selectedAddOns,
      addOnNames: addOnsData.map((a) => a.name),
      addOnsTotal,
    };

    setCart([...cart, cartItem]);
    toast.success(`${selectedItem.name} added!`, { duration: 1500, position: 'top-center' });
    resetDialog();
  };

  const resetDialog = () => {
    setSelectedItem(null);
    setSelectedSize(null);
    setSelectedAddOns([]);
    setQuantity(1);
    setShowDialog(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.itemPrice + item.addOnsTotal) * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "/checkout";
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">FreshSip</span>
            </div>
          </Link>
          
          {/* Desktop Cart */}
          <button
            onClick={() => setShowCart(true)}
            className="hidden md:flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-medium text-sm transition-all hover:bg-orange-600"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="bg-white text-orange-600 rounded-full px-2 py-0.5 text-xs font-bold">{totalItems}</span>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        {/* Category Filter */}
        <div className="overflow-x-auto pb-3 mb-4 -mx-4 px-4">
          <div className="inline-flex gap-2 min-w-full justify-start md:justify-center">
            {categories.map((category) => {
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as string)}
                  className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap text-sm ${
                    activeCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems?.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:shadow-lg"
              onClick={() => {
                setSelectedItem(item);
                setSelectedSize(sizes?.[0]?.id || null);
                setShowDialog(true);
              }}
            >
              <div className="aspect-square bg-gray-50 overflow-hidden relative">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Droplet className="w-10 h-10 text-orange-200" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-orange-600">₹{item.basePrice}</span>
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Mobile Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-3">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold shadow-xl flex items-center justify-between px-5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">₹{calculateTotal().toFixed(0)}</span>
              <ChevronUp className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-0 gap-0">
          {selectedItem?.image && (
            <div className="aspect-video w-full overflow-hidden rounded-t-3xl">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop';
                }}
              />
            </div>
          )}
          
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedItem?.name}</h2>
              {selectedItem?.description && (
                <p className="text-gray-500 text-sm mt-1">{selectedItem.description}</p>
              )}
            </div>

            {/* Size Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Choose Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {sizes?.map((size) => {
                  const price = (parseFloat(selectedItem?.basePrice || 0) * parseFloat(size.priceMultiplier)).toFixed(0);
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-3 rounded-xl text-center transition-all border-2 ${
                        selectedSize === size.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className={`font-semibold text-sm ${selectedSize === size.id ? "text-orange-600" : "text-gray-700"}`}>{size.name}</div>
                      <div className={`text-xs mt-1 ${selectedSize === size.id ? "text-orange-500" : "text-gray-500"}`}>₹{price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            {addOns && addOns.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Add Extras</h4>
                <div className="grid grid-cols-2 gap-2">
                  {addOns?.map((addOn) => (
                    <button
                      key={addOn.id}
                      onClick={() => {
                        if (selectedAddOns.includes(addOn.id)) {
                          setSelectedAddOns(selectedAddOns.filter(id => id !== addOn.id));
                        } else {
                          setSelectedAddOns([...selectedAddOns, addOn.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all border-2 ${
                        selectedAddOns.includes(addOn.id) 
                          ? "border-orange-500 bg-orange-50" 
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{addOn.name === 'Ice Cream' ? '🍦' : '🍯'}</span>
                        <span className="font-medium text-sm text-gray-700">{addOn.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${selectedAddOns.includes(addOn.id) ? 'text-orange-600' : 'text-gray-500'}`}>
                        +₹{addOn.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="font-semibold text-gray-900">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-xl text-base"
            >
              Add to Cart • ₹{(() => {
                const size = sizes?.find(s => s.id === selectedSize);
                const basePrice = parseFloat(selectedItem?.basePrice || 0) * parseFloat(size?.priceMultiplier || 1);
                const addOnsTotal = addOns?.filter(a => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + parseFloat(a.price), 0) || 0;
                return ((basePrice + addOnsTotal) * quantity).toFixed(0);
              })()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          
          <div className="absolute bottom-0 left-0 right-0 md:right-0 md:left-auto md:top-0 md:w-[400px] bg-white rounded-t-3xl md:rounded-none max-h-[85vh] md:max-h-full md:h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Your Cart</h3>
                <p className="text-sm text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.menuItemName}</p>
                        <p className="text-sm text-orange-600">{item.sizeName}</p>
                        {item.addOnNames.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">+ {item.addOnNames.join(", ")}</p>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(index)} className="p-1 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-50">
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-50">
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{calculateTotal().toFixed(0)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-xl"
                >
                  Checkout →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
