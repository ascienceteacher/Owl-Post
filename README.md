# Owl Post — GitHub Direct App

Owl Post now runs visually from GitHub Pages while Google Apps Script quietly handles:

- student roster authentication
- student submissions
- teacher authentication
- the approval queue
- sending approved parent emails
- updating the Pending and Sent sheets

The browser address remains the GitHub Pages address rather than changing to Google Apps Script.

## GitHub Pages address

`https://ascienceteacher.github.io/Owl-Post/`

## Connected Apps Script deployment

`https://script.google.com/macros/s/AKfycbyAYu8RHymRVFQ8LXakudtlPU0betyoXiXf5suPTrhMDW9Z_CeYbp8jmpzVwyjQPzdA/exec`

## Files uploaded to GitHub

- `index.html`
- `owl-post-rowlie.png`
- `.nojekyll`
- `README.md`

Do not upload `Code.gs` to the public GitHub repository because it contains the private spreadsheet/backend logic.

## Required Apps Script deployment

Deploy the Apps Script web app as:

- Execute as: **Me**
- Who has access: the same access setting currently used by the working Owl Post deployment

After replacing `Code.gs`, edit the existing deployment and select **New version**. Keeping the existing deployment preserves the API URL already written into `index.html`.
