# Samudera Cargo Cargo Server Detailed API Documentation

## Overview
This is the full backend API reference for `B2B_Cargo_Server`.
All routes are mounted under `/api/v1` in `src/app.js`.

- Backend root: `B2B_Cargo_Server`
- Routes file: `src/routes/api.js`
- Google auth file: `src/routes/AuthRoutes.js`
- Middleware: `protect`, `adminOnly`

## Base URL
```env
BASE_URL=http://localhost:8000/api/v1
```

---

# 1. Public / Authentication Routes

## `GET /find-by-email`
- Auth: No
- Description: Check if a user exists by email
- Query params: `email`
- Example:
  ```bash
  curl "http://localhost:8000/api/v1/find-by-email?email=user@example.com"
  ```

## `POST /register`
- Auth: No
- Description: Register a new user without OTP
- Request body example:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

## `POST /login`
- Auth: No
- Description: Login to receive JWT
- Request body example:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```

## `POST /customer/register`
- Auth: No
- Description: Register a customer and send OTP
- Body: customer registration details

## `POST /customer/verify-otp`
- Auth: No
- Description: Verify customer OTP
- Body:
  ```json
  {
    "email": "customer@example.com",
    "otp": "123456"
  }
  ```

## `POST /customer/resend-otp`
- Auth: No
- Description: Resend customer OTP
- Body:
  ```json
  {
    "email": "customer@example.com"
  }
  ```

## `POST /admin/setup`
- Auth: No
- Description: Create admin account
- Body: admin creation details

## `POST /forgot-password`
- Auth: No
- Description: Request password reset OTP
- Body: `{ "email": "user@example.com" }`

## `POST /reset-password`
- Auth: No
- Description: Reset password with OTP
- Body:
  ```json
  {
    "email": "user@example.com",
    "otp": "654321",
    "newPassword": "NewPassword123"
  }
  ```

## `POST /verify-reset-otp`
- Auth: No
- Description: Verify password reset OTP

## `POST /resend-reset-otp`
- Auth: No
- Description: Resend password reset OTP

---






# 2. Common Authenticated Routes

> All of these require `Authorization: Bearer <token>`.

## `GET /getUserprofile`
- Description: Get current user profile

## `PUT /users/profile`
- Description: Update current user profile
- Body: user profile fields

## `POST /change-password`
- Description: Change authenticated password
- Body:
  ```json
  {
    "oldPassword": "Old123",
    "newPassword": "New123"
  }
  ```

## `POST /logout`
- Description: Logout current user

---





# 3. Admin User Management Routes

> All require `protect` + `adminOnly`.

## `POST /admin/staff/create`
- Description: Create a staff user
- Body: staff details

## `GET /admin/users` 
- Description: List all users

## `GET /admin/users/role/:role`
- Description: Filter users by role

## `GET /admin/getUsers/:userId`
- Description: Get single user

## `PUT /admin/updateUsers/:userId`
- Description: Update user
- Body: fields to update

## `DELETE /admin/users/:userId`
- Description: Delete user

---






# 4. Booking Routes

## `GET /track/:trackingNumber`
- Auth: No
- Description: Public tracking by booking number

## `POST /createBooking`
- Auth: Yes
- Description: Customer creates a booking
- Body: booking details

## `GET /getAllBooking`
- Auth: Yes
- Admin only
- Description: List all bookings
- Query params: `page`, `limit`, `status`, `search`, `startDate`, `endDate`, `sort`, `sortBy`, `sortOrder`

## `GET /getBookingById/:id`
- Auth: Yes
- Description: Get booking by ID

## `PUT /booking/:id/price-quote`
- Auth: Yes
- Admin only
- Description: Update booking quote

## `PUT /booking/:id/accept`
- Auth: Yes
- Description: Customer accepts booking quote

## `PUT /booking/:id/reject`
- Auth: Yes
- Admin only
- Description: Reject booking quote

## `POST /bookings/:id/cancel`
- Auth: Yes
- Description: Cancel a booking

## `GET /my-bookings`
- Auth: Yes
- Description: Get current customer bookings

## `GET /my-bookings/summary`
- Auth: Yes
- Description: Get booking summary for current customer

## `GET /my-bookings/:id`
- Auth: Yes
- Description: Get single booking

## `GET /my-bookings/:id/timeline`
- Auth: Yes
- Description: Booking timeline

## `GET /my-bookings/:id/invoice`
- Auth: Yes
- Description: Get invoice for booking

## `GET /my-bookings/:id/quote`
- Auth: Yes
- Description: Get quote for booking

## `GET /my-bookings/invoiceSummary`
- Auth: Yes
- Description: Get invoice summary for current customer

## `GET /getMyInvoices/:customerId`
- Auth: Yes
- Description: Get invoices by customer

---




# 5. Invoice Routes

## `GET /getAllInvoices`
- Auth: Yes
- Admin only
- Description: List all invoices

## `GET /getInvoiceStats`
- Auth: Yes
- Admin only
- Description: Invoice metrics summary

## `GET /getRecentInvoices`
- Auth: Yes
- Admin only
- Description: Recent invoices

## `GET /getinvoice/:bookingId`
- Auth: Yes
- Admin only
- Description: Get invoice by booking ID

## `GET /getinvoice/:shipmentId`
- Auth: Yes
- Admin only
- Description: Get invoice by shipment ID

## `GET /getInvoiceById/:id`
- Auth: Yes
- Description: Get invoice by its ID

## `PUT /updateInvoice/:id`
- Auth: Yes
- Admin only
- Description: Update invoice data

## `DELETE /invoices/:id`
- Auth: Yes
- Admin only
- Description: Delete invoice

## `POST /mark-paid/:id`
- Auth: Yes
- Admin only
- Description: Mark invoice as paid

## `POST /invoice/:id/send-email`
- Auth: Yes
- Admin only
- Description: Send invoice email

## `POST /invoices/:id/generate-pdf`
- Auth: Yes
- Description: Generate invoice PDF

## `POST /invoice/bulk-update`
- Auth: Yes
- Admin only
- Description: Bulk update invoices

---

# 6. Manual Invoice Routes

## `GET /getAllmanualInvoices`
- Auth: Yes
- Admin only
- Description: List manual invoices

## `GET /my-manual-invoices`
- Auth: Yes
- Description: List current user manual invoices

## `GET /manualInvoices/:id`
- Auth: Yes
- Admin only
- Description: Get manual invoice by ID

## `DELETE /deletemanualInvoice/:id`
- Auth: Yes
- Admin only
- Description: Delete manual invoice

---

# 7. Shipment Routes

## `POST /create-shipments`
- Auth: Yes
- Description: Create a new shipment

## `GET /getNewShipment`
- Auth: Yes
- Admin only
- Description: Get new shipment list

## `GET /getAllShipment`
- Auth: Yes
- Description: List all shipments

## `GET /shipments/track/:trackingNumber`
- Auth: Yes
- Description: Track shipment by tracking number

## `GET /my-new-shipments`
- Auth: Yes
- Description: Get user-specific new shipments

## `GET /my-shipments/summary`
- Auth: Yes
- Description: Get summary of user shipments

## `GET /my-shipments/:id`
- Auth: Yes
- Description: Get user shipment detail

## `GET /my-shipments/:id/tracking`
- Auth: Yes
- Description: Get tracking detail for user shipment

## `PUT /updateShipmentStatus/:id`
- Auth: Yes
- Admin only
- Description: Update new shipment status

## `GET /shipments/:id/invoice`
- Auth: Yes
- Description: Get shipment invoice

## `POST /shipments/:id/regenerate-invoice`
- Auth: Yes
- Description: Regenerate shipment invoice

## `GET /my-shipments`
- Auth: Yes
- Description: Get user shipment list

## `GET /my-shipments/:id`
- Auth: Yes
- Description: Get a shipment by ID

## `GET /my-shipments/:id/timeline`
- Auth: Yes
- Description: Get shipment timeline

## `PUT /update-shipment-tracking/:id`
- Auth: Yes
- Description: Update shipment tracking number

## `PUT /new-update-shipment-tracking/:id`
- Auth: Yes
- Description: Update new shipment tracking number

## `GET /stats/dashboard`
- Auth: Yes
- Description: Get shipment dashboard stats

## `GET /my-shipment-by-id/:id`
- Auth: Yes
- Description: Get shipment by ID

## `GET /my-shipment-timeline/:id/timeline`
- Auth: Yes
- Description: Get shipment timeline

## `POST /my-shipment/create`
- Auth: Yes
- Admin only
- Description: Create shipment from dashboard

## `PUT /update-shipment/:id`
- Auth: Yes
- Admin only
- Description: Update shipment

## `DELETE /delete-shipment/:id`
- Auth: Yes
- Admin only
- Description: Delete shipment

## `PATCH /update-shipment-status/:id`
- Auth: Yes
- Admin only
- Description: Update shipment status

## `POST /add-tracking-update/:id`
- Auth: Yes
- Admin only
- Description: Add tracking update to shipment

## `POST /assign-shipment/:id`
- Auth: Yes
- Admin only
- Description: Assign shipment

## `POST /update-transport-details/:id`
- Auth: Yes
- Admin only
- Description: Add transport details

## `POST /add-document/:id`
- Auth: Yes
- Admin only
- Description: Add shipment document

## `POST /my-shipment/:id/notes/internal`
- Auth: Yes
- Admin only
- Description: Add internal shipment note

## `POST /shipments/:id/cancel`
- Auth: Yes
- Admin only
- Description: Cancel shipment

---

# 8. Shipment Cost Routes

## `POST /my-shipment/:id/costs`
- Auth: Yes
- Admin only
- Description: Add cost to shipment

## `GET /my-shipment/:id/costs`
- Auth: Yes
- Admin only
- Description: Get shipment costs

## `PUT /my-shipment/:id/costs/:costId`
- Auth: Yes
- Admin only
- Description: Update shipment cost

## `DELETE /my-shipment/:id/costs/:costId`
- Auth: Yes
- Admin only
- Description: Delete shipment cost

---

# 9. Warehouse Routes

## `GET /warehouse/pending`
- Auth: Yes
- Admin only
- Description: Get pending warehouse shipments

## `PATCH /:id/warehouse/receive`
- Auth: Yes
- Admin only
- Description: Receive shipment at warehouse

## `PATCH /:id/warehouse/process`
- Auth: Yes
- Admin only
- Description: Process warehouse shipment

## `GET /getAllwarehouses`
- Auth: Yes
- Admin only
- Description: List warehouses

## `POST /warehouses`
- Auth: Yes
- Admin only
- Description: Create warehouse

## `PUT /warehouses/:id`
- Auth: Yes
- Description: Update warehouse

## `GET /dashboard`
- Auth: Yes
- Admin only
- Description: Warehouse dashboard data

## `GET /expected-shipments`
- Auth: Yes
- Admin only
- Description: Get expected shipments

## `POST /receive/:shipmentId`
- Auth: Yes
- Admin only
- Description: Receive shipment at warehouse

## `POST /inspect/:receiptId`
- Auth: Yes
- Admin only
- Description: Inspect a shipment receipt

## `GET /receipts`
- Auth: Yes
- Admin only
- Description: Get warehouse receipts

## `DELETE /receipts/:id`
- Auth: Yes
- Admin only
- Description: Delete a receipt

## `GET /receipts/:id`
- Auth: Yes
- Admin only
- Description: Get receipt by ID

## `GET /inventory`
- Auth: Yes
- Admin only
- Description: Get warehouse inventory

## `PUT /inventory/:id/location`
- Auth: Yes
- Admin only
- Description: Update inventory location

---

# 10. Consolidation Routes

## `PATCH /consolidations/:consolidationId/shipments/:shipmentId`
- Auth: Yes
- Admin only
- Description: Update shipment within consolidation

## `GET /:id/on-hold-shipments`
- Auth: Yes
- Admin only
- Description: Get on-hold shipments for consolidation

## `POST /:id/resume-all`
- Auth: Yes
- Admin only
- Description: Resume all on-hold shipments

## `GET /:id/cancelled-shipments`
- Auth: Yes
- Admin only
- Description: Get cancelled shipments for consolidation

## `GET /queue`
- Auth: Yes
- Description: Get consolidation queue

## `POST /queue/add`
- Auth: Yes
- Description: Add shipment to consolidation queue

## `POST /queue/add-multiple`
- Auth: Yes
- Description: Add multiple shipments to queue

## `GET /queue/summary`
- Auth: Yes
- Description: Get queue summary

## `DELETE /consolidation/queue/:id`
- Auth: Yes
- Description: Remove queue shipment

## `POST /queue/bulk-remove`
- Auth: Yes
- Description: Bulk remove queue items

## `POST /consolidation/create`
- Auth: Yes
- Admin only
- Description: Create consolidation

## `GET /all/consolidations`
- Auth: Yes
- Description: Get all consolidations

## `GET /stats/consolidations`
- Auth: Yes
- Description: Consolidation statistics

## `GET /container-types/consolidations`
- Auth: Yes
- Description: Get consolidation container types

## `GET /consolidations/:id`
- Auth: Yes
- Description: Get consolidation by ID

## `PUT /consolidations/:id`
- Auth: Yes
- Admin only
- Description: Update consolidation

## `PUT /consolidations/:id/mark-ready`
- Auth: Yes
- Admin only
- Description: Mark consolidation ready

## `PUT /consolidations/:id/status`
- Auth: Yes
- Admin only
- Description: Update consolidation status

## `POST /consolidations/:id/add-shipments`
- Auth: Yes
- Admin only
- Description: Add shipments to consolidation

## `DELETE /consolidation/:id/shipment/:shipmentId`
- Auth: Yes
- Admin only
- Description: Remove shipment from consolidation

## `DELETE /consolidation/:id`
- Auth: Yes
- Admin only
- Description: Delete consolidation

## `POST /consolidations/:id/documents`
- Auth: Yes
- Admin only
- Description: Upload consolidation documents

---

# 11. Tracking Routes

## `GET /getAllTracking`
- Auth: Yes
- Admin only
- Description: Get all tracking entries

## `GET /tracking/stats`
- Auth: Yes
- Admin only
- Description: Get tracking statistics

## `GET /tracking/search`
- Auth: Yes
- Admin only
- Description: Search tracking entries

## `GET /tracking/export`
- Auth: Yes
- Admin only
- Description: Export tracking data

## `GET /tracking/:id`
- Auth: Yes
- Admin only
- Description: Get tracking by ID

## `PUT /tracking/:id`
- Auth: Yes
- Admin only
- Description: Update tracking record

## `PUT /tracking/bulk/update`
- Auth: Yes
- Admin only
- Description: Bulk update trackings

## `DELETE /tracking/:id`
- Auth: Yes
- Admin only
- Description: Delete tracking entry

## `POST /tracking/bulk/delete`
- Auth: Yes
- Admin only
- Description: Bulk delete tracking entries

---

# 12. Damage Report Routes

## `GET /damage-reports/all`
- Auth: Yes
- Description: Get all damage reports

## `GET /damage-reports/stats`
- Auth: Yes
- Description: Get damage report statistics

## `GET /damage-reports/export`
- Auth: Yes
- Description: Export damage reports

## `GET /damage-reports/:id`
- Auth: Yes
- Description: Get a damage report by ID

## `PUT /damage-reports/:id/status`
- Auth: Yes
- Description: Update damage report status

## `POST /damage-reports/:id/insurance`
- Auth: Yes
- Description: Add insurance claim

## `POST /damage-reports/bulk/update`
- Auth: Yes
- Admin only
- Description: Bulk update damage reports

## `DELETE /damage-reports/:id`
- Auth: Yes
- Admin only
- Description: Delete damage report

---

# 13. Repo Notes

- Protected routes use JWT auth via `protect` middleware.
- Admin-only routes use `adminOnly` middleware.
- Public routes include login, register, OTP, and public tracking.
- The server is mounted in `src/app.js` under `/api/v1`.
