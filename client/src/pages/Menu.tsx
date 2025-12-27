import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Droplet, Plus, Minus, X, Sparkles, Leaf, Coffee, Cherry, ChevronUp, Check } from "lucide-react";
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

const categoryIcons: Record<string, any> = {
  'Fruit Juices': Cherry,
  'Shakes': Coffee,
  'Special': Sparkles,
  'Vegetable': Leaf,
};

const categoryColors: Record<string, string> = {
  'Fruit Juices': 'from-orange-400 to-yellow-400',
  'Shakes': 'from-pink-400 to-purple-400',
  'Special': 'from-indigo-400 to-purple-500',
  'Vegetable': 'from-green-400 to-emerald-400',
};

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
    toast.success(`${selectedItem.name} added!`, { duration: 2000, position: 'top-center' });
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-orange-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                <Droplet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">FreshSip</h1>
            </div>
          </Link>
          
          {/* Desktop Cart */}
          <button
            onClick={() => setShowCart(true)}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-medium shadow-md"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="bg-white text-orange-600 rounded-full px-2 py-0.5 text-sm font-bold">{totalItems}</span>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3">
        {/* Hero */}
        <div className="text-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            Our Menu 🍊
          </h2>
        </div>

        {/* Category Filter */}
        <div className="overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <div className="inline-flex gap-2 min-w-full justify-start md:justify-center">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category as string] || Droplet;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as string)}
                  className={`px-3 py-2 rounded-full font-medium transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems?.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden active:scale-[0.97] transition-all cursor-pointer border-0 bg-white shadow-sm hover:shadow-lg"
              onClick={() => {
                setSelectedItem(item);
                setSelectedSize(sizes?.[0]?.id || null);
                setShowDialog(true);
              }}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden relative">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Droplet className="w-10 h-10 text-orange-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-orange-600">₹{item.basePrice}</span>
                  <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Mobile Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-3 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-semibold shadow-xl flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">₹{calculateTotal().toFixed(0)}</span>
              <ChevronUp className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-0 gap-0">
          {selectedItem?.image && (
            <div className="aspect-[16/10] w-full overflow-hidden">
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
          
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedItem?.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{selectedItem?.description}</p>
            </div>

            {/* Size Selection */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Choose Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {sizes?.map((size) => {
                  const price = (parseFloat(selectedItem?.basePrice || 0) * parseFloat(size.priceMultiplier)).toFixed(0);
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedSize === size.id
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="font-semibold text-sm">{size.name}</div>
                      <div className={`text-xs mt-1 ${selectedSize === size.id ? "text-white/90" : "text-gray-500"}`}>₹{price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            {addOns && addOns.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Add Extras</h4>
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
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedAddOns.includes(addOn.id) 
                          ? "bg-orange-500 text-white shadow-md" 
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{addOn.name === 'Ice Cream' ? '🍦' : '🍯'}</span>
                        <span className="font-medium text-sm">{addOn.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${selectedAddOns.includes(addOn.id) ? 'text-white' : 'text-orange-600'}`}>
                        +₹{addOn.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <span className="font-semibold text-gray-800">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                >
                  <Minus className="w-5 h-5 text-orange-600" />
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm active:scale-95"
                >
                  <Plus className="w-5 h-5 text-orange-600" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-6 rounded-xl text-lg shadow-lg active:scale-[0.98]"
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          
          <div className="absolute bottom-0 left-0 right-0 md:right-0 md:left-auto md:top-0 md:w-[400px] bg-white rounded-t-3xl md:rounded-none max-h-[85vh] md:max-h-full md:h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Your Order</h3>
                  <p className="text-xs text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-orange-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.menuItemName}</p>
                        <p className="text-sm text-orange-600">{item.sizeName}</p>
                        {item.addOnNames.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">+{item.addOnNames.join(", ")}</p>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(index)} className="p-1 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-orange-50">
                          <Minus className="w-4 h-4 text-orange-600" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-orange-50">
                          <Plus className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-800">₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-orange-600">₹{calculateTotal().toFixed(0)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-6 rounded-xl shadow-lg active:scale-[0.98]"
                >
                  Proceed to Checkout →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
