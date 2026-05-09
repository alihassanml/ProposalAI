"""
Google Maps two-step scraper.
  1. Scroll the search feed and collect listing cards  (scrape.js)
  2. Visit each business page to extract phone/website/email/address  (detail.js)
"""

import os
from concurrent.futures import ThreadPoolExecutor
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

_HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(_HERE, "scrape.js"), encoding="utf-8") as f:
    SCRAPE_JS = f.read()

with open(os.path.join(_HERE, "detail.js"), encoding="utf-8") as f:
    DETAIL_JS = f.read()

_executor = ThreadPoolExecutor(max_workers=2)


def _sync_scrape(query: str, max_results: int, progress_cb=None) -> list:
    def _log(msg: str):
        if progress_cb:
            progress_cb(msg)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-infobars",
                "--ignore-certificate-errors",
            ],
        )
        context = browser.new_context(
            locale="en-US",
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            java_script_enabled=True,
            ignore_https_errors=True,
        )
        # Hide webdriver flag so Google doesn't detect automation
        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        page = context.new_page()

        # ── Step 1: Search results feed ──
        url = "https://www.google.com/maps/search/" + query.replace(" ", "+")
        _log(f'Searching Google Maps for "{query}"…')
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        feed_sel = 'div[role="feed"]'
        try:
            page.wait_for_selector(feed_sel, timeout=10000)
            scroll_rounds = max(6, max_results // 3)
            for _ in range(scroll_rounds):
                page.eval_on_selector(feed_sel, "el => el.scrollBy(0, 800)")
                page.wait_for_timeout(600)
        except PWTimeout:
            _log("Feed not found, trying anyway…")

        link_sel = 'a[href^="https://www.google.com/maps/place"]'
        try:
            page.wait_for_selector(link_sel, timeout=12000)
        except PWTimeout:
            _log("No listings found")
            browser.close()
            return []

        cards = page.evaluate(SCRAPE_JS, max_results)
        cards = [c for c in cards if c.get("title")]
        _log(f"Found {len(cards)} listings — loading details…")

        # ── Step 2: Visit each business page ──
        results = []
        for i, card in enumerate(cards):
            href = card.get("href", "")
            if not href:
                results.append({**card, "address": "", "phone": "", "website": "", "email": ""})
                continue

            _log(f"{i+1}/{len(cards)}: {card.get('title', '')}")
            try:
                page.goto(href, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(2000)
                try:
                    page.wait_for_selector("[data-item-id]", timeout=8000)
                except PWTimeout:
                    pass
                detail = page.evaluate(DETAIL_JS)
                if not detail or not isinstance(detail, dict):
                    detail = {}
            except Exception as e:
                _log(f"Detail error for {card.get('title', '')}: {e}")
                detail = {}

            results.append({
                "title":       card.get("title", ""),
                "rating":      card.get("rating", ""),
                "reviewCount": card.get("reviewCount", ""),
                "industry":    card.get("industry", ""),
                "address":     (detail or {}).get("address") or "",
                "phone":       (detail or {}).get("phone")   or "",
                "website":     (detail or {}).get("website") or "",
                "email":       (detail or {}).get("email")   or "",
                "href":        href,
            })
            page.wait_for_timeout(800)

        browser.close()
        _log(f"Done — {len(results)} results scraped")
        return results


def scrape_google_maps(query: str, max_results: int, progress_cb=None) -> list:
    """Sync — called from main.py via run_in_executor (already in a thread)."""
    return _sync_scrape(query, max_results, progress_cb=progress_cb)
