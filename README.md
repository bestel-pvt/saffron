# Section F — Men's Grooming Fix

**Issue:** Men's Grooming products on the live site were still showing old Unsplash images even after applying the Section F v2 bundle.

---

## Root cause

The Section F v2 bundle had **two bugs combined**:

1. **Wrong product count.** I parsed only 7 Men's Grooming products. Actual count: **8**. The product `g1: "Men's Saffron Face Wash"` was missed by my parser because its name uses `name:"..."` (double quotes) due to the apostrophe in "Men's" — my regex only matched single quotes.

2. **Wrong img replacement regex.** My replacement regex only matched `img:'<url>'` string literals. But all 8 Men's Grooming products in `scripts/generate-api.mjs` use `img:IMG.x4` style variable references (because the original author used an `IMG` lookup object for these). So 0 of them got replaced.

Net effect: all 8 Men's Grooming products kept their original `IMG.xN` (Unsplash) values.

---

## Fix

1. **Improved name regex** — now handles both `'name'` and `"name"` quote styles
2. **Improved img replacement** — now matches both `img:'literal'` AND `img:IMG.xN` references; replaces either with the local path
3. **Re-ran the mapping** — confirms 8 products, applies 8 images

---

## Result — all 8 Men's Grooming products now using local images

```
pos 1: g1   Men's Saffron Face Wash       → /images/mens-grooming/1.jpg
pos 2: g3   After Shave Balm              → /images/mens-grooming/2.jpg
pos 3: g6   Activated Charcoal Scrub      → /images/mens-grooming/3.jpg
pos 4: g7   Beard Growth Serum            → /images/mens-grooming/4.jpg
pos 5: g9   Scalp & Beard Wash            → /images/mens-grooming/5.jpg
pos 6: g12  Shaving Cream Premium         → /images/mens-grooming/6.jpg
pos 7: g13  Lip Balm for Men              → /images/mens-grooming/7.jpg
pos 8: g15  Charcoal Peel-Off Mask        → /images/mens-grooming/8.jpg
```

Verified: 0 remaining `IMG.xN` references in generate-api.mjs across the whole catalog.

---

## What's in this bundle

```
section-f-mens-grooming-fix/
├── scripts/generate-api.mjs           ← 8 Men's Grooming img URLs corrected
├── public/api/products.json           ← regenerated with all fixes
├── public/api/categories.json         ← regenerated
└── public/images/mens-grooming/       ← 8 image files
    └── 1.jpg through 8.jpg
```

---

## How to apply

```powershell
cd C:\path\to\saffron
xcopy /E /Y section-f-mens-grooming-fix\* .
```

Vite HMR will pick up the JSON change. Refresh the page.

---

## Note about the URL slug

You noticed the URL is `/collections/men-s-grooming` (with `-s-` because of the apostrophe in "Men's"). That's the app's slug generation logic and works correctly — independent from the image folder name (`mens-grooming` for cleanliness). Both coexist fine because the image paths stored in the JSON are absolute (`/images/mens-grooming/1.jpg`), not derived from the URL slug.

---

## Verify

1. Apply the bundle
2. Visit `http://localhost:5173/collections/men-s-grooming`
3. Should now show 8 products, each with a new local image:
   - Men's Saffron Face Wash (face wash bottle)
   - After Shave Balm (table-top product display)
   - Activated Charcoal Scrub (black tube)
   - Beard Growth Serum (Beard Growth Oil bottle)
   - Scalp & Beard Wash (brown shampoo bottle)
   - Shaving Cream Premium (black tub)
   - Lip Balm for Men (Biaqua tubes)
   - Charcoal Peel-Off Mask (BeYou black tube)
4. Click any product → should load detail page with same image
