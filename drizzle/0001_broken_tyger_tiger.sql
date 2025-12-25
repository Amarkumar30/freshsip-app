CREATE TABLE `addOns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addOns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`basePrice` decimal(10,2) NOT NULL,
	`image` text,
	`category` varchar(100),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`menuItemId` int NOT NULL,
	`sizeId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`itemPrice` decimal(10,2) NOT NULL,
	`addOnsData` json,
	`addOnsTotal` decimal(10,2) NOT NULL DEFAULT '0',
	`specialInstructions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`oldStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`changedBy` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20),
	`totalAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`razorpayOrderId` varchar(255),
	`razorpayPaymentId` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`priceMultiplier` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sizes_id` PRIMARY KEY(`id`),
	CONSTRAINT `sizes_name_unique` UNIQUE(`name`)
);
