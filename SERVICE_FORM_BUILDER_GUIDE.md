# Service Form Builder - Implementation Guide

## Overview
This guide documents the custom service form builder system implemented for Alley Cat Dumpsters. The system allows admins to create dynamic forms for services that customers can fill out, with automatic price calculations and quote management.

---

## 🎯 Features Implemented

### 1. **Admin Form Builder** (`/admin/services/[id]/form-builder`)
Create custom forms with:
- **10 Field Types**: text, email, phone, number, date, textarea, select, radio, checkbox, address
- **Dynamic Pricing**: Add price modifiers to field options
- **Field Validation**: Required fields, min/max values, patterns
- **Drag & Drop Reordering**: Organize fields in any order
- **Real-time Preview**: See how the form looks as you build it

### 2. **Customer-Facing Form** (`/request-service/[serviceId]`)
- Renders custom forms dynamically based on admin configuration
- Real-time price calculation as customers fill out the form
- Contact information collection
- Form validation
- Success confirmation page

### 3. **Service Requests Dashboard** (`/admin/service-requests`)
- View all customer submissions
- Filter by status: pending, quoted, approved, rejected
- Send custom quotes
- Track conversation with admin notes
- Stats dashboard showing request metrics

---

## 📂 File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── services/
│   │   │   └── [id]/
│   │   │       └── form-builder/
│   │   │           └── page.tsx          # Form builder UI
│   │   └── service-requests/
│   │       └── page.tsx                  # Requests dashboard
│   ├── request-service/
│   │   └── [serviceId]/
│   │       └── page.tsx                  # Customer form page
│   └── api/
│       ├── admin/services/
│       │   └── [id]/
│       │       └── form-schema/
│       │           └── route.ts          # Save/load form schemas
│       └── service-responses/
│           ├── route.ts                  # List/create responses
│           └── [id]/
│               └── route.ts              # Update response status
├── components/
│   ├── admin/
│   │   └── service-form-builder.tsx     # Form builder component
│   └── service-form-renderer.tsx        # Customer form renderer
└── types/
    └── service-form.ts                   # TypeScript types
```

---

## 🗄️ Database Schema

### `services` table (columns added)
- `form_schema` (JSONB): Stores the form configuration
- `pricing_rules` (JSONB): Stores pricing rules

### `service_responses` table (new)
- `id`: Unique identifier
- `service_id`: Links to services table
- `customer_name`: Customer's name
- `customer_email`: Customer's email
- `customer_phone`: Customer's phone
- `responses`: JSON object with all form answers
- `calculated_price`: Auto-calculated price (in cents)
- `status`: pending | quoted | approved | rejected
- `admin_notes`: Internal notes
- `quoted_price`: Admin's quoted price (in cents)
- `quoted_at`: When quote was sent
- `quoted_by`: Admin user ID
- `created_at`: Submission timestamp
- `updated_at`: Last update timestamp

---

## 🚀 How to Use

### For Admins

#### Creating a Service Form:

1. Navigate to **Admin > Services** (`/admin/services`)
2. Click the **document icon** (📄) on any service
3. **Add fields** by clicking field type buttons
4. **Configure each field**:
   - Set label and placeholder text
   - Mark as required if needed
   - For select/radio/checkbox: add options
   - Enable "Affects pricing" to add price modifiers
5. **Save the form**

#### Managing Requests:

1. Go to **Admin > Service Requests** (`/admin/service-requests`)
2. View all submissions with status badges
3. Click **"View Details"** on any request
4. Review customer information and responses
5. Actions available:
   - **Send Quote**: Enter price and send to customer
   - **Approve**: Mark request as approved
   - **Reject**: Decline the request
   - **Add Admin Notes**: Internal documentation

### For Customers

1. Navigate to `/request-service/[serviceId]` (replace with actual service ID)
2. Fill out the dynamic form
3. See price updates in real-time
4. Provide contact information
5. Submit request
6. Receive confirmation

---

## 💰 Pricing System

### How Pricing Works:

**Base Price**: Every service has a base price set in the services table.

**Price Modifiers** can be added to:
- **Number fields**: Multiply the entered value by a rate
  - Example: "Square footage" × $0.50 per sq ft
- **Select/Radio options**: Fixed price for each option
  - Example: "Rush service" = +$100
- **Checkbox options**: Add prices for selected options
  - Example: "Include cleanup" = +$50

**Calculation**:
```
Total = Base Price + Sum of all field modifiers
```

All prices are stored in **cents** in the database to avoid floating-point issues.

---

## 🔌 API Endpoints

### Form Schema Management
- `GET /api/admin/services/[id]/form-schema` - Get form configuration
- `PUT /api/admin/services/[id]/form-schema` - Update form configuration

### Service Responses
- `GET /api/service-responses` - List all responses
- `POST /api/service-responses` - Submit new response
- `GET /api/service-responses/[id]` - Get single response
- `PATCH /api/service-responses/[id]` - Update status/quote

---

## 📋 Example Form Schema

```json
{
  "fields": [
    {
      "id": "field_1234567890",
      "type": "number",
      "label": "Square Footage",
      "placeholder": "Enter square footage",
      "required": true,
      "pricingImpact": {
        "enabled": true,
        "multiplier": 0.50
      }
    },
    {
      "id": "field_0987654321",
      "type": "select",
      "label": "Service Speed",
      "required": true,
      "options": ["Standard", "Rush (24hr)", "Emergency"],
      "pricingImpact": {
        "enabled": true,
        "optionPrices": {
          "Standard": 0,
          "Rush (24hr)": 100,
          "Emergency": 250
        }
      }
    }
  ]
}
```

---

## 🎨 UI Components

### ServiceFormBuilder
**Location**: `src/components/admin/service-form-builder.tsx`

**Props**:
- `initialSchema?: FormSchema` - Existing form to edit
- `onSave: (schema: FormSchema) => void` - Save callback
- `onCancel: () => void` - Cancel callback

### ServiceFormRenderer
**Location**: `src/components/service-form-renderer.tsx`

**Props**:
- `schema: FormSchema` - Form configuration
- `serviceName: string` - Display name
- `basePrice: number` - Base price in cents
- `onSubmit: (responses, calculatedPrice) => Promise<void>` - Submit handler
- `isSubmitting?: boolean` - Loading state

---

## 🔄 Workflow

### Complete Customer Journey:

1. **Customer**: Visits service page → Fills form → Submits
2. **System**: Calculates price → Saves to database → Shows confirmation
3. **Admin**: Receives notification → Reviews request
4. **Admin**: Sends quote with custom price
5. **Admin**: Approves or rejects after customer response

### Status Flow:
```
pending → quoted → approved
                 ↘ rejected
```

---

## ⚙️ Configuration

### Field Types Available:

| Type | Description | Pricing Options |
|------|-------------|-----------------|
| `text` | Single-line text | Fixed modifier |
| `email` | Email address | Fixed modifier |
| `phone` | Phone number | Fixed modifier |
| `number` | Numeric input | Multiplier × value |
| `date` | Date picker | Fixed modifier |
| `textarea` | Multi-line text | Fixed modifier |
| `select` | Dropdown menu | Price per option |
| `radio` | Single choice | Price per option |
| `checkbox` | Multiple choices | Price per option |
| `address` | Address input | Fixed modifier |

---

## 🔐 Security Notes

- All API routes have `TODO: Add admin authentication middleware` comments
- Input validation on both client and server side
- Prices stored in cents to prevent rounding errors
- SQL injection protection via Drizzle ORM

---

## 🚧 Future Enhancements (TODO)

- [ ] Email notifications when quotes are sent
- [ ] Email notifications to admins on new submissions
- [ ] Conditional field logic (show field based on another field's value)
- [ ] File upload fields
- [ ] Form templates for quick setup
- [ ] Export service responses to CSV
- [ ] Customer portal to view quote status
- [ ] Integration with booking system

---

## 🐛 Troubleshooting

### Form not showing for customers
- Check that `formSchema` is saved for the service
- Verify the service has `isActive = true`
- Check browser console for errors

### Pricing not calculating
- Ensure `pricingImpact.enabled = true` on fields
- Verify option prices are set correctly
- Check that values are numbers (not strings)

### Build errors
- Run `npm install` to ensure dependencies
- Check TypeScript errors with `npx tsc --noEmit`
- Clear `.next` folder and rebuild

---

## 📞 Support

For questions or issues with the form builder:
1. Check this documentation
2. Review the example forms in `/admin/services`
3. Check the browser console for errors
4. Review server logs for API issues

---

**Last Updated**: January 2026
**Version**: 1.0.0
