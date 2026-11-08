# IKBLife

International Klein Blue Life: a tower defense game with 40 levels and a level editor, built with TypeScript and Phaser 2.

Live at https://ikblife-bd51a.firebaseapp.com

## Develop

Needs Node 20 or newer.

```sh
npm install
npm start          # builds to public/built and serves public/ on http://localhost:8080
npm run typecheck  # tsc --noEmit
```

The app reads its Firebase web config from `/__/firebase/init.json`, which Firebase Hosting serves automatically. The plain dev server doesn't have that URL, so for a local run against the real backend use `npx firebase serve --only hosting` after `npm run build`.

## Deploy

```sh
npm run deploy     # build + firebase deploy (needs `firebase login` and the project's .firebaserc/firebase.json)
```

## Stack

- esbuild bundles `src/main.ts` into `public/built/app.js`
- Dart Sass compiles `styles/main.scss` (Bourbon 4 from npm; Bitters and Neat are vendored in `styles/vendor`)
- Phaser 2.6.2 is copied to `public/built/lib.js` and used as a global
- Firebase 13 (compat API) for auth and the Realtime Database
