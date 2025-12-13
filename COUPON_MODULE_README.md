# Coupon Management Module - Implementation Guide

## Overview
This document describes the implementation of the Coupon Management module with three tabs: Coupon, Referral, and Plans.

## File Structure

### Frontend Components
```
src/
├── app/
│   └── dashboard/
│       └── coupon/
│           └── page.tsx                    # Main Coupon page with tabs
├── components/
│   └── coupon/
│       ├── CouponTab.tsx                   # Coupon tab (placeholder)
│       ├── ReferralTab.tsx                 # Referral management tab (fully implemented)
│       └── PlansTab.tsx                    # Plans tab (placeholder)
└── components/
    └── Sidebar.tsx                         # Updated with Coupon navigation
```

### Backend API Routes
```
src/
└── app/
    └── api/
        └── referral/
            ├── route.ts                    # GET (list) and POST (create) endpoints
            └── [id]/
                └── route.ts                # GET (by ID), PUT (update), DELETE endpoints
```

## Features Implemented

### 1. Referral Tab (Fully Functional)
The Referral tab provides complete CRUD operations for managing referral codes:

#### Features:
- **List Referral Codes**: Paginated table view with all referral codes
- **Create Referral Code**: Dialog form to create new referral codes
- **Edit Referral Code**: Update existing referral codes
- **Delete Referral Code**: Remove referral codes with confirmation
- **Feature Toggles**: Enable/disable features like SmartVitals, Medication, Vaccines, etc.
- **Trial Days**: Set free trial period
- **Usage Tracking**: COUNT and MAX fields for tracking usage

#### Fields:
- `referral_code` (string, required): Unique referral code
- `free_trial_days` (number): Number of free trial days
- `COUNT` (number): Current usage count
- `MAX` (number): Maximum allowed usage
- Feature flags (boolean):
  - SmartVitals
  - Medication
  - Vaccines
  - HealthSnapShot
  - Records
  - Prenatal
  - HealthHub
  - Members
  - ABHA

### 2. API Endpoints

#### GET /api/referral
Fetch all referral codes with pagination
- Query params: `page`, `limit`, `region` (optional, defaults to "india")
- Returns: Paginated list of referral codes

#### POST /api/referral
Create a new referral code
- Body: All referral code fields
- Validation: Checks for duplicate codes, validates numeric fields
- Returns: Created referral code

#### GET /api/referral/[id]
Fetch a specific referral code by ID
- Params: `id`
- Query params: `region` (optional)
- Returns: Single referral code

#### PUT /api/referral/[id]
Update an existing referral code
- Params: `id`
- Body: Fields to update
- Validation: Checks for duplicates, validates fields
- Returns: Updated referral code

#### DELETE /api/referral/[id]
Delete a referral code
- Params: `id`
- Query params: `region` (optional)
- Returns: Success message

## Migration from Express to Next.js

### Changes Made:
1. **Database Layer**: Replaced raw SQL queries with Prisma ORM
   - Old: `getPool(req)` and `client.query()`
   - New: `prismaIndia` and `prismaUSA` clients

2. **Logging**: Replaced custom logger with console methods
   - Old: `logger.error()`, `logger.info()`
   - New: `console.error()`, `console.log()`

3. **Request/Response**: Migrated from Express to Next.js API routes
   - Old: `req: Request, res: Response`
   - New: `req: NextRequest` with `NextResponse.json()`

4. **Transactions**: Removed manual transaction handling
   - Prisma handles transactions internally
   - Removed `BEGIN`, `COMMIT`, `ROLLBACK` statements

5. **Region Support**: Added region parameter to support multi-region databases
   - Automatically selects correct Prisma client based on region

## Database Schema

The `referral_codes` table should have the following structure:

```sql
CREATE TABLE referral_codes (
  id SERIAL PRIMARY KEY,
  referral_code VARCHAR(255) UNIQUE NOT NULL,
  free_trial_days INTEGER DEFAULT 0,
  "SmartVitals" BOOLEAN DEFAULT FALSE,
  "Medication" BOOLEAN DEFAULT FALSE,
  "Vaccines" BOOLEAN DEFAULT FALSE,
  "HealthSnapShot" BOOLEAN DEFAULT FALSE,
  "Records" BOOLEAN DEFAULT FALSE,
  "Prenatal" BOOLEAN DEFAULT FALSE,
  "HealthHub" BOOLEAN DEFAULT FALSE,
  "Members" BOOLEAN DEFAULT FALSE,
  "ABHA" BOOLEAN DEFAULT FALSE,
  "COUNT" INTEGER DEFAULT 0,
  "MAX" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Usage

### Accessing the Coupon Page
1. Navigate to the dashboard
2. Click on "Coupon" in the sidebar
3. Select the desired tab (Coupon, Referral, or Plans)

### Managing Referral Codes
1. Click "Add Referral Code" button
2. Fill in the form:
   - Enter a unique referral code
   - Set free trial days (optional)
   - Set COUNT and MAX values
   - Toggle feature flags as needed
3. Click "Create" to save

### Editing Referral Codes
1. Click the edit icon on any referral code row
2. Modify the desired fields
3. Click "Update" to save changes

### Deleting Referral Codes
1. Click the delete icon on any referral code row
2. Confirm the deletion in the dialog
3. The referral code will be permanently removed

## Next Steps

### To Complete the Module:
1. **Implement CouponTab**: Add coupon management functionality
2. **Implement PlansTab**: Add subscription plans management
3. **Add Prisma Schema**: Update Prisma schema files to include `referral_codes` table
4. **Run Migrations**: Generate and run Prisma migrations
5. **Add Validation**: Implement additional validation rules as needed
6. **Add Search/Filter**: Add search and filter functionality to the table
7. **Add Export**: Add ability to export referral codes to CSV/Excel

## Testing

### Manual Testing Steps:
1. Start the development server: `npm run dev`
2. Navigate to `/dashboard/coupon`
3. Test creating a referral code
4. Test editing a referral code
5. Test deleting a referral code
6. Test pagination
7. Verify all feature toggles work correctly

## Notes

- The old `refrerral.controller.ts` file has been removed from the root directory
- All functionality has been migrated to Next.js API routes
- The implementation uses Prisma ORM for type-safe database queries
- Toast notifications are provided via the `sonner` library
- The UI follows the existing design patterns in the project
