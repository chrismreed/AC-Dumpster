# Quick Pricing Setup Guide

## 🎯 What You Want: Dumpster price based on Size + Duration + Location

## ✅ Here's How (5 Minutes)

### Step 1: Add Your Form Fields
In the **Form Fields** tab, add these fields:

```
1. Dumpster Size (Radio or Dropdown)
   ├─ 10 Yard Container (value: 10-yard)
   ├─ 20 Yard Container (value: 20-yard)
   └─ 30 Yard Container (value: 30-yard)

2. Rental Duration (Radio or Dropdown)
   ├─ 3 Days (value: 3-days)
   ├─ 7 Days (value: 7-days)
   └─ 14 Days (value: 14-days)

3. Delivery Address (Address field)
   - Just add it, no special config needed

4. Delivery Zone (Dropdown) - if using zones
   ├─ Zone A - City Limits (value: zone-a)
   ├─ Zone B - Suburbs (value: zone-b)
   └─ Zone C - Rural (value: zone-c)

5. Terms Agreement (Agreement field)
   - Label: "I agree to rental terms and conditions"
   - Placeholder: Your terms text here
   - Required: Yes
```

### Step 2: Configure Pricing Rules
Click the **Pricing Rules** tab at the top.

#### For Each Price Combination:

1. Click **"+ Conditional Pricing"**
2. Name it clearly: "10yd - 3days - ZoneA"
3. Click "Expand"
4. Add 3 conditions:

```
Condition 1:
Field: Dumpster Size
Operator: equals
Value: 10-yard
Price: $0

Condition 2:
Field: Rental Duration
Operator: equals
Value: 3-days
Price: $0

Condition 3:
Field: Delivery Zone
Operator: equals
Value: zone-a
Price: $250  ← This is your total price for this combo
```

**The last condition's price is what the customer pays for this exact combination.**

### Step 3: Create All Your Combinations

Repeat Step 2 for each row in your pricing table:

| Rule Name | Size | Duration | Zone | Price |
|-----------|------|----------|------|-------|
| Rule 1 | 10-yard | 3-days | zone-a | $250 |
| Rule 2 | 10-yard | 3-days | zone-b | $280 |
| Rule 3 | 10-yard | 3-days | zone-c | $320 |
| Rule 4 | 10-yard | 7-days | zone-a | $300 |
| Rule 5 | 10-yard | 7-days | zone-b | $330 |
| ... | ... | ... | ... | ... |

### Step 4: Save & Test

1. Click **"Save"**
2. Click **"Preview"**
3. Try selecting: 10-yard + 3-days + zone-a
4. You should see: **$250**

## 🤔 But Wait... How Does This Actually Work?

### The Logic:
When ALL three conditions match:
- Customer picks: 10-yard ✓
- Customer picks: 3-days ✓
- Customer picks: zone-a ✓
- System shows: $250 ✓

If they pick 20-yard instead, that rule doesn't match, so a different rule applies.

### Why Three Conditions?
Because your price depends on THREE things:
1. What size dumpster
2. How long they need it
3. Where you're delivering it

Each pricing rule checks all three, and whichever rule matches is the price shown.

## 💡 Pro Tips

### Tip 1: Name Your Rules Clearly
Good: "10yd-3days-ZoneA"
Bad: "Rule 1"

### Tip 2: Set Base Price to $0
In the service settings (outside form builder), set base price to $0 so all pricing comes from your rules.

### Tip 3: Use Templates
Click "Use Template" → "Residential Dumpster Rental" to see a pre-built example!

### Tip 4: Test Everything
Preview the form and try every combination to make sure your prices are right.

## 🚫 Common Mistakes

❌ **Using field price modifiers instead of pricing rules**
   - Field modifiers ADD to base price
   - Pricing rules SET the total price
   - For complex pricing, use Pricing Rules tab!

❌ **Typos in values**
   - "zone-a" ≠ "Zone-A" ≠ "zone a"
   - Must match EXACTLY

❌ **Forgetting combinations**
   - 3 sizes × 3 durations × 3 zones = 27 pricing rules needed
   - Don't forget any!

## 🎓 Real Example

Let's say you want:
- **10 yard, 3 days, Zone A = $250**

Here's what you do:

1. Go to "Pricing Rules" tab
2. Click "+ Conditional Pricing"
3. Name: "10yd-3days-ZoneA"
4. Click "Expand"
5. Click "+ Add Condition":
   - Field: Dumpster Size
   - Operator: equals
   - Value: 10-yard
   - Price: $0
6. Click "+ Add Condition":
   - Field: Rental Duration
   - Operator: equals
   - Value: 3-days
   - Price: $0
7. Click "+ Add Condition":
   - Field: Delivery Zone
   - Operator: equals
   - Value: zone-a
   - Price: **$250**
8. Done! This rule now says: "When all 3 match, charge $250"

Repeat for your other 26 combinations!

## 📊 Visual Workflow

```
Customer fills form:
  ↓
Selects: 10-yard dumpster
Selects: 7-days rental
Selects: zone-b delivery
  ↓
System checks all pricing rules
  ↓
Finds match: "10yd-7days-ZoneB" rule
  ↓
Shows price: $330
  ↓
Customer submits form
```

## 🆘 Still Confused?

**Q: Do I need to set prices on the field options too?**
A: No! When using Pricing Rules, leave the field option price modifiers at $0.

**Q: What if I have 100+ combinations?**
A: Consider using Formula pricing instead (advanced) or group by zones.

**Q: Can I combine field modifiers and pricing rules?**
A: Yes, but it's confusing. Pick one method and stick with it.

**Q: Where does base price come in?**
A: Set it to $0 in service settings if all pricing comes from rules. Or set a minimum price and rules add to it.

## ✨ You're Ready!

Now you know how to:
- ✅ Add Address and Agreement fields
- ✅ Create conditional pricing rules
- ✅ Set prices based on multiple factors
- ✅ Test your pricing logic

Go build your dumpster rental form! 🚛
