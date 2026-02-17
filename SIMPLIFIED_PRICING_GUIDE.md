# Simplified Pricing System Guide

## Overview

The pricing system has been completely redesigned to be **simple and intuitive**. Instead of complex pricing rules in a separate section, you now configure pricing **directly on your form fields** as you build them.

## 🎯 Quick Start: Junk Removal Example

Let's create a junk removal form with calculated pricing in 5 minutes:

### Step 1: Add Load Size Field (Sets Base Price)

1. Click "+ Select" to add a dropdown field
2. Set label: "How much junk do you have?"
3. Add options:
   - **Option 1:** "Small Load"
     - Pricing: **Set base price** → $150
   - **Option 2:** "Medium Load"
     - Pricing: **Set base price** → $250
   - **Option 3:** "Large Load"
     - Pricing: **Set base price** → $350
   - **Option 4:** "Full Truck"
     - Pricing: **Set base price** → $500

### Step 2: Add Special Items (Add-Ons)

1. Click "+ Checkbox" to add checkboxes
2. Set label: "Special items needing disposal?"
3. Add options:
   - **Option 1:** "Appliances"
     - Pricing: **Add to price** → $50
   - **Option 2:** "Mattresses"
     - Pricing: **Add to price** → $30
   - **Option 3:** "Electronics"
     - Pricing: **Add to price** → $25
   - **Option 4:** "Tires"
     - Pricing: **Add to price** → $15

### Step 3: Add Address Field

1. Click "+ Address"
2. Set label: "Where is the junk located?"
3. Mark as Required
4. No pricing needed

### Step 4: Test It!

Click "Preview Form" and try different combinations:

- **Small Load + Appliances + Mattresses** = $150 + $50 + $30 = **$230**
- **Full Truck + All Items** = $500 + $50 + $30 + $25 + $15 = **$620**

---

## 📋 Pricing Types Explained

### 1. **Set Base Price**
**Use for:** Primary choice that determines the starting price (size, tier, package)

**How it works:** Replaces the total with this amount

**Example:** Load size selection
- Small = $150 (sets total to $150)
- Large = $350 (sets total to $350)

**Important:** Only the FIRST "Set base" selection counts. If customer selects multiple, only the first one applies.

---

### 2. **Add to Price**
**Use for:** Optional add-ons, extras, additional services

**How it works:** Adds this amount to the current total

**Example:** Add-on items
- Appliances = +$50
- Mattresses = +$30

Customer can select multiple add-ons, and each adds to the total.

---

### 3. **Multiply by %**
**Use for:** Percentage-based pricing (surcharges, discounts, tax)

**How it works:** Multiplies current total by percentage

**Example:** Commercial surcharge
- Enter **20** to add 20% to total
- If total is $100, it becomes $120

---

### 4. **Per-Unit Pricing** (Number Fields Only)
**Use for:** Quantity-based pricing

**How it works:** Multiplies the number entered by price per unit

**Example:** Cubic yards of material
- Price per unit: $15
- Customer enters: 10
- Adds to total: $150

**To enable:**
1. Add a Number field
2. Click "Show Advanced Options"
3. Toggle "Enable per-unit pricing"
4. Set price per unit

---

## 🎨 Common Pricing Patterns

### Pattern 1: Tiered Pricing (Size/Package Selection)
```
Field: "Select Dumpster Size" (Radio)
Options:
  10-Yard → Set base: $299
  20-Yard → Set base: $399
  30-Yard → Set base: $499
```

### Pattern 2: Base + Add-Ons
```
Field 1: "Service Package" (Radio)
  Basic → Set base: $100
  Premium → Set base: $200

Field 2: "Additional Services" (Checkbox)
  Same-day delivery → Add: $50
  Weekend service → Add: $75
```

### Pattern 3: Quantity-Based
```
Field: "Number of Items" (Number)
  Per-unit pricing: $25 each

Customer enters 5 → Adds $125 to total
```

### Pattern 4: Percentage Modifier
```
Field 1: "Project Type" (Radio)
  Residential → Set base: $500
  Commercial → Set base: $500

Field 2: "Rush Service?" (Radio)
  Standard (no cost) → No pricing
  Rush (+20%) → Multiply: 20

Result: Commercial + Rush = $500 + 20% = $600
```

---

## 💡 Tips & Best Practices

### ✅ DO:
- **Put "Set base" first** - Add your size/tier selection field before add-ons
- **Use clear labels** - "Small Load (+$150)" helps customers understand pricing
- **Test thoroughly** - Use the Preview button to verify calculations
- **Start simple** - Begin with basic pricing, add complexity only if needed

### ❌ DON'T:
- **Don't use multiple "Set base" in checkboxes** - Customers can select multiple options, causing confusion
- **Don't make pricing too complex** - If you need advanced formulas, consider using a quote-only service
- **Don't forget to test** - Always preview your form before publishing

---

## 🔧 Advanced: Number Field Pricing

For fields where customers enter quantities (cubic yards, number of items, etc.):

1. Add a **Number** field
2. Click "Show Advanced Options"
3. Toggle **"Enable per-unit pricing"**
4. Set **Price Per Unit** (e.g., $15)
5. Optionally set Min/Max values

**Example calculation:**
- Price per unit: $15
- Customer enters: 7
- Added to total: $105

---

## 📊 Calculation Order

The system calculates price in this order:

1. **Start with Base Price** (from service settings, often $0)
2. **Apply "Set Base"** - First field with "Set base" replaces total
3. **Apply "Add"** - All "Add to price" options are added
4. **Apply "Multiply"** - Percentage modifiers are applied last
5. **Add Per-Unit** - Number field quantities are calculated

**Example flow:**
```
Base: $0
→ Select "Large Load" (Set base: $350) → Total: $350
→ Check "Appliances" (Add: $50) → Total: $400
→ Check "Mattresses" (Add: $30) → Total: $430
→ Select "Rush Service" (Multiply: 20%) → Total: $516
→ Enter quantity: 2 (Per-unit: $25) → Total: $566
```

---

## 🚀 Migration from Old System

If you have existing services using the old "Pricing Rules" system:

**Good news:** Your existing forms still work! The system supports both:
- New inline pricing (recommended)
- Legacy pricing rules (still functional)

**To update:**
1. Edit your service
2. Go to "Custom Form" tab
3. Click on each field option
4. Set the new pricing type and amount
5. Save

The old pricing rules tab has been hidden to simplify the interface, but old rules still work in the background.

---

## ❓ FAQ

**Q: Can I have multiple "Set base" options in one form?**
A: Yes, but only the FIRST one selected will apply. Use radio/select (single choice) for base pricing.

**Q: What if I need complex pricing logic?**
A: The new system handles 95% of use cases. For very complex scenarios (zone-based pricing, date-based rates), contact support.

**Q: How do I see the pricing rules I created?**
A: All pricing is visible directly on your field options. Click any field to see/edit its pricing.

**Q: Can I use this for quote-only services?**
A: Yes! Simply don't add any pricing to your fields. The form will collect information without calculating a price.

**Q: What happens if price goes negative?**
A: The system prevents negative pricing - minimum is always $0.

---

## 📞 Need Help?

- The blue info banner at the top of the form builder has quick tips
- Each pricing type has a hover tooltip explaining when to use it
- The Preview button lets you test your pricing before going live

Happy form building! 🎉
