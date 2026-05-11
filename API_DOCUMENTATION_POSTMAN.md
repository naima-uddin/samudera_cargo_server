# Samudera Cargo Cargo Server API (Grouped)

Grouped Postman collection for Samudera Cargo Cargo Server, with folders for Authentication, Users, Bookings, Invoices, Shipments, Warehouse, Consolidation, Tracking, and Damage Reports.

## Environment Variables

- `baseUrlRoot`: e.g. `http://localhost:8000`
- `baseUrl`: e.g. `http://localhost:8000/api/v1`
- `authToken`: JWT token for authenticated requests
- Other variables: `userId`, `bookingId`, `shipmentId`, `invoiceId`, `manualInvoiceId`, `costId`, `warehouseId`, `queueId`, `consolidationId`, `trackingId`, `damageReportId`, `receiptId`, `inventoryId`

## Health

#### Health Check

- Method: **GET**
- URL: `{{baseUrlRoot}}/health`

## Authentication & User Routes

### Public

##### Find by Email

- Method: **GET**
- URL: `{{baseUrl}}/find-by-email?email=user@example.com`

**Query parameters:**

- email: user@example.com

##### Register

- Method: **POST**
- URL: `{{baseUrl}}/register`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

##### Login

- Method: **POST**
- URL: `{{baseUrl}}/login`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

##### Customer Register (OTP)

- Method: **POST**
- URL: `{{baseUrl}}/customer/register`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "customer@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "01700000000"
}
```

##### Customer Verify OTP

- Method: **POST**
- URL: `{{baseUrl}}/customer/verify-otp`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "customer@example.com",
  "otp": "123456"
}
```

##### Customer Resend OTP

- Method: **POST**
- URL: `{{baseUrl}}/customer/resend-otp`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "customer@example.com"
}
```

##### Admin Setup

- Method: **POST**
- URL: `{{baseUrl}}/admin/setup`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "admin@example.com",
  "password": "AdminPass123",
  "firstName": "Admin",
  "lastName": "User"
}
```

##### Forgot Password

- Method: **POST**
- URL: `{{baseUrl}}/forgot-password`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com"
}
```

##### Reset Password

- Method: **POST**
- URL: `{{baseUrl}}/reset-password`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com",
  "otp": "654321",
  "newPassword": "NewPassword123"
}
```

##### Verify Reset OTP

- Method: **POST**
- URL: `{{baseUrl}}/verify-reset-otp`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com",
  "otp": "654321"
}
```

##### Resend Reset OTP

- Method: **POST**
- URL: `{{baseUrl}}/resend-reset-otp`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "email": "user@example.com"
}
```

### Authenticated

##### Get User Profile

- Method: **GET**
- URL: `{{baseUrl}}/getUserprofile`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Profile

- Method: **PUT**
- URL: `{{baseUrl}}/users/profile`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "01700000000"
}
```

##### Change Password

- Method: **POST**
- URL: `{{baseUrl}}/change-password`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "oldPassword": "Old123",
  "newPassword": "New123"
}
```

##### Logout

- Method: **POST**
- URL: `{{baseUrl}}/logout`

**Headers:**

- Authorization: Bearer {{authToken}}

### Admin

##### Create Staff

- Method: **POST**
- URL: `{{baseUrl}}/admin/staff/create`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "email": "staff@example.com",
  "password": "StaffPass123",
  "firstName": "Staff",
  "lastName": "Member",
  "role": "staff"
}
```

##### List Users

- Method: **GET**
- URL: `{{baseUrl}}/admin/users`

**Headers:**

- Authorization: Bearer {{authToken}}

##### List Users by Role

- Method: **GET**
- URL: `{{baseUrl}}/admin/users/role/{{role}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get User By ID

- Method: **GET**
- URL: `{{baseUrl}}/admin/getUsers/{{userId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update User

- Method: **PUT**
- URL: `{{baseUrl}}/admin/updateUsers/{{userId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "firstName": "Updated",
  "lastName": "Name"
}
```

##### Delete User

- Method: **DELETE**
- URL: `{{baseUrl}}/admin/users/{{userId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

## Booking Routes

### Public

##### Track by Booking Number

- Method: **GET**
- URL: `{{baseUrl}}/track/{{trackingNumber}}`

### Authenticated

##### Create Booking

- Method: **POST**
- URL: `{{baseUrl}}/createBooking`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "origin": "Dhaka",
  "destination": "Chittagong",
  "weight": 100,
  "description": "Booking details"
}
```

##### Get My Bookings

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Bookings Summary

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings/summary`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Booking By ID

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings/{{bookingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Booking Timeline

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings/{{bookingId}}/timeline`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Booking Invoice

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings/{{bookingId}}/invoice`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Booking Quote

- Method: **GET**
- URL: `{{baseUrl}}/my-bookings/{{bookingId}}/quote`

**Headers:**

- Authorization: Bearer {{authToken}}

### Admin

##### Get All Bookings

- Method: **GET**
- URL: `{{baseUrl}}/getAllBooking`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Booking By ID

- Method: **GET**
- URL: `{{baseUrl}}/getBookingById/{{bookingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Booking Quote

- Method: **PUT**
- URL: `{{baseUrl}}/booking/{{bookingId}}/price-quote`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "price": 1200
}
```

##### Reject Booking Quote

- Method: **PUT**
- URL: `{{baseUrl}}/booking/{{bookingId}}/reject`

**Headers:**

- Authorization: Bearer {{authToken}}

## Invoice Routes

### Authenticated

##### Get Invoice By ID

- Method: **GET**
- URL: `{{baseUrl}}/getInvoiceById/{{invoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

### Admin

##### Get All Invoices

- Method: **GET**
- URL: `{{baseUrl}}/getAllInvoices`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Invoice Stats

- Method: **GET**
- URL: `{{baseUrl}}/getInvoiceStats`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Recent Invoices

- Method: **GET**
- URL: `{{baseUrl}}/getRecentInvoices`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Invoice by Booking ID

- Method: **GET**
- URL: `{{baseUrl}}/getinvoice/{{bookingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Invoice by Shipment ID

- Method: **GET**
- URL: `{{baseUrl}}/getinvoice/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Invoice

- Method: **PUT**
- URL: `{{baseUrl}}/updateInvoice/{{invoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "paid"
}
```

##### Delete Invoice

- Method: **DELETE**
- URL: `{{baseUrl}}/invoices/{{invoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Mark Invoice Paid

- Method: **POST**
- URL: `{{baseUrl}}/mark-paid/{{invoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Send Invoice Email

- Method: **POST**
- URL: `{{baseUrl}}/invoice/{{invoiceId}}/send-email`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Generate Invoice PDF

- Method: **POST**
- URL: `{{baseUrl}}/invoices/{{invoiceId}}/generate-pdf`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Bulk Update Invoices

- Method: **POST**
- URL: `{{baseUrl}}/invoice/bulk-update`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "invoiceIds": [
    "{{invoiceId}}"
  ],
  "status": "paid"
}
```

## Manual Invoice Routes

### Admin

##### Get All Manual Invoices

- Method: **GET**
- URL: `{{baseUrl}}/getAllmanualInvoices`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Manual Invoices

- Method: **GET**
- URL: `{{baseUrl}}/my-manual-invoices`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Manual Invoice By ID

- Method: **GET**
- URL: `{{baseUrl}}/manualInvoices/{{manualInvoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Delete Manual Invoice

- Method: **DELETE**
- URL: `{{baseUrl}}/deletemanualInvoice/{{manualInvoiceId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

## Shipment Routes

### Public

##### Track Shipment

- Method: **GET**
- URL: `{{baseUrl}}/shipments/track/{{trackingNumber}}`

### Customer

##### Create Shipments

- Method: **POST**
- URL: `{{baseUrl}}/create-shipments`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "origin": "Dhaka",
  "destination": "Chittagong",
  "weight": 200,
  "description": "Shipment details"
}
```

##### Get My New Shipments

- Method: **GET**
- URL: `{{baseUrl}}/my-new-shipments`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Shipments

- Method: **GET**
- URL: `{{baseUrl}}/my-shipments`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Shipment By ID

- Method: **GET**
- URL: `{{baseUrl}}/my-shipments/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get My Shipment Timeline

- Method: **GET**
- URL: `{{baseUrl}}/my-shipments/{{shipmentId}}/timeline`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Shipment Invoice

- Method: **GET**
- URL: `{{baseUrl}}/shipments/{{shipmentId}}/invoice`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Regenerate Shipment Invoice

- Method: **POST**
- URL: `{{baseUrl}}/shipments/{{shipmentId}}/regenerate-invoice`

**Headers:**

- Authorization: Bearer {{authToken}}

### Common

##### Get Shipment Stats

- Method: **GET**
- URL: `{{baseUrl}}/stats/dashboard`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Shipment By ID

- Method: **GET**
- URL: `{{baseUrl}}/my-shipment-by-id/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Shipment Timeline by ID

- Method: **GET**
- URL: `{{baseUrl}}/my-shipment-timeline/{{shipmentId}}/timeline`

**Headers:**

- Authorization: Bearer {{authToken}}

### Admin

##### Create Shipment

- Method: **POST**
- URL: `{{baseUrl}}/my-shipment/create`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "origin": "Dhaka",
  "destination": "Chittagong",
  "weight": 150,
  "description": "Admin created shipment"
}
```

##### Update Shipment

- Method: **PUT**
- URL: `{{baseUrl}}/update-shipment/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "delivered"
}
```

##### Delete Shipment

- Method: **DELETE**
- URL: `{{baseUrl}}/delete-shipment/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Shipment Status

- Method: **PATCH**
- URL: `{{baseUrl}}/update-shipment-status/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "received"
}
```

##### Add Tracking Update

- Method: **POST**
- URL: `{{baseUrl}}/add-tracking-update/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "update": "Loaded at depot",
  "location": "Dhaka"
}
```

##### Assign Shipment

- Method: **POST**
- URL: `{{baseUrl}}/assign-shipment/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "assignedTo": "staffId123"
}
```

##### Update Transport Details

- Method: **POST**
- URL: `{{baseUrl}}/update-transport-details/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "transportCompany": "ABC Logistics",
  "vehicleNumber": "Dhaka-1234"
}
```

##### Add Document

- Method: **POST**
- URL: `{{baseUrl}}/add-document/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "documentName": "Invoice",
  "url": "https://example.com/doc.pdf"
}
```

##### Add Internal Shipment Note

- Method: **POST**
- URL: `{{baseUrl}}/my-shipment/{{shipmentId}}/notes/internal`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "note": "Internal note for shipment"
}
```

##### Cancel Shipment

- Method: **POST**
- URL: `{{baseUrl}}/shipments/{{shipmentId}}/cancel`

**Headers:**

- Authorization: Bearer {{authToken}}

## Costs & Warehouse

### Costs

##### Add Shipment Cost

- Method: **POST**
- URL: `{{baseUrl}}/my-shipment/{{shipmentId}}/costs`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "costName": "Handling",
  "amount": 100
}
```

##### Get Shipment Costs

- Method: **GET**
- URL: `{{baseUrl}}/my-shipment/{{shipmentId}}/costs`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Shipment Cost

- Method: **PUT**
- URL: `{{baseUrl}}/my-shipment/{{shipmentId}}/costs/{{costId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "amount": 150
}
```

##### Delete Shipment Cost

- Method: **DELETE**
- URL: `{{baseUrl}}/my-shipment/{{shipmentId}}/costs/{{costId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

### Warehouse

##### Get Warehouse Pending

- Method: **GET**
- URL: `{{baseUrl}}/warehouse/pending`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Receive Warehouse Shipment

- Method: **PATCH**
- URL: `{{baseUrl}}/{{warehouseId}}/warehouse/receive`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "received"
}
```

##### Process Warehouse Shipment

- Method: **PATCH**
- URL: `{{baseUrl}}/{{warehouseId}}/warehouse/process`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "processed"
}
```

##### Get All Receipts

- Method: **GET**
- URL: `{{baseUrl}}/receipts`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Receipt By ID

- Method: **GET**
- URL: `{{baseUrl}}/receipts/{{receiptId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Delete Receipt

- Method: **DELETE**
- URL: `{{baseUrl}}/receipts/{{receiptId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Warehouse Inventory

- Method: **GET**
- URL: `{{baseUrl}}/inventory`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Inventory Location

- Method: **PUT**
- URL: `{{baseUrl}}/inventory/{{inventoryId}}/location`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "location": "New Warehouse Location"
}
```

## Consolidation Routes

### Queue

##### Get Queue

- Method: **GET**
- URL: `{{baseUrl}}/queue`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Add to Queue

- Method: **POST**
- URL: `{{baseUrl}}/queue/add`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "shipmentIds": [
    "{{shipmentId}}"
  ]
}
```

##### Add Multiple to Queue

- Method: **POST**
- URL: `{{baseUrl}}/queue/add-multiple`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "shipmentIds": [
    "{{shipmentId}}",
    "{{shipmentId2}}"
  ]
}
```

##### Get Queue Summary

- Method: **GET**
- URL: `{{baseUrl}}/queue/summary`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Remove from Queue

- Method: **DELETE**
- URL: `{{baseUrl}}/consolidation/queue/{{queueId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Bulk Remove from Queue

- Method: **POST**
- URL: `{{baseUrl}}/queue/bulk-remove`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "queueIds": [
    "{{queueId}}"
  ]
}
```

### Admin

##### Create Consolidation

- Method: **POST**
- URL: `{{baseUrl}}/consolidation/create`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "name": "Consolidation 1",
  "shipmentIds": [
    "{{shipmentId}}"
  ]
}
```

##### Get All Consolidations

- Method: **GET**
- URL: `{{baseUrl}}/all/consolidations`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Consolidation Stats

- Method: **GET**
- URL: `{{baseUrl}}/stats/consolidations`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Container Types

- Method: **GET**
- URL: `{{baseUrl}}/container-types/consolidations`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Consolidation By ID

- Method: **GET**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Consolidation

- Method: **PUT**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "ready"
}
```

##### Mark Consolidation Ready

- Method: **PUT**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}/mark-ready`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "ready": true
}
```

##### Update Consolidation Status

- Method: **PUT**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}/status`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "in-progress"
}
```

##### Add Shipments to Consolidation

- Method: **POST**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}/add-shipments`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "shipmentIds": [
    "{{shipmentId}}"
  ]
}
```

##### Remove Shipment from Consolidation

- Method: **DELETE**
- URL: `{{baseUrl}}/consolidation/{{consolidationId}}/shipment/{{shipmentId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Delete Consolidation

- Method: **DELETE**
- URL: `{{baseUrl}}/consolidation/{{consolidationId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Upload Consolidation Document

- Method: **POST**
- URL: `{{baseUrl}}/consolidations/{{consolidationId}}/documents`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "documentUrl": "https://example.com/doc.pdf"
}
```

## Tracking Routes

### Admin

##### Get All Tracking

- Method: **GET**
- URL: `{{baseUrl}}/getAllTracking`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Tracking Stats

- Method: **GET**
- URL: `{{baseUrl}}/tracking/stats`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Search Trackings

- Method: **GET**
- URL: `{{baseUrl}}/tracking/search?query=TRACK123`

**Query parameters:**

- query: TRACK123

**Headers:**

- Authorization: Bearer {{authToken}}

##### Export Tracking

- Method: **GET**
- URL: `{{baseUrl}}/tracking/export`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Tracking By ID

- Method: **GET**
- URL: `{{baseUrl}}/tracking/{{trackingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Tracking

- Method: **PUT**
- URL: `{{baseUrl}}/tracking/{{trackingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "delivered"
}
```

##### Bulk Update Tracking

- Method: **PUT**
- URL: `{{baseUrl}}/tracking/bulk/update`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "trackingIds": [
    "{{trackingId}}"
  ],
  "status": "in-transit"
}
```

##### Delete Tracking

- Method: **DELETE**
- URL: `{{baseUrl}}/tracking/{{trackingId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Bulk Delete Tracking

- Method: **POST**
- URL: `{{baseUrl}}/tracking/bulk/delete`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "trackingIds": [
    "{{trackingId}}"
  ]
}
```

## Damage Report Routes

### Admin

##### Get All Damage Reports

- Method: **GET**
- URL: `{{baseUrl}}/damage-reports/all`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Damage Report Stats

- Method: **GET**
- URL: `{{baseUrl}}/damage-reports/stats`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Export Damage Reports

- Method: **GET**
- URL: `{{baseUrl}}/damage-reports/export`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Get Damage Report By ID

- Method: **GET**
- URL: `{{baseUrl}}/damage-reports/{{damageReportId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

##### Update Damage Report Status

- Method: **PUT**
- URL: `{{baseUrl}}/damage-reports/{{damageReportId}}/status`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "status": "closed"
}
```

##### Add Insurance Claim

- Method: **POST**
- URL: `{{baseUrl}}/damage-reports/{{damageReportId}}/insurance`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "policyNumber": "INS-1234",
  "claimAmount": 1200
}
```

##### Bulk Update Damage Reports

- Method: **POST**
- URL: `{{baseUrl}}/damage-reports/bulk/update`

**Headers:**

- Authorization: Bearer {{authToken}}
- Content-Type: application/json

**Request body:**

```json
{
  "reportIds": [
    "{{damageReportId}}"
  ],
  "status": "reviewed"
}
```

##### Delete Damage Report

- Method: **DELETE**
- URL: `{{baseUrl}}/damage-reports/{{damageReportId}}`

**Headers:**

- Authorization: Bearer {{authToken}}

## Quote & Contact

#### Request Quote

- Method: **POST**
- URL: `{{baseUrl}}/request-quote`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "01700000000",
  "origin": "Dhaka",
  "destination": "Chittagong",
  "freightType": "Air",
  "weight": 50,
  "instructions": "Handle with care"
}
```

#### Contact Form

- Method: **POST**
- URL: `{{baseUrl}}/contact`

**Headers:**

- Content-Type: application/json

**Request body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "01700000000",
  "inquiryType": "General",
  "message": "I would like more information."
}
```
