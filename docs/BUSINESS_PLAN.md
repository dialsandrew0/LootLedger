# LootLedger: Market Research & Business Plan

## 1. Executive Summary
LootLedger is a B2B SaaS tool designed specifically for the $42 Billion second-hand and resale market. By utilizing multimodal AI (Gemini 2.5 Flash), it compresses a reseller's 10-minute research process into a 15-second scan, calculating live comps, marketplace fees, and shipping costs to generate an immediate "BUY" or "PASS" signal.

## 2. Market Research & Problem Identification
**The Niche:** Thrift sourcers, estate sale liquidators, antique dealers, and pawn shop owners.
**The Problem:** 
- Time is money. While standing in a Goodwill or estate sale, a reseller finds an obscure item (e.g., unsigned Murano glass or a vintage Sony Walkman).
- They currently use Google Lens, which only identifies the item.
- They must then manually switch to eBay, filter by "Sold Items", mentally calculate the 13.25% eBay fee, estimate shipping weights, and figure out their true net profit to decide if the $15 asking price is worth it.
**The Solution:** LootLedger does this entirely through a single photo upload.

## 3. Monetization Strategy (Freemium SaaS)
We employ a usage-based tiering system to hook users and convert high-volume power sellers.

### Tier 1: The Hobbyist (Free)
- **Features:** 15 scans per month. Basic visual identification and high/low valuation. No inventory saving.
- **Goal:** Act as a viral lead magnet. Let them experience the "magic" of a 15-second appraisal.

### Tier 2: Pro Sourcer ($14.99 / month)
- **Features:** Unlimited AI scans, Profit Assumptions Editor (custom tax, shipping, fee percentages), Listing Draft Generation (copy-to-clipboard for cross-posting), and full access to the Trapped Capital/Inventory analytics dashboard.
- **ROI Justification:** If this app prevents a reseller from buying ONE bad $15 item per month, or helps them discover ONE hidden $50 gem they would have ignored, it pays for itself instantly.

### Tier 3: Liquidation Enterprise ($49.99 / month)
- **Features:** Multi-user authentication (for virtual assistants), CSV exports for accounting software (Quickbooks/Xero), batch scanning.

## 4. Go-To-Market (GTM) Strategy
The reselling niche has a massive, highly engaged community on TikTok, Instagram Reels, and YouTube Shorts (Search: #ThriftHaul, #ResellerCommunity, #Bolo).

**Execution:**
1. **POV Sourcing Videos:** Record first-person perspective videos in thrift stores. Show the physical item on the shelf with a $5 price tag.
2. **The "Scan":** Show the LootLedger app scanning the item in real-time.
3. **The Reveal:** Show LootLedger identifying the item as a $120 vintage piece and calculating a $95 net profit.
4. **Call to Action (CTA):** "Link in bio to get the LootLedger app."
These videos are highly viral because they trigger the "treasure hunt" dopamine loop.

## 5. Unit Economics
- **API Cost (Gemini 2.5 Flash):** ~$0.0001 per multimodal request (Image + Text).
- **Hosting (Cloud Run + Firebase):** Scale-to-zero infrastructure means you pay pennies until you hit thousands of daily active users.
- **Profit Margin on $15/mo Sub:** > 99%. 
