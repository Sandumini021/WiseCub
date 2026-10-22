Classroom CSVs for the Virtual Stock Market trend models.

Keep originals here. Preprocess writes cleaned copies to `../processed/` and never overwrites these files.

S&P 500 (company bars):

- `sp500_stocks.csv`
- `sp500_companies.csv`

Global indexes (optional, large, gitignored):

- `indexData.csv`
- `indexInfo.csv`
- `indexProcessed.csv`

If index files are missing, preprocess also looks in `%USERPROFILE%\Downloads\archive\` or `WISECUB_MARKET_DATA_DIR`.
