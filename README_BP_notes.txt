
TEst 1

curl -X PATCH "http://localhost:3000/api/applications/4c69bc6b-71ba-4dea-8bb0-1185972e1d6e/confidence/TSA" -H "Content-Type: application/json" -d "{\"manualAdjustment\":5,\"overrideReason\":\"Confirmed with stakeholders\",\"reviewNotes\":\"Good supporting evidence\",\"assessmentStatus\":\"OVERRIDDEN\",\"reviewerName\":\"Brian\"}"

insert answer.



App IDS   
09f98e4a-ea5e-4398-91b8-e9b91c689a6e
4c69bc6b-71ba-4dea-8bb0-1185972e1d6e
3ae0cca9-776b-4fdf-8b26-6287eeef4def 


## to find app rows.
curl -X PATCH "http://localhost:3000/api/applications/REAL_APP_ID/confidence/TSA" -H "Content-Type: application/json" -d "{\"manualAdjustment\":5,\"overrideReason\":\"Confirmed with stakeholders\",\"reviewNotes\":\"Good supporting evidence\",\"assessmentStatus\":\"OVERRIDDEN\",\"reviewerName\":\"Brian\"}"
