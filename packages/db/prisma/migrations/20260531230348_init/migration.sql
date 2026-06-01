-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('RIDE', 'FOOD', 'QUICK_COMMERCE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('UBER', 'OLA', 'RAPIDO', 'ZOMATO', 'SWIGGY', 'ZEPTO', 'BLINKIT');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'AUTO', 'MINI', 'SEDAN', 'SUV');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PUBLIC', 'NEW_USER', 'INACTIVE_USER', 'SEGMENT', 'ACCOUNT_SPECIFIC');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "city" TEXT,
    "selfReportedPlatforms" JSONB NOT NULL DEFAULT '[]',
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "lastBookingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "bookingsCount" INTEGER NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3),

    CONSTRAINT "PlatformHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'PUBLIC',
    "validFor" "ServiceType",
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "accountSpecific" BOOLEAN NOT NULL DEFAULT false,
    "discountType" "DiscountType" NOT NULL DEFAULT 'FLAT',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION,
    "minFare" DOUBLE PRECISION,
    "validForCity" TEXT,
    "successRate" DOUBLE PRECISION,
    "lastVerified" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCouponUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT,

    CONSTRAINT "UserCouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "vehicleType" "VehicleType",
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT,
    "fare" DOUBLE PRECISION NOT NULL,
    "couponApplied" TEXT,
    "savings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rawPrompt" TEXT NOT NULL,
    "parsedIntent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "PlatformHistory_userId_idx" ON "PlatformHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformHistory_userId_platform_key" ON "PlatformHistory"("userId", "platform");

-- CreateIndex
CREATE INDEX "Coupon_platform_type_idx" ON "Coupon"("platform", "type");

-- CreateIndex
CREATE INDEX "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_platform_key" ON "Coupon"("code", "platform");

-- CreateIndex
CREATE INDEX "UserCouponUsage_userId_idx" ON "UserCouponUsage"("userId");

-- CreateIndex
CREATE INDEX "UserCouponUsage_couponCode_platform_idx" ON "UserCouponUsage"("couponCode", "platform");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_platform_serviceType_idx" ON "Booking"("platform", "serviceType");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_userId_idx" ON "SearchLog"("userId");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PlatformHistory" ADD CONSTRAINT "PlatformHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCouponUsage" ADD CONSTRAINT "UserCouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCouponUsage" ADD CONSTRAINT "UserCouponUsage_couponCode_platform_fkey" FOREIGN KEY ("couponCode", "platform") REFERENCES "Coupon"("code", "platform") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchLog" ADD CONSTRAINT "SearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
