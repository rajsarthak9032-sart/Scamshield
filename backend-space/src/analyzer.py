import re


URL_RE = re.compile(r"https?://[^\s'\"<>)\]]+", re.IGNORECASE)
BARE_URL_RE = re.compile(
    r"\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|uk|us|info|xyz|ru|cn|link|click|top|shop|app|live|online|vip)\b/?[^\s'\"<>)\]]*",
    re.IGNORECASE,
)
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d[\d\s().\-]{7,}\d)")

SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    "t.co",
    "ow.ly",
    "cutt.ly",
    "rb.gy",
    "is.gd",
    "buff.ly",
    "shorturl.at",
    "rebrand.ly",
    "tiny.cc",
    "clk.sh",
    "su.do",
}

BRANDS = [
    "paypal",
    "apple",
    "google",
    "microsoft",
    "amazon",
    "netflix",
    "bank of america",
    "wells fargo",
    "chase",
    "citibank",
    "hsbc",
    "barclays",
    "irs",
    "hmrc",
    "fedex",
    "ups",
    "dhl",
    "usps",
    "royal mail",
    "customs",
    "coinbase",
    "binance",
    "whatsapp",
    "instagram",
    "facebook",
    "linkedin",
    "tiktok",
    "santander",
    "natwest",
    "ocbc",
    "maybank",
]

# (type, name, regex, severity, dna_key, description)
PATTERN_RULES = [
    ("urgency_language", "Urgency language", re.compile(
        r"\b(act now|urgent|immediately|asap|right away|now|today only|last chance|"
        r"final notice|deadline|hurry|before it's too late|within 24 hours|expires? (today|soon)|"
        r"limited time|don'?t (wait|delay))\b", re.IGNORECASE), "high", "urgency",
     "The message pressures you to act quickly, which reduces time to verify."),
    ("threat_closure", "Account closure threat", re.compile(
        r"\b(account (will be|is being)? ?(closed|suspended|locked|blocked|deactivated|disabled|"
        r"terminated)|suspend(ed)?|deactivat(ed)?|your (card|account) (has been )?blocked)\b",
        re.IGNORECASE), "high", "impersonation",
     "The message threatens to close or lock your account to create fear."),
    ("credential_request", "Credential request", re.compile(
        r"\b(enter your (password|login)|verify your (password|identity|account)|"
        r"log ?in to (confirm|verify)|confirm your (password|details)|sign ?in (now|here)|"
        r"update your (password|account|details))\b", re.IGNORECASE), "high", "credential_request",
     "The message asks for your password or login details, which legitimate companies rarely do."),
    ("verification_code", "Verification code request", re.compile(
        r"\b(verification code|one[- ]?time (code|password)|otp|2fa|two[- ]factor)\b",
        re.IGNORECASE), "medium", "credential_request",
     "The message references a code, attempting to get it from you or trick you into sharing it."),
    ("payment_request", "Payment request", re.compile(
        r"\b(send (money|payment|the fee)|wire (money|transfer)|make a (payment|transfer)|"
        r"pay (the|your) (fee|invoice|fine|balance)|transfer (funds|money)|settlement|"
        r"outstanding (balance|invoice))\b", re.IGNORECASE), "high", "payment_request",
     "The message directly requests a payment or money transfer."),
    ("gift_card", "Gift-card request", re.compile(
        r"\b(gift ?card|amazon card|itunes card|google play card|steam card|ebay card|"
        r"redeem (a )?card|card (number|pin))\b", re.IGNORECASE), "high", "payment_request",
     "Gift cards are a common scam payment method because they are hard to reverse."),
    ("crypto_request", "Cryptocurrency request", re.compile(
        r"\b(bitcoin|btc|ethereum|eth|usdt|tether|crypto(?:currency)?|wallet address|"
        r"blockchain)\b", re.IGNORECASE), "high", "payment_request",
     "The message references cryptocurrency, a frequent scam payment channel."),
    ("personal_info", "Personal information request", re.compile(
        r"\b(social security|ssn|date of birth|passport|driver'?s licen[sc]e|bank account number|"
        r"sort code|routing number|national insurance)\b", re.IGNORECASE), "high", "credential_request",
     "The message asks for sensitive identity or financial details."),
    ("prize_language", "Prize / lottery language", re.compile(
        r"\b(you (have )?won|congratulations|winner|lottery|prize|sweepstakes|claim your (reward|prize)|"
        r"selected (to receive|as the)|reward (is|of))\b", re.IGNORECASE), "medium", "social_engineering",
     "Unexpected prize or lottery wins are a classic manipulation tactic."),
    ("job_offer", "Fake job-offer language", re.compile(
        r"\b(job offer|employment offer|work from home|part[- ]time (job|role)|earn (up to|money)|"
        r"hiring (now|immediately)|remote position|training fee|onboarding (fee|payment)|recruit(ing|ment)?)\b",
        re.IGNORECASE), "medium", "social_engineering",
     "Unsolicited job offers that ask for fees or personal data are often scams."),
    ("delivery_language", "Delivery / package language", re.compile(
        r"\b(package|parcel|shipment|delivery|couriers?|shipping|tracking (number|id)?|"
        r"post office|customs (fee|charge)|missed delivery)\b", re.IGNORECASE), "medium", "impersonation",
     "Delivery-themed messages impersonate carriers to create believable panic."),
    ("impersonation", "Brand / authority impersonation", re.compile(
        r"\b(" + "|".join(re.escape(b) for b in BRANDS) + r")\b", re.IGNORECASE), "high", "impersonation",
     "The message name-drops a known brand or authority to appear legitimate."),
    ("social_engineering", "Social-engineering language", re.compile(
        r"\b(trust me|help me|friends? (and family|only)|keep (this )?confidential|don'?t tell|"
        r"act fast|for your safety|secure your account)\b", re.IGNORECASE), "medium", "social_engineering",
     "The message tries to build false trust or pressure secrecy."),
]


def _extract_links(text):
    links = []
    for m in URL_RE.finditer(text):
        links.append(m.group(0).rstrip(".,;"))
    for m in BARE_URL_RE.finditer(text):
        candidate = m.group(0).rstrip(".,;")
        if candidate not in links:
            links.append(candidate)
    # Deduplicate, dropping links that are substrings of an already-captured link
    # (e.g. a bare domain inside a full http(s) URL).
    ordered = sorted(set(links), key=len, reverse=True)
    out = []
    for l in ordered:
        if not any(l != kept and l in kept for kept in out):
            out.append(l)
    return out


def _check_shortened(links):
    found = []
    for l in links:
        host = re.sub(r"^https?://", "", l).split("/")[0].lower()
        if host in SHORTENERS:
            found.append(l)
    return found


def deterministic_analysis(text):
    findings = []
    seen_types = set()

    links = _extract_links(text)
    shortened = _check_shortened(links)

    emails = EMAIL_RE.findall(text)
    phones = [p.group(0).strip() for p in PHONE_RE.finditer(text)]
    phones = [p for p in phones if len(re.sub(r"\D", "", p)) >= 8]

    for rule in PATTERN_RULES:
        ftype, name, rgx, severity, dna_key, desc = rule
        m = rgx.search(text)
        if m:
            # For impersonation, show the matched brand as evidence.
            evidence = m.group(0).strip()
            findings.append(
                {
                    "type": ftype,
                    "name": name,
                    "evidence": evidence,
                    "description": desc,
                    "severity": severity,
                    "dna": dna_key,
                }
            )
            seen_types.add(ftype)

    if emails:
        findings.append(
            {
                "type": "email_address",
                "name": "Email address found",
                "evidence": emails[0],
                "description": "An email address appears in the message and may be used to contact or impersonate you.",
                "severity": "low",
                "dna": "social_engineering",
            }
        )
    if phones:
        findings.append(
            {
                "type": "phone_number",
                "name": "Phone number found",
                "evidence": phones[0],
                "description": "A phone number appears in the message. Verify it through official channels before calling.",
                "severity": "low",
                "dna": "social_engineering",
            }
        )
    if links:
        findings.append(
            {
                "type": "suspicious_link",
                "name": "Link detected",
                "evidence": links[0],
                "description": "The message contains a link. Do not open unexpected links; verify the sender first.",
                "severity": "medium" if len(links) == 1 else "high",
                "dna": "suspicious_link",
            }
        )
    if shortened:
        findings.append(
            {
                "type": "shortened_url",
                "name": "Shortened URL detected",
                "evidence": shortened[0],
                "description": "Shortened URLs hide the real destination and are common in scams.",
                "severity": "medium",
                "dna": "suspicious_link",
            }
        )

    return {
        "links": links,
        "emails": emails,
        "phones": phones,
        "shortened": shortened,
        "findings": findings,
    }
