CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "payment_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "purpose" VARCHAR(255) NOT NULL DEFAULT 'registration',
  "email" VARCHAR(255) NOT NULL,
  "razorpayOrderId" VARCHAR(255) NOT NULL UNIQUE,
  "amountPaise" INTEGER NOT NULL,
  "currency" VARCHAR(16) NOT NULL DEFAULT 'INR',
  "status" VARCHAR(64) NOT NULL DEFAULT 'created',
  "couponCode" VARCHAR(255),
  "discountINR" DOUBLE PRECISION DEFAULT 0,
  "priceBreakdown" JSONB,
  "registrationPayload" JSONB,
  "razorpayPayload" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payment_orders_email_idx" ON "payment_orders" ("email");
CREATE INDEX IF NOT EXISTS "payment_orders_razorpay_order_id_idx" ON "payment_orders" ("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "payment_orders_status_idx" ON "payment_orders" ("status");

CREATE TABLE IF NOT EXISTS "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "paymentOrderId" UUID REFERENCES "payment_orders"("id") ON DELETE SET NULL,
  "email" VARCHAR(255) NOT NULL,
  "razorpayOrderId" VARCHAR(255) NOT NULL,
  "razorpayPaymentId" VARCHAR(255) NOT NULL UNIQUE,
  "razorpaySignature" TEXT,
  "amountPaise" INTEGER NOT NULL,
  "currency" VARCHAR(16) NOT NULL DEFAULT 'INR',
  "status" VARCHAR(64) NOT NULL DEFAULT 'captured',
  "couponCode" VARCHAR(255),
  "discountINR" DOUBLE PRECISION DEFAULT 0,
  "priceBreakdown" JSONB,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payments_email_idx" ON "payments" ("email");
CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments" ("userId");
CREATE INDEX IF NOT EXISTS "payments_razorpay_order_id_idx" ON "payments" ("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "payments_razorpay_payment_id_idx" ON "payments" ("razorpayPaymentId");

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(255) NOT NULL UNIQUE,
  "discountType" VARCHAR(32) NOT NULL,
  "discountValue" DOUBLE PRECISION NOT NULL,
  "maxDiscountINR" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "startsAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "maxRedemptions" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");
CREATE INDEX IF NOT EXISTS "coupons_is_active_idx" ON "coupons" ("isActive");

CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couponId" UUID REFERENCES "coupons"("id") ON DELETE SET NULL,
  "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "paymentId" UUID REFERENCES "payments"("id") ON DELETE SET NULL,
  "code" VARCHAR(255) NOT NULL,
  "discountINR" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_id_idx" ON "coupon_redemptions" ("couponId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_user_id_idx" ON "coupon_redemptions" ("userId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_payment_id_idx" ON "coupon_redemptions" ("paymentId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_code_idx" ON "coupon_redemptions" ("code");

