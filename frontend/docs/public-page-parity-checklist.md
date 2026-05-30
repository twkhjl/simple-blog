# Public Page Parity Checklist

Routes to compare:
- `/`
- `/about`
- `/contact`
- `/articles`
- `/post/first-post`

Given rewrite branch is running locally,  
When reviewer compares each route against the pre-rewrite baseline in a browser,  
Then confirm:
- header height, drawer transition, and footer spacing remain visually close
- hero spacing and card radius remain visually close
- no overlapping text, clipped buttons, or collapsed desktop layout
- mobile width `390px` shows no horizontal scroll
