# Birthday Host

A static site that turns a name, a few photos and a wish into a birthday
celebration page: bunting, balloons, confetti, a cake with candles to blow
out, the wish card, a photo gallery and a "Happy Birthday" tune.

Live: https://vimal-kumar-v.github.io/BirthdayHost/

## Sharing a celebration

The site has no backend. Each shared celebration is a folder in this repo:

```
celebrations/
  k7m2x9qad4/
    celebration.json   name, age, wish, from, and the photo file names
    photo-1.jpg
    photo-2.jpg
```

1. Open the site, fill in the form and click **Publish & get link**.
2. The first time, paste a GitHub token (see below). The page commits the
   photos (resized to at most 1600px) and `celebration.json` to
   `celebrations/<random-code>/` in one commit.
3. Copy the link it shows, e.g.
   `https://vimal-kumar-v.github.io/BirthdayHost/?for=k7m2x9qad4`.
   GitHub Pages redeploys in about a minute and the page tells you when the
   link is live.

To remove a celebration, delete its folder and push.

**Without a token:** use **Download as zip instead**, unzip it inside
`celebrations/`, then commit and push yourself.

### GitHub token

Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new)
with **Repository access → Only select repositories → BirthdayHost** and
**Permissions → Contents → Read and write**. It can't touch anything else.

The token is never part of the site's code. It's kept in your browser only:
for the current tab by default, or on the device if you tick "Remember".
Anyone without a token can view celebrations but can't publish.

### Privacy

The repo is public, so published photos can be seen on GitHub. The random
ending on each link stops people guessing links, but anyone you send a link
to can pass it on.

## Development

```
npm install
npm start       # dev server with live reload
npm run build   # production build in dist/
```

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`.
