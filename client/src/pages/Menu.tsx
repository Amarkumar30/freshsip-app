import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Droplet, Plus, Minus, X } from "lucide-react";
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

export default function Menu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: menuItems } = trpc.menu.getItems.useQuery();
  const { data: sizes } = trpc.menu.getSizes.useQuery();
  const { data: addOns } = trpc.menu.getAddOns.useQuery();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Droplet className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">FreshSip</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  /* Show cart sidebar */
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="ml-2 bg-orange-500 text-white rounded-full px-2 py-1 text-xs">
                  {cart.length}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-8">Our Menu</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {menuItems?.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDialog(true);
                  }}
                >
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-200">
                        <Droplet className="w-16 h-16 text-orange-500 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-bold text-lg">
                        ₹{item.basePrice}
                      </span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{item.menuItemName}</p>
                            <p className="text-sm text-gray-600">{item.sizeName}</p>
                            {item.addOnNames.length > 0 && (
                              <p className="text-xs text-gray-500">
                                +{item.addOnNames.join(", ")}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-semibold">
                            ₹
                            {(
                              (item.itemPrice + item.addOnsTotal) *
                              item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-orange-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Customization Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {selectedItem?.image && (
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">{selectedItem?.description}</p>
              </div>

              {/* Size Selection */}
              <div>
                <h4 className="font-semibold mb-3">Select Size</h4>
                <div className="space-y-2">
                  {sizes?.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        selectedSize === size.id
                          ? "bg-orange-100 border-orange-500"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{size.name}</span>
                        <span className="text-orange-600 font-semibold">
                          ₹
                          {(
                            parseFloat(selectedItem?.basePrice) *
                            parseFloat(size.priceMultiplier)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-ons Selection */}
              <div>
                <h4 className="font-semibold mb-3">Add-ons (Optional)</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {addOns?.map((addOn) => (
                    <label key={addOn.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(addOn.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddOns([...selectedAddOns, addOn.id]);
                          } else {
                            setSelectedAddOns(
                              selectedAddOns.filter((id) => id !== addOn.id)
                            );
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{addOn.name}</span>
                      </div>
                      <span className="text-orange-600 font-semibold">
                        +₹{addOn.price}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <h4 className="font-semibold mb-2">Special Instructions</h4>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Extra sweet, less ice..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-semibold mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetDialog}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
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
