ALTER TABLE `orders` MODIFY COLUMN `userId` int;--> statement-breakpoint
CREATE INDEX `idx_menuItems_category` ON `menuItems` (`category`);--> statement-breakpoint
CREATE INDEX `idx_menuItems_isAvailable` ON `menuItems` (`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_orderItems_orderId` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_orderItems_menuItemId` ON `orderItems` (`menuItemId`);--> statement-breakpoint
CREATE INDEX `idx_orderStatusHistory_orderId` ON `orderStatusHistory` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_orderStatusHistory_timestamp` ON `orderStatusHistory` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_orders_orderNumber` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_paymentStatus` ON `orders` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `idx_orders_createdAt` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_orders_customerPhone` ON `orders` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `idx_orders_updatedAt` ON `orders` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `idx_users_openId` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);