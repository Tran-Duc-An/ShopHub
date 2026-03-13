"""
import_amazon.py
────────────────────────────────────────────────────────────
Phase 1 — Scan all CSVs, collect every unique category,
           auto-map what we can, print unknowns for review.
Phase 2 — Import products using the resolved category map.
           - Batch-checks image URLs in parallel (HEAD requests)
           - Dead URLs are cleared before insert
Phase 3 — Save a JSON + TXT report after upload.
────────────────────────────────────────────────────────────
"""

import os, glob, re, json, pandas as pd, hashlib
from collections import defaultdict
from pymongo import MongoClient
from datetime import datetime, timezone
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

# ─── CONFIG ───────────────────────────────────────────────

MONGO_URI  = "mongodb+srv://ducan1292005_db_user:DCrsRzLBDnRdtihG@cluster0.pcujnos.mongodb.net/shophub?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME    = "shophub"
CSV_FOLDER = "./archive"
TARGET     = 50000
PER_CAT    = 2000
MAP_CACHE  = "./category_map_cache.json"

# Image check settings
IMG_CHECK_WORKERS = 64    # parallel threads for HEAD requests
IMG_CHECK_TIMEOUT = 4     # seconds per request before giving up

# ─── App categories ───────────────────────────────────────

APP_CATEGORIES = [
    "Jewelry & Watches",
    "Men's Clothing",
    "Women's Clothing",
    "Cameras & Photography",
    "Shoes & Footwear",
    "Home & Kitchen",
    "Baby & Kids",
    "Fitness & Gym",
    "Bags & Luggage",
    "Beauty & Personal Care",
    "Automotive",
    "Pet Supplies",
    "Musical Instruments",
    "Food & Beverages",
]

SEED_HINTS = {
    "car": "Automotive", "motorbike": "Automotive",
    "automotive": "Automotive", "vehicle": "Automotive",
    "electronic": "Electronics", "tv": "Electronics",
    "television": "Electronics", "audio": "Audio & Headphones",
    "headphone": "Audio & Headphones", "earphone": "Audio & Headphones",
    "speaker": "Audio & Headphones", "earbuds": "Audio & Headphones",
    "computer": "Computers & Laptops", "laptop": "Computers & Laptops",
    "desktop": "Computers & Laptops", "tablet": "Computers & Laptops",
    "mobile": "Smartphones & Accessories", "phone": "Smartphones & Accessories",
    "smartphone": "Smartphones & Accessories",
    "camera": "Cameras & Photography", "photo": "Cameras & Photography",
    "home": "Home & Kitchen", "kitchen": "Home & Kitchen",
    "appliance": "Home & Kitchen", "cookware": "Home & Kitchen",
    "furniture": "Furniture & Decor", "décor": "Furniture & Decor",
    "decor": "Furniture & Decor", "lighting": "Lighting",
    "lamp": "Lighting", "bulb": "Lighting",
    "garden": "Garden & Outdoor Living", "outdoor": "Garden & Outdoor Living",
    "tool": "Tools & Hardware", "hardware": "Tools & Hardware",
    "industrial": "Tools & Hardware", "power tool": "Tools & Hardware",
    "office": "Office Supplies", "stationery": "Books & Stationery",
    "book": "Books & Stationery", "magazine": "Books & Stationery",
    "women": "Women's Clothing", "girl": "Women's Clothing",
    "men": "Men's Clothing", "boy": "Men's Clothing",
    "shoe": "Shoes & Footwear", "footwear": "Shoes & Footwear",
    "sandal": "Shoes & Footwear", "sneaker": "Shoes & Footwear",
    "bag": "Bags & Luggage", "luggage": "Bags & Luggage",
    "handbag": "Bags & Luggage", "purse": "Bags & Luggage",
    "jewel": "Jewelry & Watches", "watch": "Jewelry & Watches",
    "jewellery": "Jewelry & Watches",
    "beauty": "Beauty & Personal Care", "cosmetic": "Beauty & Personal Care",
    "makeup": "Beauty & Personal Care", "skincare": "Beauty & Personal Care",
    "health": "Health & Wellness", "wellness": "Health & Wellness",
    "personal care": "Health & Wellness",
    "sport": "Sports & Outdoors", "outdoor sport": "Sports & Outdoors",
    "fitness": "Fitness & Gym", "gym": "Fitness & Gym",
    "exercise": "Fitness & Gym", "yoga": "Fitness & Gym",
    "toy": "Toys & Games", "game": "Toys & Games",
    "baby": "Baby & Kids", "kid": "Baby & Kids",
    "infant": "Baby & Kids", "children": "Baby & Kids",
    "pet": "Pet Supplies", "dog": "Pet Supplies",
    "cat supply": "Pet Supplies",
    "music": "Musical Instruments", "instrument": "Musical Instruments",
    "guitar": "Musical Instruments", "piano": "Musical Instruments",
    "drum": "Musical Instruments",
    "video game": "Gaming", "gaming": "Gaming",
    "console": "Gaming", "playstation": "Gaming",
    "grocery": "Food & Beverages", "food": "Food & Beverages",
    "beverage": "Food & Beverages", "gourmet": "Food & Beverages",
    "art": "Art & Crafts", "craft": "Art & Crafts",
    "paint": "Art & Crafts",
}


def auto_map(raw):
    lower = raw.lower().strip()
    if lower in SEED_HINTS:
        return SEED_HINTS[lower]
    for kw in sorted(SEED_HINTS, key=len, reverse=True):
        if kw in lower:
            return SEED_HINTS[kw]
    return None


# ─── Helpers ─────────────────────────────────────────────

def clean_price(val):
    if not val or str(val).strip() in ("nan", "", "None"): return None
    s = re.sub(r"[^\d.]", "", str(val).replace(",", ""))
    try:
        p = float(s)
        if p <= 0: return None
        if p > 200: p = round(p / 83, 2)
        return round(p, 2)
    except: return None

def clean_rating(val):
    try:
        r = float(str(val).split()[0])
        return round(r, 1) if 0 < r <= 5 else None
    except: return None

def clean_reviews(val):
    try: return int(re.sub(r"[^\d]", "", str(val)))
    except: return 0

def is_valid_image_format(url):
    """Quick format check — no network request."""
    if not url or str(url).strip() in ("nan", "", "None"): return False
    u = str(url).strip()
    return u.startswith("http") and (
        any(e in u.lower() for e in [".jpg", ".jpeg", ".png", ".webp"])
        or "images-amazon" in u or "m.media-amazon" in u
    )

def make_seller_email(name):
    return f"seller_{re.sub(r'[^a-z0-9]', '_', name.lower())[:30]}@marketplace.com"

def fake_password(email):
    return hashlib.sha256(f"pass_{email}".encode()).hexdigest()

COL_CANDIDATES = {
    "name":     ["name", "product_name", "title"],
    "price":    ["discount_price", "discounted_price", "selling_price", "final_price", "price"],
    "orig":     ["actual_price", "mrp", "original_price", "initial_price"],
    "rating":   ["ratings", "rating", "average_rating"],
    "reviews":  ["no_of_ratings", "rating_count", "reviews_count", "num_ratings"],
    "image":    ["image", "image_url", "img_link", "thumbnail"],
    "main_cat": ["main_category", "main_cat", "category"],
    "sub_cat":  ["sub_category", "sub_cat", "subcategory"],
}

def fc(df_cols, key):
    for c in COL_CANDIDATES[key]:
        if c in df_cols: return c
    return None


# ═══════════════════════════════════════════════════════════
# IMAGE URL CHECKER
# ═══════════════════════════════════════════════════════════

def check_image_url(url: str) -> bool:
    """
    Send a HEAD request to verify the image URL is alive.
    Returns True if server responds 200-399, False otherwise.
    """
    try:
        req = urllib.request.Request(
            url, method="HEAD",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=IMG_CHECK_TIMEOUT) as resp:
            return resp.status < 400
    except Exception:
        return False


def batch_check_images(products: list) -> tuple[int, int]:
    """
    Check image_url for every product in parallel.
    Clears image_url in-place if the URL is dead.
    Returns (live_count, dead_count).
    """
    # Collect products that actually have a URL to check
    to_check = [(i, p["image_url"]) for i, p in enumerate(products) if p["image_url"]]

    if not to_check:
        return 0, 0

    live = dead = 0

    with tqdm(total=len(to_check), desc="Checking images",
              unit=" URLs", colour="magenta", dynamic_ncols=True) as bar:

        with ThreadPoolExecutor(max_workers=IMG_CHECK_WORKERS) as pool:
            future_to_idx = {
                pool.submit(check_image_url, url): idx
                for idx, url in to_check
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                ok  = future.result()
                if ok:
                    live += 1
                else:
                    products[idx]["image_url"] = ""   # clear dead URL
                    dead += 1
                bar.update(1)
                bar.set_postfix({"live": live, "dead": dead})

    return live, dead


# ═══════════════════════════════════════════════════════════
# PHASE 1 — Scan
# ═══════════════════════════════════════════════════════════

def phase1_scan(csv_files):
    print("\n" + "═" * 60)
    print("  PHASE 1 — Scanning all CSVs for categories")
    print("═" * 60)

    pair_counts = defaultdict(int)

    for csv_path in tqdm(csv_files, desc="Scanning", unit="file", dynamic_ncols=True):
        try:
            df = pd.read_csv(csv_path, on_bad_lines="skip", encoding="utf-8",
                             usecols=lambda c: c in sum(COL_CANDIDATES.values(), []))
        except Exception:
            try:
                df = pd.read_csv(csv_path, on_bad_lines="skip", encoding="latin-1",
                                 usecols=lambda c: c in sum(COL_CANDIDATES.values(), []))
            except: continue

        cols     = df.columns.tolist()
        col_main = fc(cols, "main_cat")
        col_sub  = fc(cols, "sub_cat")
        if not col_main: continue

        for _, row in df.iterrows():
            main = str(row.get(col_main, "")).strip()
            sub  = str(row.get(col_sub, "")).strip() if col_sub else ""
            if main and main != "nan":
                pair_counts[f"{main}|||{sub}"] += 1

    return pair_counts


def build_category_map(pair_counts):
    main_counts = defaultdict(int)
    main_subs   = defaultdict(set)
    for key, count in pair_counts.items():
        main, sub = key.split("|||", 1)
        main_counts[main] += count
        if sub and sub != "nan": main_subs[main].add(sub)

    resolved   = {}
    unresolved = {}

    for main, count in sorted(main_counts.items(), key=lambda x: -x[1]):
        mapped = auto_map(main)
        if mapped:
            resolved[main] = mapped
        else:
            sub_mapped = None
            for sub in main_subs[main]:
                sub_mapped = auto_map(sub)
                if sub_mapped: break
            resolved[main] = sub_mapped if sub_mapped else None
            if not sub_mapped:
                unresolved[main] = count

    print(f"\nAuto-mapped {len(resolved) - len(unresolved)} categories")

    by_app = defaultdict(list)
    for raw, app in resolved.items():
        if app: by_app[app].append(raw)

    print("\n── Mapped ──────────────────────────────────────────")
    for app_cat in sorted(by_app):
        print(f"  {app_cat}")
        for r in sorted(by_app[app_cat]):
            print(f"    <- \"{r}\"  ({main_counts[r]:,} rows)")

    if unresolved:
        print(f"\n── Unmapped ({len(unresolved)}) -> will go to 'Other' ──")
        for raw, count in sorted(unresolved.items(), key=lambda x: -x[1]):
            print(f"  \"{raw}\"  ({count:,} rows)")

    for raw in unresolved:
        resolved[raw] = "Other"

    return resolved


# ═══════════════════════════════════════════════════════════
# PHASE 2 — Import
# ═══════════════════════════════════════════════════════════

def phase2_import(csv_files, category_map):
    print("\n" + "═" * 60)
    print("  PHASE 2 — Importing products")
    print("═" * 60 + "\n")

    client = MongoClient(MONGO_URI)
    db     = client[DB_NAME]

    prod_del   = db.products.delete_many({})
    seller_del = db.users.delete_many({"role": "seller"})
    print(f"Cleared {prod_del.deleted_count:,} products, {seller_del.deleted_count} sellers\n")

    MOCK_SELLERS = [
        "TechZone Store", "FashionHub", "HomeEssentials", "GadgetWorld",
        "SportsPro", "BeautyBliss", "KidsCorner", "OutdoorGear",
        "BookNook", "PetPalace", "AutoParts Direct", "KitchenKing",
        "JewelCraft", "HealthFirst", "ToyLand",
    ]
    now         = datetime.now(timezone.utc)
    seller_docs = [{"name": n, "email": make_seller_email(n),
                    "password": fake_password(make_seller_email(n)),
                    "role": "seller", "created_at": now} for n in MOCK_SELLERS]
    res     = db.users.insert_many(seller_docs)
    sellers = [(d["name"], _id) for d, _id in zip(seller_docs, res.inserted_ids)]
    print(f"Created {len(sellers)} sellers\n")

    all_products   = []
    per_cat_counts = defaultdict(int)

    file_bar = tqdm(csv_files, desc="CSV files", unit="file",    colour="green", dynamic_ncols=True)
    overall  = tqdm(           desc="Products",  unit="products", colour="cyan",  dynamic_ncols=True)

    for csv_path in file_bar:
        fname = os.path.basename(csv_path)
        file_bar.set_postfix({"total": f"{len(all_products):,}"})
        if len(all_products) >= TARGET: break

        try:    df = pd.read_csv(csv_path, on_bad_lines="skip", encoding="utf-8")
        except Exception:
            try:    df = pd.read_csv(csv_path, on_bad_lines="skip", encoding="latin-1")
            except: continue

        cols      = df.columns.tolist()
        col_name  = fc(cols, "name");    col_price = fc(cols, "price")
        col_orig  = fc(cols, "orig");    col_rat   = fc(cols, "rating")
        col_rev   = fc(cols, "reviews"); col_img   = fc(cols, "image")
        col_main  = fc(cols, "main_cat");col_sub   = fc(cols, "sub_cat")

        if not col_name or not col_price: continue

        added = 0
        for _, row in df.iterrows():
            if len(all_products) >= TARGET: break

            name = str(row.get(col_name, "")).strip()
            if not name or name == "nan" or len(name) < 5: continue

            final_price = clean_price(row.get(col_price))
            if not final_price: continue

            initial_price = clean_price(row.get(col_orig)) if col_orig else None
            if not initial_price or initial_price <= final_price:
                initial_price = round(final_price * 1.2, 2)

            main_raw = str(row.get(col_main, "")).strip() if col_main else ""
            sub_raw  = str(row.get(col_sub,  "")).strip() if col_sub  else ""
            category = category_map.get(main_raw) or "Other"

            if per_cat_counts[category] >= PER_CAT: continue

            # Format-check image URL (no network yet — that's done in bulk later)
            image_url = str(row.get(col_img, "")).strip()
            if not is_valid_image_format(image_url): image_url = ""

            idx = len(all_products) % len(sellers)
            all_products.append({
                "product_name":   name[:200],
                "description":    "",
                "brand":          "",
                "initial_price":  initial_price,
                "final_price":    final_price,
                "currency":       "USD",
                "rating":         clean_rating(row.get(col_rat))  if col_rat else None,
                "reviews_count":  clean_reviews(row.get(col_rev)) if col_rev else 0,
                "image_url":      image_url,
                "category":       category,
                "main_category":  main_raw,
                "sub_category":   sub_raw,
                "stock_quantity": 100,
                "seller_id":      sellers[idx][1],
                "seller_name":    sellers[idx][0],
                "created_at":     now,
            })
            per_cat_counts[category] += 1
            added += 1
            overall.update(1)

        if added:
            tqdm.write(f"  + {fname:45s} +{added:>6,}")

    overall.close(); file_bar.close()

    if not all_products:
        print("No products collected."); client.close(); return

    # ── Image URL verification ─────────────────────────────
    print(f"\n{'═'*60}")
    print(f"  IMAGE CHECK — verifying {sum(1 for p in all_products if p['image_url']):,} URLs")
    print(f"  Workers: {IMG_CHECK_WORKERS}  Timeout: {IMG_CHECK_TIMEOUT}s per URL")
    print(f"{'═'*60}\n")

    live, dead = batch_check_images(all_products)
    print(f"\n  Live: {live:,}   Dead/cleared: {dead:,}   "
          f"No URL: {sum(1 for p in all_products if not p['image_url']) - dead:,}")

    # ── Upload in batches ──────────────────────────────────
    print(f"\n{'═'*60}")
    print(f"  UPLOADING to MongoDB")
    print(f"{'═'*60}\n")

    BATCH = 500; inserted = 0
    with tqdm(total=len(all_products), desc="Uploading", unit="docs",
              colour="yellow", dynamic_ncols=True) as ub:
        for i in range(0, len(all_products), BATCH):
            db.products.insert_many(all_products[i:i + BATCH])
            n = len(all_products[i:i + BATCH]); inserted += n; ub.update(n)

    print(f"\nInserted {inserted:,} products\n")

    print("── Category breakdown ──────────────────────────────────────")
    max_c = max(per_cat_counts.values()) if per_cat_counts else 1
    for cat, count in sorted(per_cat_counts.items(), key=lambda x: -x[1]):
        bar = "#" * int(count / max_c * 35)
        print(f"  {cat:35s} {bar:<35} {count:>8,}")

    save_report(inserted, per_cat_counts, all_products, now, live, dead)
    client.close()


# ═══════════════════════════════════════════════════════════
# PHASE 3 — Save report
# ═══════════════════════════════════════════════════════════

def save_report(inserted, per_cat_counts, all_products, run_time, img_live=0, img_dead=0):
    timestamp = run_time.strftime("%Y%m%d_%H%M%S")
    base      = f"./import_report_{timestamp}"

    no_image  = sum(1 for p in all_products if not p["image_url"])
    no_rating = sum(1 for p in all_products if not p["rating"])
    prices    = [p["final_price"] for p in all_products]
    avg_price = round(sum(prices) / max(1, len(prices)), 2)
    min_price = round(min(prices), 2) if prices else 0
    max_price = round(max(prices), 2) if prices else 0

    samples = defaultdict(list)
    for p in all_products:
        if len(samples[p["category"]]) < 3:
            samples[p["category"]].append({
                "name":      p["product_name"],
                "price":     p["final_price"],
                "rating":    p["rating"],
                "has_image": bool(p["image_url"]),
                "main_cat":  p["main_category"],
                "sub_cat":   p["sub_category"],
            })

    report = {
        "run_at":         run_time.isoformat(),
        "database":       DB_NAME,
        "total_inserted": inserted,
        "config":         {"TARGET": TARGET, "PER_CAT": PER_CAT},
        "stats": {
            "no_image":        no_image,
            "no_image_pct":    round(no_image  / max(1, inserted) * 100, 1),
            "no_rating":       no_rating,
            "no_rating_pct":   round(no_rating / max(1, inserted) * 100, 1),
            "avg_price_usd":   avg_price,
            "min_price_usd":   min_price,
            "max_price_usd":   max_price,
        },
        "image_check": {
            "live":            img_live,
            "dead_cleared":    img_dead,
            "no_url":          no_image - img_dead,
        },
        "category_breakdown":   dict(sorted(per_cat_counts.items(), key=lambda x: -x[1])),
        "samples_per_category": dict(samples),
    }

    json_path = f"{base}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    max_c = max(per_cat_counts.values()) if per_cat_counts else 1
    lines = [
        "=" * 64,
        f"  IMPORT REPORT  |  {run_time.strftime('%Y-%m-%d %H:%M:%S')}",
        "=" * 64,
        f"  Database     : {DB_NAME}",
        f"  Inserted     : {inserted:,} products",
        f"  TARGET       : {TARGET:,}   PER_CAT: {PER_CAT:,}",
        "",
        f"  No image     : {no_image:,}  ({report['stats']['no_image_pct']}%)",
        f"  No rating    : {no_rating:,}  ({report['stats']['no_rating_pct']}%)",
        f"  Avg price    : ${avg_price}",
        f"  Price range  : ${min_price}  -  ${max_price}",
        "",
        "── Image URL check ─────────────────────────────────────",
        f"  Live (verified) : {img_live:,}",
        f"  Dead (cleared)  : {img_dead:,}",
        f"  No URL          : {no_image - img_dead:,}",
        "",
        "── Category breakdown ──────────────────────────────────",
    ]

    for cat, count in sorted(per_cat_counts.items(), key=lambda x: -x[1]):
        bar = "#" * int(count / max_c * 30)
        lines.append(f"  {cat:35s} {bar:<30} {count:>7,}")

    lines += ["", "── Samples per category ────────────────────────────────"]
    for cat in sorted(samples):
        lines.append(f"\n  [ {cat} ]")
        for p in samples[cat]:
            img = "[IMG]" if p["has_image"] else "[NO IMG]"
            rat = f"*{p['rating']}" if p["rating"] else "no rating"
            lines.append(f"    {img:<8} {p['name'][:58]:<58} ${p['price']:<8} {rat}")
            lines.append(f"            main: {p['main_cat']}  /  sub: {p['sub_cat']}")

    txt_path = f"{base}.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nReport saved:")
    print(f"  {os.path.abspath(json_path)}")
    print(f"  {os.path.abspath(txt_path)}")


# ─── Entry point ─────────────────────────────────────────

def main():
    csv_files = list(set(
        glob.glob(os.path.join(CSV_FOLDER, "**/*.csv"), recursive=True) +
        glob.glob(os.path.join(CSV_FOLDER, "*.csv"))
    ))
    if not csv_files:
        print(f"No CSVs found in '{CSV_FOLDER}'"); return
    print(f"Found {len(csv_files)} CSV files")

    if os.path.exists(MAP_CACHE):
        print(f"\nFound cached category map: {MAP_CACHE}")
        ans = input("  Use cached map? (y = use cache / n = rescan): ").strip().lower()
        if ans == "y":
            with open(MAP_CACHE) as f:
                category_map = json.load(f)
            print(f"  Loaded {len(category_map)} mappings from cache")
        else:
            pair_counts  = phase1_scan(csv_files)
            category_map = build_category_map(pair_counts)
            with open(MAP_CACHE, "w") as f:
                json.dump(category_map, f, indent=2)
            print(f"\nMap saved to {MAP_CACHE}")
    else:
        pair_counts  = phase1_scan(csv_files)
        category_map = build_category_map(pair_counts)
        with open(MAP_CACHE, "w") as f:
            json.dump(category_map, f, indent=2)
        print(f"\nMap saved to {MAP_CACHE}")

    print(f"\nThis will DELETE all existing products and sellers in '{DB_NAME}'.")
    ans = input("  Continue with import? (y/n): ").strip().lower()
    if ans != "y":
        print("Aborted."); return

    phase2_import(csv_files, category_map)


if __name__ == "__main__":
    main()