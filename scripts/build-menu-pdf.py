"""
Generates the TEMPORARY menu PDF at public/tropicalbytes-menu.pdf, from the
live menu data in lib/config.ts (via menu-data.json), so the PDF never
duplicates menu content by hand and can be regenerated whenever pricing or
items change.

This is intentionally simple — a clean, readable list, not the final
professionally designed menu PDF the client will replace this with later.

Workflow to regenerate after a menu/pricing change:
    npm run generate:menu-json      # exports lib/config.ts menu -> menu-data.json
    pip install reportlab --break-system-packages   # first time only
    python3 scripts/build-menu-pdf.py
"""
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib import colors

with open("menu-data.json") as f:
    data = json.load(f)

business = data["business"]
menu = data["menu"]

FOREST = colors.HexColor("#087A35")
FOREST_DARK = colors.HexColor("#075B2A")
INK = colors.HexColor("#202124")
INK_SECONDARY = colors.HexColor("#626B63")
PALE_GREEN = colors.HexColor("#EFF9E9")
DANGER = colors.HexColor("#D64545")
BROWN = colors.HexColor("#8A5A34")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("TBTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=26, textColor=FOREST_DARK, alignment=TA_CENTER, spaceAfter=4)
tagline_style = ParagraphStyle("TBTagline", parent=styles["Normal"], fontName="Helvetica", fontSize=11, textColor=INK_SECONDARY, alignment=TA_CENTER, spaceAfter=18)
section_style = ParagraphStyle("TBSection", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=15, textColor=FOREST, spaceBefore=16, spaceAfter=8)
item_style = ParagraphStyle("TBItem", parent=styles["Normal"], fontName="Helvetica", fontSize=10.5, textColor=INK)
price_style = ParagraphStyle("TBPrice", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.5, textColor=FOREST_DARK, alignment=2)
footer_style = ParagraphStyle("TBFooter", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=8.5, textColor=INK_SECONDARY, alignment=TA_CENTER, spaceBefore=20)

def veg_tag(vegetarian, category, name):
    # Desserts get their own brown category mark, kept distinct from the
    # Non-Veg red so the two don't read as "contains meat" — matches the
    # website's VegIndicator component. The menu PDF mirrors the website's
    # Menu page, including its override for the last 3 desserts (green).
    MENU_PAGE_DESSERT_OVERRIDE = {"Tropical Gudbad": True, "Arabian Gudbad": True, "Death By Chocolate": True}
    if category == "desserts" and name not in MENU_PAGE_DESSERT_OVERRIDE:
        color, label = BROWN, "DESSERT"
    elif vegetarian or (category == "desserts" and name in MENU_PAGE_DESSERT_OVERRIDE):
        color, label = FOREST, "VEG"
    else:
        color, label = DANGER, "NON-VEG"
    return f'<font color="{color.hexval()}" size="7">&#9632;</font> <font size="7" color="{INK_SECONDARY.hexval()}">{label}</font>'

doc = SimpleDocTemplate(
    "public/tropicalbytes-menu.pdf",
    pagesize=A4,
    topMargin=22 * mm,
    bottomMargin=18 * mm,
    leftMargin=20 * mm,
    rightMargin=20 * mm,
    title=f"{business['name']} Menu",
)

story = []
story.append(Paragraph(business["name"], title_style))
story.append(Paragraph("Our Menu - " + business["tagline"], tagline_style))
story.append(HRFlowable(width="100%", thickness=1, color=PALE_GREEN, spaceAfter=6))

section_titles = {"veg": "Veg Meals", "nonVeg": "Non-Veg Meals", "desserts": "Desserts"}

for key in ["veg", "nonVeg", "desserts"]:
    items = menu[key]
    story.append(Paragraph(section_titles[key], section_style))
    rows = []
    for item in items:
        name_cell = Paragraph(f"{item['name']}<br/>{veg_tag(item['vegetarian'], key, item['name'])}", item_style)
        price_cell = Paragraph(f"Rs. {item['price']}", price_style)
        rows.append([name_cell, price_cell])
    t = Table(rows, colWidths=[130 * mm, 30 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, PALE_GREEN),
    ]))
    story.append(t)

story.append(Paragraph(
    f"Prices in INR. For subscriptions, party &amp; bulk orders, or the latest menu, visit our website or contact {business['name']}.",
    footer_style,
))

doc.build(story)
print("PDF built.")
