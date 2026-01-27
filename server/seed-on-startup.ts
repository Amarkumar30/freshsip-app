import 'dotenv/config';
import { getDb } from './db';
import { menuItems, sizes, addOns, menuItemPrices } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const MENU_DATA = [
  // Fruit Juices
  { name: "Orange Juice", category: "Fruit Juice", prices: [40, 60, 80, 100] },
  { name: "Watermelon Juice", category: "Fruit Juice", prices: [40, 60, 80, 100] },
  { name: "Pineapple Juice", category: "Fruit Juice", prices: [50, 70, 90, 110] },
  { name: "Apple Juice", category: "Fruit Juice", prices: [50, 70, 90, 110] },
  { name: "Mango Juice", category: "Fruit Juice", prices: [60, 80, 100, 120] },
  
  // Shakes
  { name: "Vanilla Shake", category: "Shake", prices: [60, 80, 100, 120] },
  { name: "Chocolate Shake", category: "Shake", prices: [60, 80, 100, 120] },
  { name: "Strawberry Shake", category: "Shake", prices: [70, 90, 110, 130] },
  { name: "Mango Shake", category: "Shake", prices: [70, 90, 110, 130] },
  { name: "Banana Shake", category: "Shake", prices: [60, 80, 100, 120] },
  { name: "Oreo Shake", category: "Shake", prices: [80, 100, 120, 140] },
  { name: "Kit Kat Shake", category: "Shake", prices: [80, 100, 120, 140] },
  { name: "Butterscotch Shake", category: "Shake", prices: [70, 90, 110, 130] },
  
  // Special
  { name: "Kulfi Falooda", category: "Special", prices: [80, 100, 120, 140] },
  { name: "Royal Falooda", category: "Special", prices: [90, 110, 130, 150] },
  { name: "Kesar Badam Milk", category: "Special", prices: [70, 90, 110, 130] },
  { name: "Thandai", category: "Special", prices: [60, 80, 100, 120] },
  { name: "Rose Milk", category: "Special", prices: [50, 70, 90, 110] },
  { name: "Cold Coffee", category: "Special", prices: [70, 90, 110, 130] },
  { name: "Masala Chaas", category: "Special", prices: [40, 60, 80, 100] },
  { name: "Fresh Lime Soda", category: "Special", prices: [40, 60, 80, 100] },
  { name: "Virgin Mojito", category: "Special", prices: [80, 100, 120, 140] },
  
  // Extras
  { name: "Straw", category: "Extras", prices: [2], image: "https://images.unsplash.com/photo-1615723093586-1ad38d59056b?w=400&h=400&fit=crop", description: "Colorful eco-friendly straw for your drink" },
];

export async function seedDatabaseOnStartup() {
  try {
    console.log('🌱 Starting database seed check...');
    const db = await getDb();
    
    if (!db) {
      console.error('❌ Database connection failed');
      return { success: false, error: 'Database connection failed' };
    }

    // Check if menu items already exist
    const existingItems = await db.select().from(menuItems);
    
    if (existingItems.length >= 20) {
      console.log(`✅ Menu already populated (${existingItems.length} items). Skipping seed.`);
      return { success: true, skipped: true, count: existingItems.length };
    }

    console.log(`📊 Current menu items: ${existingItems.length}. Populating full menu...`);

    // Get all sizes
    const allSizes = await db
      .select()
      .from(sizes)
      .orderBy(sizes.id);

    if (allSizes.length === 0) {
      console.error('❌ No sizes found! Please seed sizes first.');
      return { success: false, error: 'No sizes available' };
    }

    console.log(`📏 Found ${allSizes.length} sizes:`, allSizes.map(s => s.name).join(', '));

    let addedCount = 0;
    let skippedCount = 0;

    // Add each menu item
    for (const item of MENU_DATA) {
      try {
        // Check if item exists
        const existingItem = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.name, item.name))
          .limit(1);

        if (existingItem.length > 0) {
          console.log(`⏭️  Skipping existing item: ${item.name}`);
          skippedCount++;
          continue;
        }

        // Insert menu item
        const [newItem] = await db
          .insert(menuItems)
          .values({
            name: item.name,
            description: (item as any).description || `Fresh and delicious ${item.name.toLowerCase()}`,
            basePrice: item.prices[0].toString(), // Use Small size as base price
            category: item.category,
            image: (item as any).image || `/images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
            isAvailable: true,
          })
          .returning();

        console.log(`✅ Added: ${newItem.name} (ID: ${newItem.id})`);

        // Add prices for each size
        for (let i = 0; i < allSizes.length && i < item.prices.length; i++) {
          await db.insert(menuItemPrices).values({
            menuItemId: newItem.id,
            sizeId: allSizes[i].id,
            price: item.prices[i].toString(),
          });
        }

        addedCount++;
      } catch (itemError) {
        console.error(`❌ Error adding ${item.name}:`, itemError);
      }
    }

    const totalItems = await db.select().from(menuItems);
    console.log(`✨ Seed complete! Added: ${addedCount}, Skipped: ${skippedCount}, Total: ${totalItems.length}`);

    return { 
      success: true, 
      added: addedCount, 
      skipped: skippedCount, 
      total: totalItems.length 
    };

  } catch (error) {
    console.error('❌ Database seed error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
