# Conditional Pricing Guide

This guide explains how to configure complex pricing for services like dumpster rentals where the final price depends on multiple factors (size, duration, delivery address, etc.).

## Understanding the Two Pricing Systems

### 1. Simple Price Modifiers (Field-Level)
- **Best for**: Individual options that add a fixed amount to the base price
- **Example**: "10 Yard Dumpster (+$50)", "20 Yard Dumpster (+$150)"
- **How to use**:
  - Add a select/radio/checkbox field
  - Set price modifiers for each option
  - These automatically add to the base price

### 2. Pricing Rules (Advanced)
- **Best for**: Complex pricing logic based on combinations of fields
- **Example**: "If 20-yard dumpster AND 7-day rental AND within city limits = $350"
- **How to use**: Click the "Pricing Rules" tab in the Form Builder

## Step-by-Step: Dumpster Rental Pricing Example

### Scenario
You want pricing to depend on:
- **Dumpster Size** (10, 20, 30 yard)
- **Rental Duration** (3, 7, 14 days)
- **Delivery Location** (affects delivery fee based on distance/zone)

### Step 1: Create the Form Fields

1. **Dumpster Size Field**
   - Type: Radio Buttons or Dropdown
   - Label: "Dumpster Size"
   - Options:
     - 10 Yard Container (value: `10-yard`)
     - 20 Yard Container (value: `20-yard`)
     - 30 Yard Container (value: `30-yard`)
   - **Don't set price modifiers yet** - we'll use Pricing Rules instead

2. **Rental Duration Field**
   - Type: Radio Buttons or Dropdown
   - Label: "Rental Duration"
   - Options:
     - 3 Days (value: `3-days`)
     - 7 Days (value: `7-days`)
     - 14 Days (value: `14-days`)

3. **Delivery Address Field**
   - Type: Address
   - Label: "Delivery Address"
   - Required: Yes
   - Note: You can use this with zone-based pricing or integrate with your existing zone detection

4. **Delivery Zone Field** (if using zones)
   - Type: Select (hidden or auto-populated based on address)
   - Options:
     - Zone A - City Limits (value: `zone-a`)
     - Zone B - Suburbs (value: `zone-b`)
     - Zone C - Rural (value: `zone-c`)

5. **Terms Agreement Field**
   - Type: Agreement
   - Label: "I agree to the rental terms and conditions"
   - Placeholder: "By checking this box, you agree to our terms of service, cancellation policy, and weight limits."
   - Required: Yes

### Step 2: Set Up Pricing Rules

Click the **"Pricing Rules"** tab at the top of the Form Builder.

#### Option A: Conditional Pricing (Recommended for Your Use Case)

1. Click **"+ Conditional Pricing"**
2. Name the rule: "10 Yard - 3 Days - Zone A"
3. Click "Expand" to configure
4. Click **"+ Add Condition"** for each factor:

   **Condition 1:**
   - Field: Dumpster Size
   - Operator: equals
   - Value: 10-yard
   - Price Change ($): 0

   **Condition 2:**
   - Field: Rental Duration
   - Operator: equals
   - Value: 3-days
   - Price Change ($): 0

   **Condition 3:**
   - Field: Delivery Zone
   - Operator: equals
   - Value: zone-a
   - Price Change ($): 250.00

5. The final **Price Change** on the last condition represents the total price for this combination

**Repeat for all combinations:**
- 10 Yard, 3 Days, Zone A = $250
- 10 Yard, 3 Days, Zone B = $280
- 10 Yard, 3 Days, Zone C = $320
- 10 Yard, 7 Days, Zone A = $300
- 10 Yard, 7 Days, Zone B = $330
- ... and so on for all combinations

#### Option B: Formula-Based Pricing (Advanced)

If your pricing follows a mathematical pattern, you can use formulas:

1. Click **"+ Formula"**
2. Name: "Dynamic Dumpster Pricing"
3. Formula example:
```
basePrice + (field_size_modifier * 50) + (field_duration_days * 10) + field_zone_fee
```

Where:
- `field_size_modifier` is a hidden number field (10-yard=1, 20-yard=2, 30-yard=3)
- `field_duration_days` is a number field or hidden value
- `field_zone_fee` is zone-based delivery fee

**Note:** Formulas require you to reference field IDs (the long alphanumeric strings). You can find these by clicking on a field and looking at the URL or developer tools.

### Step 3: Set Base Price (Optional)

In the service settings (outside the form builder):
- Set Base Price to $0 if all pricing comes from rules
- Or set Base Price to your minimum price and rules add to it

### Step 4: Save and Test

1. Click **"Save"** in the Form Builder
2. Click **"Preview"** to test the form
3. Try different combinations to ensure prices calculate correctly
4. Check that required fields (address, terms) are enforced

## Using Address for Zone Detection

If you want to automatically assign zones based on address:

### Option 1: Manual Zone Selection
Add a "Delivery Zone" select field that customers choose themselves based on their location.

### Option 2: Automatic Zone Detection (Requires Development)
This would integrate with your existing geofencing system:
1. Customer enters address
2. System detects which zone the address falls into
3. Hidden field is populated with zone value
4. Pricing rules apply based on that zone

**To implement automatic detection**, you would need to modify the dynamic form renderer to call your zone detection API when the address field changes.

## Best Practices

1. **Start Simple**: Begin with just size-based pricing, then add duration, then zones
2. **Test Thoroughly**: Preview the form and try every combination
3. **Use Clear Labels**: Make sure customers understand what they're selecting
4. **Show Price Breakdown**: The form automatically shows the calculated price
5. **Set Reasonable Defaults**: Pre-select the most common options
6. **Add Help Text**: Use placeholder text to explain pricing factors

## Common Patterns

### Pattern 1: Base Price + Add-ons
- Base Price: $200 (set in service settings)
- Form has checkboxes for add-ons (extra pickup +$50, overweight +$75)
- Use simple price modifiers on checkbox options

### Pattern 2: Fully Dynamic Pricing
- Base Price: $0
- All pricing comes from conditional rules
- Good for complex matrix pricing like dumpster rentals

### Pattern 3: Hybrid Approach
- Base Price: covers basic service
- Form has size selection (with price modifiers)
- Pricing Rules adjust for location/duration
- Total = Base + Size Modifier + Conditional Adjustments

## Troubleshooting

**Prices not calculating correctly?**
- Check that all field values match exactly in your conditions (case-sensitive)
- Ensure you're using the "Pricing Rules" tab, not just field modifiers
- Verify that condition operators are correct (equals vs. contains)

**Too many pricing rules?**
- Consider using formulas if there's a mathematical pattern
- Group similar rules together
- Use zone-based pricing instead of individual addresses

**Need help with zones?**
- Your existing zone management system can be integrated
- Add a hidden field that gets populated by zone detection
- Use that hidden field in pricing rules

## Example: Complete 10-Yard Pricing Matrix

| Size | Duration | Zone A | Zone B | Zone C |
|------|----------|--------|--------|--------|
| 10yd | 3 days   | $250   | $280   | $320   |
| 10yd | 7 days   | $300   | $330   | $370   |
| 10yd | 14 days  | $375   | $405   | $445   |
| 20yd | 3 days   | $350   | $380   | $420   |
| 20yd | 7 days   | $425   | $455   | $495   |
| 20yd | 14 days  | $525   | $555   | $595   |
| 30yd | 3 days   | $450   | $480   | $520   |
| 30yd | 7 days   | $550   | $580   | $620   |
| 30yd | 14 days  | $675   | $705   | $745   |

Each row = one conditional pricing rule with 3 conditions (size + duration + zone).

## Need More Help?

The form builder supports:
- ✅ Conditional field visibility (show/hide fields based on answers)
- ✅ Conditional requirements (make fields required based on conditions)
- ✅ Multiple condition logic (AND/OR operators)
- ✅ Price modifiers at field and option level
- ✅ Complex pricing rules with formulas
- ✅ Template-based form creation for common scenarios

Experiment with the templates (click "Use Template") to see pre-configured examples!
