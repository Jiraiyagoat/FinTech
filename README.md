# La pasión — Financial Signal Intelligence

Static, dependency-free website for **WIUT Hackathon 2026 · FinTech / AI in Finance**.

**Team reference:** `0388DF2D`

## Why this repository is intentionally small

The competition dataset contains ~10M transaction rows. Those raw competition files and the full 6,000-row test prediction vector are **not published** in this website repository. The public site contains aggregate research results and anonymized example signals with derived metrics only; original signal identifiers and source rows are not published.

The website is a product/presentation layer for the ML work:

- leakage-safe cutoff (`transaction_timestamp < signal_date 00:00`)
- signal-level validation
- chronological holdout
- LightGBM / CatBoost / XGBoost ensemble
- rank-based risk prioritization
- interactive anonymized signal-example explorer
- cutoff sensitivity and model-validation views

## Run locally

No package installation is required.

You can double-click `index.html`, or serve the folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Free deployment: GitHub Pages

This repo includes `.github/workflows/pages.yml`.

1. Create a **public** GitHub repository, e.g. `la-pasion-finrisk`.
2. Push this repository to `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, set **Source → GitHub Actions**.
5. The included workflow deploys the static site automatically.

Typical URL:

`https://YOUR-USERNAME.github.io/la-pasion-finrisk/`

## Team

- **Abduqaxxrov Xojiakbar** — Captain — `x.abduqaxxrov@newuu.uz`
- **Abduxakimov Abdusolih** — `a.abduxakimov@newuu.uz`
- **Abdujalilov Saidaiziz** — `s.abdujalilov@newuu.uz`

## Final validated system shown on the website

Rank ensemble:

- 25% LightGBM M0
- 40% LightGBM M4
- 25% CatBoost M4
- 10% XGBoost M0

Validation reported on the site is from the completed research pipeline:

- mean 5-fold signal-level ROC-AUC: **0.606607**
- chronological ROC-AUC: **0.631410**

The risk index is a **relative ranking score**, not a calibrated probability.

## Data / competition hygiene

`.gitignore` blocks common raw-data and model-artifact directories. Do not commit competition Parquet files or the private final submission vector into the public website repository.
