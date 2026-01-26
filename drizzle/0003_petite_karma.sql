CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "addOns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menuItemPrices" (
	"id" serial PRIMARY KEY NOT NULL,
	"menuItemId" integer NOT NULL,
	"sizeId" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menuItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"basePrice" numeric(10, 2) NOT NULL,
	"image" text,
	"category" varchar(100),
	"isAvailable" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"menuItemId" integer NOT NULL,
	"menuItemName" varchar(255),
	"sizeId" integer NOT NULL,
	"sizeName" varchar(50),
	"quantity" integer DEFAULT 1 NOT NULL,
	"itemPrice" numeric(10, 2) NOT NULL,
	"addOnsData" json,
	"addOnsTotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"specialInstructions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderStatusHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"oldStatus" varchar(50),
	"newStatus" varchar(50) NOT NULL,
	"changedBy" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(50) NOT NULL,
	"userId" integer,
	"customerName" varchar(255) NOT NULL,
	"customerPhone" varchar(20),
	"totalAmount" numeric(10, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(50),
	"razorpayOrderId" varchar(255),
	"razorpayPaymentId" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"priceMultiplier" numeric(5, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sizes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "idx_menuItemPrices_menuItemId" ON "menuItemPrices" USING btree ("menuItemId");--> statement-breakpoint
CREATE INDEX "idx_menuItemPrices_unique" ON "menuItemPrices" USING btree ("menuItemId","sizeId");--> statement-breakpoint
CREATE INDEX "idx_menuItems_category" ON "menuItems" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_menuItems_isAvailable" ON "menuItems" USING btree ("isAvailable");--> statement-breakpoint
CREATE INDEX "idx_orderItems_orderId" ON "orderItems" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "idx_orderItems_menuItemId" ON "orderItems" USING btree ("menuItemId");--> statement-breakpoint
CREATE INDEX "idx_orderStatusHistory_orderId" ON "orderStatusHistory" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "idx_orderStatusHistory_timestamp" ON "orderStatusHistory" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_orders_orderNumber" ON "orders" USING btree ("orderNumber");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_paymentStatus" ON "orders" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "idx_orders_createdAt" ON "orders" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_orders_customerPhone" ON "orders" USING btree ("customerPhone");--> statement-breakpoint
CREATE INDEX "idx_orders_updatedAt" ON "orders" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "idx_users_openId" ON "users" USING btree ("openId");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");