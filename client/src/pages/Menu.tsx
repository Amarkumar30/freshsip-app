import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Droplet, Plus, Minus, X, Sparkles, Leaf, Coffee, Cherry } from "lucide-react";
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
  specialInstructions?: string;
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
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const { data: menuItems } = trpc.menu.getItems.useQuery();
  const { data: sizes } = trpc.menu.getSizes.useQuery();
  const { data: addOns } = trpc.menu.getAddOns.useQuery();

  // Get unique categories
  const categories = ["All", ...new Set(menuItems?.map(item => item.category).filter(Boolean) || [])];
  
  // Filter items by category
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

    const itemPrice =
      parseFloat(selectedItem.basePrice) * parseFloat(size?.priceMultiplier || "1");
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
      specialInstructions,
    };

    setCart([...cart, cartItem]);
    toast.success("Added to cart!");
    resetDialog();
  };

  const resetDialog = () => {
    setSelectedItem(null);
    setSelectedSize(null);
    setSelectedAddOns([]);
    setQuantity(1);
    setSpecialInstructions("");
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
    return cart.reduce(
      (sum, item) => sum + (item.itemPrice + item.addOnsTotal) * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Store cart in localStorage for checkout page
    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-orange-200 transition-shadow">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">FreshSip</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                onClick={() => {
                  /* Show cart sidebar */
                }}
              >
                <ShoppingCart className="w-4 h-4 text-orange-600" />
                {cart.length > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">
            Fresh & Delicious
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Handcrafted juices and shakes made with the freshest ingredients, delivered with love 🍊
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category as string] || Droplet;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category as string)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 scale-105'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredItems?.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 cursor-pointer group border-0 bg-white/80 backdrop-blur-sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDialog(true);
                  }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-200">
                        <Droplet className="w-16 h-16 text-orange-500 opacity-50" />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${categoryColors[item.category || ''] || 'from-gray-400 to-gray-500'}`}>
                      {item.category}
                    </div>
                    {/* Quick Add Button */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="bg-white/90 backdrop-blur text-orange-600 hover:bg-white shadow-lg">
                        <Plus className="w-4 h-4 mr-1" /> Quick Add
                      </Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1 text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                          ₹{item.basePrice}
                        </span>
                        <span className="text-gray-400 text-sm">onwards</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-sm">★★★★★</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-orange-100/50">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Your Order</h3>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-orange-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Your cart is empty</p>
                  <p className="text-gray-300 text-sm mt-1">Add some delicious items!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">{item.menuItemName}</p>
                            <p className="text-sm text-orange-600 font-medium">{item.sizeName}</p>
                            {item.addOnNames.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                +{item.addOnNames.join(", ")}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="p-1.5 hover:bg-orange-100 rounded-md transition-colors"
                            >
                              <Minus className="w-3 h-3 text-orange-600" />
                            </button>
                            <span className="px-3 font-semibold text-gray-800">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="p-1.5 hover:bg-orange-100 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3 text-orange-600" />
                            </button>
                          </div>
                          <span className="font-bold text-gray-800">
                            ₹{((item.itemPrice + item.addOnsTotal) * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-orange-100 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{calculateTotal().toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t border-orange-100">
                      <span className="text-gray-800">Total</span>
                      <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">₹{calculateTotal().toFixed(0)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:scale-[1.02]"
                  >
                    Proceed to Checkout →
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Customization Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-md border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {selectedItem?.image && (
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl overflow-hidden shadow-lg">
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

            <div className="space-y-5">
              <div>
                <p className="text-gray-600">{selectedItem?.description}</p>
              </div>

              {/* Size Selection */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Select Size</h4>
                <div className="space-y-2">
                  {sizes?.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                        selectedSize === size.id
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                          : "bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold">{size.name}</span>
                        <span className={`font-bold ${selectedSize === size.id ? "text-white" : "text-orange-600"}`}>
                          ₹{(parseFloat(selectedItem?.basePrice) * parseFloat(size.priceMultiplier)).toFixed(0)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons Selection */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Add-ons <span className="text-gray-400 font-normal text-sm">(Optional)</span></h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {addOns?.map((addOn) => (
                    <label 
                      key={addOn.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedAddOns.includes(addOn.id) 
                          ? "bg-orange-50 border-2 border-orange-400" 
                          : "bg-gray-50 border-2 border-transparent hover:border-orange-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(addOn.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddOns([...selectedAddOns, addOn.id]);
                          } else {
                            setSelectedAddOns(selectedAddOns.filter((id) => id !== addOn.id));
                          }
                        }}
                        className="w-5 h-5 accent-orange-500"
                      />
                      <span className="flex-1 font-medium text-gray-700">{addOn.name}</span>
                      <span className="text-orange-600 font-semibold">+₹{addOn.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">Quantity</h4>
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-2 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <Minus className="w-5 h-5 text-orange-600" />
                  </button>
                  <span className="text-2xl font-bold w-10 text-center text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-orange-600" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetDialog}
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
