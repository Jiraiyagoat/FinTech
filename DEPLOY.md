# Deploy to GitHub Pages

Repository used by the team: `Jiraiyagoat/FinTech`.

This site is plain HTML/CSS/JavaScript and should be deployed with **Settings → Pages → Deploy from a branch → main → /(root)**. No GitHub Actions workflow is required.

Expected public URL:

`https://jiraiyagoat.github.io/FinTech/`

After replacing website files locally:

```powershell
git add -A
git commit -m "Complete EDA website requirements"
git push origin main
```

Then wait for the Pages deployment to finish and open the public URL in a private/incognito window to verify that organizer access is not required.

## Confidentiality check before every push

The public repository should contain only website code, aggregate EDA, and anonymized example metrics. Do not commit raw competition files, original signal identifiers, the final submission vector, notebooks, model artifacts, or source rows.

```powershell
git grep -n -E "SG_[0-9]{6}"
git ls-files | Select-String -Pattern '\.(csv|parquet|zip|ipynb|pkl|joblib)$'
```

Both checks should return nothing from tracked public files.
