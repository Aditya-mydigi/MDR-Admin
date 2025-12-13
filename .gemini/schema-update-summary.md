# Prisma Schema Update Summary

**Date:** 2025-12-11  
**Action:** Database pull for both USA and India clients

## What Was Done

1. ✅ **Cleared Next.js cache** - Removed `.next` directory to resolve module resolution issues
2. ✅ **Updated tsconfig.json** - Changed `jsx` from `"react-jsx"` to `"preserve"` for better Next.js compatibility
3. ✅ **Pulled USA database schema** - `npx prisma db pull --schema=prisma/schema.prisma`
4. ✅ **Pulled India database schema** - `npx prisma db pull --schema=prisma/schema-india.prisma`
5. ✅ **Regenerated Prisma clients** - `npm run prisma:generate`

## New Tables Added

### 1. `referral_codes` Table
**Location:** Both USA and India schemas

**Fields:**
- `id` - UUID (Primary Key)
- `referral_code` - String (Unique)
- `free_trial_days` - Int (default: 0)
- `created_at` - DateTime
- `updated_at` - DateTime
- **Feature Flags:**
  - `SmartVitals` - Boolean (default: false)
  - `Medication` - Boolean (default: false)
  - `Vaccines` - Boolean (default: false)
  - `HealthSnapShot` - Boolean (default: false)
  - `Records` - Boolean (default: false)
  - `Prenatal` - Boolean (default: false)
  - `HealthHub` - Boolean (default: false)
  - `Members` - Boolean (default: false)
  - `ABHA` - Boolean (default: false)
- `COUNT` - Int (default: 0)
- `MAX` - Int (default: 0)
- `code_id` - String (nullable)

**Relationships:**
- One-to-Many with `coupons` table via `referral_code`

### 2. `referral_modules` Table (USA only)
**Fields:**
- `id` - UUID (Primary Key)
- `referral_code` - String
- `module_name` - String
- `created_at` - DateTime

### 3. `vault_documents` Table (India only)
**Fields:**
- `id` - UUID (Primary Key)
- `user_id` - UUID (Foreign Key to users)
- `category` - String
- `filename` - String
- `original_name` - String
- `mime_type` - String
- `size` - BigInt
- `gcs_path` - String
- `preview_gcs_path` - String (nullable)
- `created_at` - DateTime
- `updated_at` - DateTime

## Updated Tables

### `coupons` Table
**New Fields Added:**
- `referral_code` - String (nullable) - Links to `referral_codes` table
- `visible` - Boolean (default: false)

**New Relationship:**
- Foreign key to `referral_codes.referral_code`

### `plans` Table
**USA Schema - New Fields:**
- `SmartVitals` - Boolean (default: true)
- `Medication` - Boolean (default: true)
- `Vaccines` - Boolean (default: true)
- `HealthSnapShot` - Boolean (default: true)
- `Records` - Boolean (default: true)
- `Prenatal` - Boolean (default: true)
- `HealthHub` - Boolean (default: true)
- `Members` - Boolean (default: true)
- `ABHA` - Boolean (default: true)

**India Schema - New Fields:**
- Same feature flags as USA but with default: false
- `referral_code` - String (nullable)

### `referrals` Table
**New Field:**
- `code_id` - String (nullable)

### `users` Table (India only)
**New Fields:**
- `daily_sv` - Int (default: 0)
- `monthly_ocr` - Int (default: 0)

## Generated Prisma Clients

Both Prisma clients have been regenerated with the new schema:
- ✅ **USA Client:** `prisma/generated/usa/`
- ✅ **India Client:** `prisma/generated/india/`

## Next Steps

The schemas are now fully synchronized with your databases. You can now:

1. Use the `referral_codes` table in your application
2. Remove any example/mock data that was previously used
3. Update your API routes to use the real database tables
4. The module resolution issue for `PlansTab` should now be resolved

## Files Modified

- `prisma/schema.prisma` (USA schema)
- `prisma/schema-india.prisma` (India schema)
- `tsconfig.json`
- `src/components/coupon/PlansTab.tsx`
