/**
 * AUTO-GENERATED — do not edit by hand.
 * Produced by scripts/generate-gas-allowlist.ts from lib/config.ts.
 * Re-run "npm run generate:gas" after changing menu/pricing data, then
 * re-paste this file's contents into the Apps Script project.
 *
 * This is the backend's authoritative allowlist: Code.gs validates every
 * submitted subscription plan option id, and every selected
 * meal/add-on/party-item id, against these maps rather than trusting
 * anything the browser sends. SUBSCRIPTION_PLANS.totalPrice is the
 * server-side source of truth for subscription pricing — the frontend's
 * clientEstimatedTotal is advisory only.
 */

var GENERATED_ALLOWLIST = {
  MEAL_PREFERENCES: ["Lunch","Dinner","Lunch & Dinner"],
  FOOD_PREFERENCES: ["Veg","Non-Veg"],
  SUBSCRIPTION_PLANS: {
  "trial-veg-1": {
    "tierId": "trial",
    "foodType": "Veg",
    "mealCount": 1,
    "totalPrice": 750,
    "deliveryLabel": "1 time delivery. 3 days",
    "label": "3 Day Trial - 1 Meal (Veg)"
  },
  "trial-veg-2": {
    "tierId": "trial",
    "foodType": "Veg",
    "mealCount": 2,
    "totalPrice": 1440,
    "deliveryLabel": "2 time delivery. 3 days",
    "label": "3 Day Trial - 2 Meal (Veg)"
  },
  "trial-nonveg-1": {
    "tierId": "trial",
    "foodType": "Non-Veg",
    "mealCount": 1,
    "totalPrice": 825,
    "deliveryLabel": "1 time delivery. 3 days",
    "label": "3 Day Trial - 1 Meal (Non-Veg)"
  },
  "trial-nonveg-2": {
    "tierId": "trial",
    "foodType": "Non-Veg",
    "mealCount": 2,
    "totalPrice": 1500,
    "deliveryLabel": "2 time delivery. 3 days",
    "label": "3 Day Trial - 2 Meal (Non-Veg)"
  },
  "weekly-veg-1": {
    "tierId": "weekly",
    "foodType": "Veg",
    "mealCount": 1,
    "totalPrice": 1350,
    "deliveryLabel": "1 time delivery. 6 days",
    "label": "Weekly Plan - 1 Meal (Veg)"
  },
  "weekly-veg-2": {
    "tierId": "weekly",
    "foodType": "Veg",
    "mealCount": 2,
    "totalPrice": 2520,
    "deliveryLabel": "2 time delivery. 6 days",
    "label": "Weekly Plan - 2 Meal (Veg)"
  },
  "weekly-nonveg-1": {
    "tierId": "weekly",
    "foodType": "Non-Veg",
    "mealCount": 1,
    "totalPrice": 1440,
    "deliveryLabel": "1 time delivery. 6 days",
    "label": "Weekly Plan - 1 Meal (Non-Veg)"
  },
  "weekly-nonveg-2": {
    "tierId": "weekly",
    "foodType": "Non-Veg",
    "mealCount": 2,
    "totalPrice": 2700,
    "deliveryLabel": "2 time delivery. 6 days",
    "label": "Weekly Plan - 2 Meal (Non-Veg)"
  },
  "monthly-veg-1": {
    "tierId": "monthly",
    "foodType": "Veg",
    "mealCount": 1,
    "totalPrice": 4800,
    "deliveryLabel": "1 time delivery. 24 days",
    "label": "Monthly Plan - 1 Meal (Veg)"
  },
  "monthly-veg-2": {
    "tierId": "monthly",
    "foodType": "Veg",
    "mealCount": 2,
    "totalPrice": 4560,
    "deliveryLabel": "2 time delivery. 24 days",
    "label": "Monthly Plan - 2 Meal (Veg)"
  },
  "monthly-nonveg-1": {
    "tierId": "monthly",
    "foodType": "Non-Veg",
    "mealCount": 1,
    "totalPrice": 5040,
    "deliveryLabel": "1 time delivery. 24 days",
    "label": "Monthly Plan - 1 Meal (Non-Veg)"
  },
  "monthly-nonveg-2": {
    "tierId": "monthly",
    "foodType": "Non-Veg",
    "mealCount": 2,
    "totalPrice": 9600,
    "deliveryLabel": "2 time delivery. 24 days",
    "label": "Monthly Plan - 2 Meal (Non-Veg)"
  },
  "salad-veg-1": {
    "tierId": "salad",
    "foodType": "Veg",
    "mealCount": 1,
    "totalPrice": 1350,
    "deliveryLabel": "1 time delivery. 6 days",
    "label": "Salad Plan - 1 Meal (Veg)"
  },
  "salad-veg-2": {
    "tierId": "salad",
    "foodType": "Veg",
    "mealCount": 2,
    "totalPrice": 2520,
    "deliveryLabel": "2 time delivery. 6 days",
    "label": "Salad Plan - 2 Meal (Veg)"
  },
  "salad-nonveg-1": {
    "tierId": "salad",
    "foodType": "Non-Veg",
    "mealCount": 1,
    "totalPrice": 1440,
    "deliveryLabel": "1 time delivery. 6 days",
    "label": "Salad Plan - 1 Meal (Non-Veg)"
  },
  "salad-nonveg-2": {
    "tierId": "salad",
    "foodType": "Non-Veg",
    "mealCount": 2,
    "totalPrice": 2700,
    "deliveryLabel": "2 time delivery. 6 days",
    "label": "Salad Plan - 2 Meal (Non-Veg)"
  }
},
  MEAL_IDS: {
  "veg-alfredo-penne-pasta-veg": "Alfredo Penne Pasta Veg",
  "veg-cilantro-penne-pasta-veg": "Cilantro Penne Pasta Veg",
  "veg-basil-penne-pasta-veg": "Basil Penne Pasta Veg",
  "veg-chilli-paneer-with-rice-combo": "Chilli Paneer with Rice Combo",
  "veg-chilli-paneer-with-noodles-combo": "Chilli Paneer with Noodles Combo",
  "veg-chilli-mushroom-with-rice-combo": "Chilli Mushroom with Rice Combo",
  "veg-chilli-mushroom-with-noodles-combo": "Chilli Mushroom with Noodles Combo",
  "veg-grilled-paneer-salad": "Grilled Paneer Salad",
  "veg-caesar-salad-veg": "Caesar Salad Veg",
  "veg-asian-salad-veg": "Asian Salad Veg",
  "veg-tropical-salad-veg": "Tropical Salad Veg",
  "veg-bbq-salad-veg": "BBQ Salad Veg",
  "veg-paneer-tikka-with-ghee-rice": "Paneer Tikka with Ghee Rice",
  "veg-thai-green-curry-with-rice-veg": "Thai Green Curry with Rice Veg",
  "veg-paneer-butter-masala-with-roti": "Paneer Butter Masala with Roti",
  "veg-veg-biriyani": "Veg Biriyani",
  "veg-stroganoff-paneer-with-rice": "Stroganoff Paneer with Rice",
  "veg-veg-kurma-with-roti": "Veg Kurma with Roti",
  "non-veg-alfredo-penne-pasta-chicken": "Alfredo Penne Pasta Chicken",
  "non-veg-cilantro-penne-pasta-chicken": "Cilantro Penne Pasta Chicken",
  "non-veg-basil-penne-pasta-chicken": "Basil Penne Pasta Chicken",
  "non-veg-chilli-chicken-with-rice-combo": "Chilli Chicken with Rice Combo",
  "non-veg-chilli-chicken-with-noodles-combo": "Chilli Chicken with Noodles Combo",
  "non-veg-asian-salad-chicken": "Asian Salad Chicken",
  "non-veg-tropical-chicken-salad": "Tropical Chicken Salad",
  "non-veg-grilled-chicken-salad": "Grilled Chicken Salad",
  "non-veg-caesar-salad-chicken": "Caesar Salad Chicken",
  "non-veg-bbq-chicken-salad": "BBQ Chicken Salad",
  "non-veg-tandoori-chicken-salad": "Tandoori Chicken Salad",
  "non-veg-chicken-kebab-with-ghee-rice": "Chicken Kebab with Ghee Rice",
  "non-veg-butter-chicken-with-roti": "Butter Chicken with Roti",
  "non-veg-stroganoff-chicken-with-rice": "Stroganoff Chicken with Rice",
  "non-veg-thai-green-curry-chicken-with-rice": "Thai Green Curry Chicken with Rice",
  "non-veg-chicken-kurma-with-roti": "Chicken Kurma with Roti",
  "non-veg-chicken-65-with-rice": "Chicken 65 with Rice",
  "non-veg-chicken-biriyani": "Chicken Biriyani"
},
  ADDON_IDS: {
  "dessert-san-sebastian-cheese-cake": "San Sebastian Cheese Cake",
  "dessert-tiramisu": "Tiramisu",
  "dessert-brownie-with-chocolate-sauce-nuts": "Brownie with Chocolate Sauce & Nuts",
  "dessert-tropical-gudbad": "Tropical Gudbad",
  "dessert-arabian-gudbad": "Arabian Gudbad",
  "dessert-death-by-chocolate": "Death By Chocolate"
},
  PARTY_ITEM_IDS: {
  "party-veg-paneer-chilly": "Paneer Chilly",
  "party-veg-paneer-ghee-roast": "Paneer Ghee Roast",
  "party-veg-paneer-tikka-masala": "Paneer Tikka Masala",
  "party-veg-paneer-curry-patta": "Paneer Curry Patta",
  "party-veg-palak-paneer": "Palak Paneer",
  "party-veg-gobi-chilly": "Gobi Chilly",
  "party-veg-chana-masala": "Chana Masala",
  "party-veg-mixed-vegetable-curry": "Mixed Vegetable Curry",
  "party-veg-navarathna-kurma": "Navarathna Kurma",
  "party-veg-veg-kurma": "Veg Kurma",
  "party-veg-veg-fried-rice": "Veg Fried Rice",
  "party-veg-veg-pulav": "Veg Pulav",
  "party-veg-veg-biriyani": "Veg Biriyani",
  "party-veg-mushroom-chilly": "Mushroom Chilly",
  "party-veg-hot-garlic-mushroom": "Hot Garlic Mushroom",
  "party-veg-schezwan-mushroom": "Schezwan Mushroom",
  "party-veg-kadle-sukka": "Kadle Sukka",
  "party-veg-ghee-rice": "Ghee Rice",
  "party-nonveg-chicken-chilly": "Chicken Chilly",
  "party-nonveg-chicken-sukka": "Chicken Sukka",
  "party-nonveg-pepper-chicken": "Pepper Chicken",
  "party-nonveg-chicken-ghee-roast": "Chicken Ghee Roast",
  "party-nonveg-chicken-green-masala-curry": "Chicken Green Masala Curry",
  "party-nonveg-kundapura-chicken-curry": "Kundapura Chicken Curry",
  "party-nonveg-hyderabadi-chicken": "Hyderabadi Chicken",
  "party-nonveg-pudina-chicken": "Pudina Chicken",
  "party-nonveg-chicken-tikka-masala": "Chicken Tikka Masala",
  "party-nonveg-chicken-kebab": "Chicken Kebab",
  "party-nonveg-chicken-65": "Chicken 65",
  "party-nonveg-chicken-fried-rice": "Chicken Fried Rice",
  "party-nonveg-chicken-biriyani": "Chicken Biriyani",
  "party-nonveg-mutton-green-masala-curry": "Mutton Green Masala Curry",
  "party-nonveg-mutton-pepper-fry": "Mutton Pepper Fry",
  "party-nonveg-mutton-sukka": "Mutton Sukka",
  "party-nonveg-mutton-rogan-gosh": "Mutton Rogan Gosh",
  "party-nonveg-mutton-biriyani": "Mutton Biriyani",
  "party-nonveg-prawns-biriyani": "Prawns Biriyani",
  "party-nonveg-prawns-curry": "Prawns Curry",
  "party-nonveg-fish-curry": "Fish Curry",
  "party-dessert-san-sebastian-cheese-cake": "San Sebastian Cheese Cake",
  "party-dessert-tiramisu": "Tiramisu",
  "party-dessert-brownie-with-chocolate-sauce-nuts": "Brownie with Chocolate Sauce & Nuts",
  "party-dessert-tropical-gudbad": "Tropical Gudbad",
  "party-dessert-arabian-gudbad": "Arabian Gudbad",
  "party-dessert-death-by-chocolate": "Death By Chocolate"
}
};
