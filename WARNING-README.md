# ⚠️ WARNING: APACHE ROUTING ISSUE ⚠️

## CRITICAL: This directory is NOT being served!

Due to an Apache configuration issue, requests to:
- `https://p0qp0q.com/alm-kawaii-quiz/`

Are actually being served from:
- `/var/www/html/alm-quiz/` (WITHOUT "kawaii")

NOT from:
- `/var/www/html/alm-kawaii-quiz/` (this directory)

## To deploy changes:

1. Make changes in this directory as normal
2. Copy files to the ACTUAL serving directory:
   ```bash
   sudo cp /var/www/html/alm-kawaii-quiz/* /var/www/html/alm-quiz/
   ```

## Files that need to be copied:
- index.html → /var/www/html/alm-quiz/index.html
- appi-modal-quiz.js → /var/www/html/alm-quiz/appi-modal-quiz.js
- styles-modal.css → /var/www/html/alm-quiz/styles-modal.css
- api.php → /var/www/html/alm-quiz/api.php
- config.php → /var/www/html/alm-quiz/config.php

## Note:
- CDN/Browser caching may delay updates
- Use cache-busting parameters (?v=X) when testing
- Last updated: 2025-06-25