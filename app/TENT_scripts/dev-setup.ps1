cd ~/git/merge_and_acq/app/web

start wt -w 0 `
  new-tab powershell -NoExit -Command "npm run dev" `
  ; split-pane powershell -NoExit -Command "npx prisma studio" `
  ; split-pane -H powershell -NoExit -Command "npx tsx scripts/test-confidence.ts"
