# Service Display Settings - Phase 1 Complete! 🎉

## What's New

You can now control where and how services appear on your website directly from the admin panel.

## New Fields Added to Services

### 1. Image URL
- **Field**: `imageUrl`
- **Purpose**: Add a hero/primary image for each service
- **Example**: `https://your-cdn.com/dumpster-20yard.jpg`
- **Usage**: Will be displayed on homepage, services page, and service detail pages

### 2. Category
- **Field**: `category`
- **Purpose**: Organize services into groups
- **Examples**: "Residential", "Commercial", "Specialty"
- **Usage**: Can be used for filtering and grouping services

### 3. Display Settings (Checkboxes)

#### Show on Homepage
- **Field**: `showOnHomepage`
- **Default**: OFF (unchecked)
- **What it does**: When checked, this service will appear in the services section on the homepage

#### Show on Services Page
- **Field**: `showOnServicesPage`
- **Default**: ON (checked)
- **What it does**: When checked, this service will appear on the /services page

#### Featured Service
- **Field**: `isFeatured`
- **Default**: OFF (unchecked)
- **What it does**: Highlights/promotes this service with special styling

#### Service is Active
- **Field**: `isActive`
- **Default**: ON (checked)
- **What it does**: When unchecked, service is hidden from all public pages (but still in database)

## How to Use

### Step 1: Edit a Service
1. Go to **Admin Panel** → **Services**
2. Click **Edit** on any service
3. Go to the **Basic Info** tab

### Step 2: Add an Image
1. Upload your image to a hosting service (or use existing URL)
2. Paste the URL into the **Image URL** field
3. Example: `https://example.com/images/20-yard-dumpster.jpg`

### Step 3: Set Category (Optional)
1. Enter a category name like "Residential", "Commercial", etc.
2. This helps organize services (future filtering feature)

### Step 4: Configure Display Settings
Check the boxes for where you want the service to appear:

```
☑ Service is active          ← Must be ON for service to show anywhere
☑ Show on homepage           ← Appears in homepage services section
☑ Show on services page      ← Appears on /services page
☐ Featured service           ← Gets highlighted/special styling
```

### Step 5: Save
Click **Save Changes** to update the service

## Display Order

**Services display in the order shown on the Services admin page.**

The `sortOrder` field controls this:
- Lower numbers appear first
- You can manually update sort order in the database
- Future update: Drag-and-drop reordering in the admin panel

## Example Configurations

### Example 1: Standard Service
```
Name: 20-Yard Dumpster Rental
Image: https://cdn.example.com/20yard.jpg
Category: Residential
✓ Service is active
✓ Show on homepage
✓ Show on services page
☐ Featured service
```
**Result**: Appears on both homepage and services page, normal styling

### Example 2: Featured Premium Service
```
Name: Premium Junk Removal
Image: https://cdn.example.com/premium-junk.jpg
Category: Specialty
✓ Service is active
✓ Show on homepage
✓ Show on services page
✓ Featured service
```
**Result**: Appears everywhere with special highlighting

### Example 3: Services Page Only
```
Name: Commercial Container Service
Image: https://cdn.example.com/commercial.jpg
Category: Commercial
✓ Service is active
☐ Show on homepage
✓ Show on services page
☐ Featured service
```
**Result**: Only appears on /services page, not on homepage

### Example 4: Hidden/Inactive
```
Name: Seasonal Spring Cleanup
✓ Service is active = OFF
```
**Result**: Completely hidden from public website

## Database Changes

### New Columns in `services` Table:
- `image_url` (TEXT) - URL to service image
- `show_on_homepage` (BOOLEAN) - Display on homepage (default: false)
- `show_on_services_page` (BOOLEAN) - Display on services page (default: true)
- `is_featured` (BOOLEAN) - Featured/highlighted service (default: false)

### Migration File:
`migrations/0009_add_service_display_fields.sql`

## What's Next (Future Phases)

### Phase 2: Public Service Catalog (Coming Soon)
- Public page at `/services` that lists all active services
- Filter by category
- Click to view service details and request form
- Responsive grid layout with images

### Phase 3: Rich Content Editor (Future)
- WYSIWYG editor for descriptions
- Multiple images per service
- Custom feature lists
- Testimonials section
- FAQ section

## Technical Notes

### Files Modified:
1. `shared/schema.ts` - Added new fields to services table
2. `migrations/0009_add_service_display_fields.sql` - Database migration
3. `src/app/admin/services/[id]/edit/page.tsx` - Admin UI for new fields
4. `src/app/api/admin/services/[id]/route.ts` - API to handle new fields

### API Updates:
The service update endpoint now accepts these additional fields:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "category": "Residential",
  "showOnHomepage": true,
  "showOnServicesPage": true,
  "isFeatured": false
}
```

## Tips & Best Practices

1. **Images**:
   - Use high-quality images (at least 800x600px)
   - Consistent aspect ratio across all services
   - Optimize for web (compress to reduce load time)
   - Use descriptive filenames

2. **Categories**:
   - Keep category names consistent
   - Use title case: "Residential" not "residential"
   - Limit to 3-5 main categories

3. **Homepage Display**:
   - Don't show too many services on homepage (3-6 is ideal)
   - Feature your most popular or profitable services
   - Use the `isFeatured` flag for seasonal promotions

4. **Sort Order**:
   - Put most popular services first (lowest sort number)
   - Group similar services together
   - Featured services can have lower sort numbers to appear first

## Troubleshooting

**Service not showing on website?**
- Check that "Service is active" is ON
- Check that the appropriate "Show on..." checkbox is ON
- Verify you saved the changes

**Image not displaying?**
- Make sure the URL is publicly accessible
- Check that it's a direct link to an image file (ends in .jpg, .png, etc.)
- Try opening the URL in a new browser tab to verify

**Need to reorder services?**
- Currently requires manual database update of `sort_order` field
- Drag-and-drop reordering coming in future update

## Questions?

Check the guides:
- `SERVICE_FORM_BUILDER_GUIDE.md` - Form builder documentation
- `CONDITIONAL_PRICING_GUIDE.md` - Pricing rules explained
- `QUICK_PRICING_SETUP.md` - Quick reference for pricing

Your services now have professional display controls! 🚀
