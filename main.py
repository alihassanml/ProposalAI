import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Optional

# Fix for Windows asyncio loop policy (required for subprocesses/Playwright)
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Request, Form, HTTPException, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import groq
from playwright.async_api import async_playwright

# Import the prompts from separate file
from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

load_dotenv()

app = FastAPI(title="ProposalAI")

# Setup paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_path = os.path.join(BASE_DIR, "templates", "static")

# Mount static files for CSS
if not os.path.exists(static_path):
    os.makedirs(static_path)
app.mount("/static", StaticFiles(directory=static_path), name="static")

templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Groq Client
client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

# Default Branding
DEFAULT_NAME = "Ali Hassan"
DEFAULT_EMAIL = "alihassanbscs99@gmail.com"
DEFAULT_COMPANY = "Software Engineer & AI Expert"

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/generate")
async def generate_proposal(
    request: Request,
    requirements: str = Form(...),
    github_url: str = Form(...),
):
    user_prompt = USER_PROMPT_TEMPLATE.format(
        requirements=requirements,
        github_url=github_url
    )

    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3-32b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        content = json.loads(completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Generate PDF using Playwright
    pdf_bytes = await render_pdf(content, {
        "name": DEFAULT_NAME,
        "email": DEFAULT_EMAIL,
        "company": DEFAULT_COMPANY,
        "date": datetime.now().strftime("%B %d, %Y"),
    })

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=proposal_{DEFAULT_NAME.replace(' ', '_').lower()}.pdf"}
    )


async def render_pdf(content: dict, branding: dict) -> bytes:
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: 'Plus Jakarta Sans', sans-serif;
                background: #fff;
                color: #1e293b;
                line-height: 1.6;
            }}
            @page {{ size: A4; margin: 0; }}

            /* ─── LEFT BORDER DECORATION ─── */
            .page-wrapper {{
                position: relative;
                width: 210mm;
                min-height: 297mm;
                overflow: hidden;
            }}
            .left-border {{
                position: absolute;
                top: 0;
                left: 0;
                width: 10px;
                height: 100%;
                background: linear-gradient(180deg, #2dd4bf 0%, #818cf8 50%, #2dd4bf 100%);
                z-index: 100;
            }}
            .left-border-dots {{
                position: absolute;
                top: 0;
                left: 18px;
                width: 3px;
                height: 100%;
                background: repeating-linear-gradient(
                    to bottom,
                    #2dd4bf44 0px,
                    #2dd4bf44 4px,
                    transparent 4px,
                    transparent 10px
                );
                z-index: 100;
            }}

            /* ─── COVER PAGE ─── */
            .cover {{
                width: 210mm;
                height: 297mm;
                background: linear-gradient(145deg, #0a0f1e 0%, #0f172a 60%, #0c1a2e 100%);
                color: #fff;
                padding: 60px 60px 60px 80px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                page-break-after: always;
                position: relative;
                overflow: hidden;
                text-align: center;
            }}

            /* Decorative hexagons */
            .cover-hex-1 {{
                position: absolute;
                top: -40px;
                left: 60px;
                width: 160px;
                height: 160px;
                background: linear-gradient(135deg, #2dd4bf22, #818cf822);
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            }}
            .cover-hex-2 {{
                position: absolute;
                top: 80px;
                left: 30px;
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, #2dd4bf15, #818cf815);
                clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                border: 1px solid #2dd4bf30;
            }}

            .cover-left-bar {{
                position: absolute;
                top: 0;
                left: 0;
                width: 10px;
                height: 100%;
                background: linear-gradient(180deg, #2dd4bf 0%, #818cf8 50%, #2dd4bf 100%);
                z-index: 100;
            }}

            .cover-badge {{
                display: inline-block;
                padding: 5px 14px;
                border: 1px solid #2dd4bf50;
                background: #2dd4bf12;
                color: #2dd4bf;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                border-radius: 20px;
                margin-bottom: 28px;
                width: fit-content;
                margin-left: auto;
                margin-right: auto;
            }}

            .cover-title {{
                font-size: 52px;
                font-weight: 800;
                line-height: 1.1;
                letter-spacing: -1px;
                margin-bottom: 20px;
                color: #fff;
            }}
            .cover-title .teal {{ color: #2dd4bf; }}

            .cover-subtitle {{
                color: #94a3b8;
                font-size: 14px;
                font-weight: 300;
                letter-spacing: 0.04em;
                max-width: 600px;
                line-height: 1.6;
                margin-bottom: 0;
                margin-left: auto;
                margin-right: auto;
            }}

            .cover-divider {{
                width: 60px;
                height: 3px;
                background: linear-gradient(90deg, #2dd4bf, #818cf8);
                margin: 24px auto;
                border-radius: 2px;
            }}

            .cover-meta-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 32px;
                text-align: left;
            }}
            .cover-meta-label {{
                font-size: 8px;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #475569;
                margin-bottom: 6px;
            }}
            .cover-meta-value {{
                font-size: 18px;
                font-weight: 700;
                color: #f1f5f9;
            }}
            .cover-meta-sub {{
                font-size: 11px;
                color: #64748b;
                margin-top: 2px;
            }}

            .cover-footer {{
                border-top: 1px solid #1e293b;
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}
            .cover-footer-email {{ color: #64748b; font-size: 11px; font-weight: 500; }}
            .cover-footer-brand {{ color: #2dd4bf; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; }}

            /* ─── CONTENT PAGE ─── */
            .content-page {{
                width: 210mm;
                min-height: 297mm;
                padding: 60px 60px 60px 80px;
                background: #fff;
                position: relative;
            }}

            .page-header {{
                padding-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
                margin-bottom: 40px;
            }}
            .page-header-title {{
                font-size: 28px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: -0.5px;
            }}
            .page-header-title span {{ color: #2dd4bf; }}

            .section-title {{
                font-size: 14px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #0f172a;
                margin: 32px 0 16px 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }}
            .section-title::after {{
                content: '';
                flex-grow: 1;
                height: 1px;
                background: #e2e8f0;
            }}

            .text-block {{
                font-size: 13px;
                color: #475569;
                margin-bottom: 20px;
                text-align: justify;
            }}

            .step-list {{ list-style: none; margin-bottom: 24px; }}
            .step-item {{
                margin-bottom: 18px;
                padding-left: 20px;
                border-left: 2px solid #2dd4bf;
            }}
            .step-title {{
                font-size: 13px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 4px;
            }}
            .step-detail {{
                font-size: 12.5px;
                color: #64748b;
            }}

            .questions-list {{
                background: #f8fafc;
                padding: 24px;
                border-left: 4px solid #818cf8;
                margin: 28px 0;
            }}
            .question-item {{
                font-size: 13px;
                color: #334155;
                font-weight: 600;
                margin-bottom: 10px;
                list-style: none;
            }}
            .question-item::before {{
                content: '?';
                display: inline-block;
                width: 20px;
                color: #818cf8;
                font-weight: 800;
            }}

            .digital-links {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #f1f5f9;
            }}
            .link-item {{
                font-size: 12px;
                color: #64748b;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .link-item a {{ color: #2dd4bf; text-decoration: none; font-weight: 600; }}

            .footer {{
                position: absolute;
                bottom: 40px;
                left: 60px;
                right: 80px;
                font-size: 10px;
                color: #cbd5e1;
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #f8fafc;
                padding-top: 10px;
            }}

            .mb-20 {{ margin-bottom: 20px; }}
            .mb-28 {{ margin-bottom: 28px; }}
        </style>
    </head>
    <body>

        <!-- ══════════════════ COVER PAGE ══════════════════ -->
        <div class="cover">
            <div class="cover-hex-1"></div>
            <div class="cover-hex-2"></div>
            <div class="cover-left-bar"></div>
            
            <div style="position:relative;z-index:10; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
                <div class="cover-badge">Project Proposal</div>
                <div class="cover-title">
                    {content.get('title', 'Professional Proposal')}
                </div>
                <div class="cover-divider"></div>
                <div class="cover-subtitle">
                    A technical and production-ready approach tailored for your specific business requirements.
                </div>
            </div>

            <div style="position:relative;z-index:10;">
                <div class="cover-meta-grid">
                    <div>
                        <div class="cover-meta-label">Expert Consultant</div>
                        <div class="cover-meta-value">{branding['name']}</div>
                        <div class="cover-meta-sub">{branding['company']}</div>
                    </div>
                    <div>
                        <div class="cover-meta-label">Date Issued</div>
                        <div class="cover-meta-value">{branding['date']}</div>
                    </div>
                </div>
                <div class="cover-footer">
                    <div class="cover-footer-email">{branding['email']}</div>
                    <div class="cover-footer-brand">ProposalAI · 2026 Series</div>
                </div>
            </div>
        </div>

        <!-- ══════════════════ CONTENT PAGE ══════════════════ -->
        <div class="page-wrapper">
            <div class="left-border"></div>
            <div class="content-page">

                <div class="page-header">
                    <div class="page-header-title">Technical <span>Solution</span></div>
                </div>

                <div class="text-block" style="font-weight: 600; color: #1e293b;">
                    {content.get('opening', '')}
                </div>

                <div class="section-title">Understanding the Challenge</div>
                <div class="text-block">
                    {content.get('problem_analysis', '')}
                </div>

                <div class="section-title">Step-by-Step Implementation</div>
                <div class="step-list">
                    {"".join([
                        f'<div class="step-item"><div class="step-title">{s.get("step","")}</div><div class="step-detail">{s.get("detail","")}</div></div>'
                        for s in content.get('implementation_plan', [])
                    ])}
                </div>

                <div class="section-title">Why I’m a Strong Fit</div>
                <div class="text-block">
                    {content.get('why_fit', '')}
                </div>

                <div class="questions-list">
                    {"".join([
                        f'<div class="question-item">{q}</div>'
                        for q in content.get('questions', [])
                    ])}
                </div>

                <div class="section-title">Next Steps & Availability</div>
                <div class="text-block">
                    {content.get('closing', '')}
                </div>

                <div class="digital-links">
                    <div class="link-item"><span>💻</span> GitHub: <a href="https://github.com/alihassanml/">github.com/alihassanml</a></div>
                    <div class="link-item"><span>🔗</span> LinkedIn: <a href="https://www.linkedin.com/in/alihassanml/">linkedin.com/in/alihassanml</a></div>
                    <div class="link-item"><span>🌐</span> Website: <a href="https://alihassanml.vercel.app/">alihassanml.vercel.app</a></div>
                </div>

                <div class="footer">
                    <div>{branding['name']} · Technical Proposal</div>
                    <div>Page 2</div>
                </div>

            </div>
        </div>

    </body>
    </html>
    """

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html_template)
        await page.wait_for_load_state("networkidle")
        pdf = await page.pdf(format="A4", print_background=True)
        await browser.close()
        return pdf


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)