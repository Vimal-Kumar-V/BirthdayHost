# Birthday Host

A static site that turns a name, a few photos and a wish into a birthday
celebration page: bunting, balloons, confetti, a cake with candles to blow
out, the wish card, a photo gallery and a "Happy Birthday" tune.

Live: https://vimal-kumar-v.github.io/BirthdayHost/

## Sharing a celebration

The site has no backend, so each shared celebration is a file in the repo.

1. Open the site, fill in the form and click **Download share file**.
   You get a file named after the birthday person, e.g. `priya.json`.
   Photos are resized and stored inside it.
2. Put the file in the `celebrations/` folder, commit and push.
   GitHub Pages redeploys in about a minute.
3. Send the link: `https://vimal-kumar-v.github.io/BirthdayHost/?for=priya`
   (the part after `for=` is the file name without `.json`).

To remove a celebration, delete its file and push.

Anyone who has the link (or guesses the name) can open a celebration, and
the files are visible in this public repo, so only share photos you're happy
to have public.

## Development

```
npm install
npm start       # dev server with live reload
npm run build   # production build in dist/
```

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`.
