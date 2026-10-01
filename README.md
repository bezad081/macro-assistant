# Macro Lab — Interactive Macroeconomics Teaching Assistant

نسخه وب دستیار تعاملی اقتصاد کلان، بازنویسی‌شده از نسخه Python/Streamlit به **React + TypeScript + Vite + Plotly.js**.

## هدف

این نسخه کاملاً داخل مرورگر اجرا می‌شود و backend، Python runtime، دیتابیس یا Streamlit نیاز ندارد. بنابراین برای انتشار روی GitHub Pages مناسب است و استاد فقط یک لینک باز می‌کند.

## مدل‌های موجود

1. بازار کالا و تقاطع کینزی
2. بازار پول و ترجیح نقدینگی
3. IS–LM
4. AD–AS و منحنی فیلیپس
5. اقتصاد باز / Mundell–Fleming
6. Solow
7. Taylor Rule
8. بازار کار و Okun
9. منحنی فیلیپس انتظارات‌افزوده
10. پویایی بدهی دولت
11. سازوکار انتقال سیاست پولی
12. Cross-Model Policy Lab

## اجرای محلی

```bash
npm install
npm run dev
```

سپس آدرسی که Vite نمایش می‌دهد را در مرورگر باز کنید.

## Build

```bash
npm install
npm run build
```

خروجی در پوشه `dist/` قرار می‌گیرد.

## GitHub Pages

Workflow آماده در `.github/workflows/deploy.yml` قرار دارد. بعد از merge شدن روی `main`، build و deploy به GitHub Pages انجام می‌شود.

اگر Pages برای repository فعال نیست:

1. وارد repository شوید.
2. `Settings` → `Pages`.
3. در بخش `Build and deployment`، گزینه `Source` را روی **GitHub Actions** قرار دهید.
4. workflow را از تب `Actions` اجرا کنید یا یک commit جدید روی `main` push کنید.

آدرس نهایی معمولاً به شکل زیر است:

```text
https://USERNAME.github.io/REPOSITORY/
```

## نکته درباره مدل‌ها

کالیبراسیون‌ها آموزشی هستند و تخمین تجربی یک کشور خاص محسوب نمی‌شوند. نسخه TypeScript هسته اقتصادی با خروجی Python نسخه V4 مقایسه شده است؛ baseline مدل‌های اصلی و Policy Lab از نظر عددی منطبق‌اند.
