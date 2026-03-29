# Merge\_and\_ACQ – Confidence Grading Model Spec

## Document Purpose

This document is a canvas-ready implementation spec for the **Confidence Grading** feature in Merge\_and\_ACQ. It is intended to guide product design, data modeling, service-layer implementation, and UI/dashboard rollout.

---

## 1. Feature Summary

### Objective

Add a Confidence Grading capability that assigns a score from **0–100** representing confidence in the disposition of each application.

The feature should evaluate confidence across two decision horizons:

- **TSA Confidence**
- **Long-term Confidence**

These scores should represent **decision confidence**, not application importance, risk, or urgency.

### Core principle

The score should answer:

> **How confident are we that this application’s recorded disposition is the right one, based on current evidence, ownership, and alignment?**

---

## 2. Business Intent

Confidence Grading should help the team:

- distinguish early directional assessments from decision-grade dispositions
- identify applications with weak evidence or incomplete alignment
- expose where business or technical sign-off is missing
- support better prioritization of analysis and stakeholder engagement
- create a more explainable and auditable disposition process

This feature should eventually function as both:

- a **decision quality signal**
- a **portfolio work queue driver**

---

## 3. Scope for v1

### In scope

- two primary scores per application: TSA and Long-term
- deterministic weighted scoring model
- factor-by-factor breakdown
- calculated score plus optional analyst adjustment
- confidence bands (Low / Medium / High)
- score display on application detail page
- score display on application list page
- API support for read and recalculate actions
- data model support for explainability and future evolution

### Out of scope for v1

- full scoring history over time
- full approval workflow engine
- complex evidence linking model
- score trend charts
- automated score decay logic
- advanced portfolio analytics beyond summary/dashboard basics

---

## 4. Horizon Model

### Why two scores

Confidence should not be modeled as a single number.

An application may have:

- **high TSA confidence** because the transitional disposition is obvious and operationally clear
- **lower long-term confidence** because the future-state platform or strategic target remains uncertain

### v1 decision

Use **two primary scores only**:

- `TSA`
- `LONG_TERM`

Optional overall confidence can be considered later, but it should not be the primary design anchor in v1.

---

## 5. Confidence Bands

### Numeric scale

- **0–39** = Low
- **40–69** = Medium
- **70–100** = High

### UI intent

- Low = red
- Medium = amber
- High = green

These bands should appear alongside numeric scores in the UI.

---

## 6. Scoring Model Overview

Each horizon should be built from weighted factor groups.

### Factor groups

1. **Disposition Definition**
2. **Evidence Quality**
3. **Business Alignment**
4. **Technical Alignment**
5. **Execution Readiness**
6. **Stability / Consistency**

Each factor produces a raw score from **0–100**. The weighted factor scores sum to the horizon’s calculated score.

---

## 7. Weighting Model

### 7.1 TSA weights

| Factor                  | Weight % |
| ----------------------- | -------- |
| Disposition Definition  | 20       |
| Evidence Quality        | 20       |
| Business Alignment      | 20       |
| Technical Alignment     | 20       |
| Execution Readiness     | 15       |
| Stability / Consistency | 5        |

### 7.2 Long-term weights

| Factor                  | Weight % |
| ----------------------- | -------- |
| Disposition Definition  | 15       |
| Evidence Quality        | 20       |
| Business Alignment      | 20       |
| Technical Alignment     | 25       |
| Execution Readiness     | 10       |
| Stability / Consistency | 10       |

### Design rationale

- TSA confidence is slightly more execution-oriented and balanced across alignment dimensions.
- Long-term confidence is more dependent on technical validation and future-state consistency.

---

## 8. Raw Factor Scoring Rules

## 8.1 Disposition Definition

### TSA

| Rule                                         | Points |
| -------------------------------------------- | ------ |
| TSA disposition selected                     | 35     |
| TSA rationale documented                     | 25     |
| TSA target date documented                   | 15     |
| TSA target platform documented if applicable | 15     |
| TSA disposition is not TBD / Unknown         | 10     |

### Long-term

| Rule                                               | Points |
| -------------------------------------------------- | ------ |
| Long-term disposition selected                     | 35     |
| Long-term rationale documented                     | 25     |
| Long-term target date documented                   | 10     |
| Long-term target platform documented if applicable | 20     |
| Long-term disposition is not TBD / Unknown         | 10     |

### Notes

- If a field is genuinely not applicable, the engine should avoid unfair penalty.
- In v1, that can be handled through rule applicability logic in the service layer.

---

## 8.2 Evidence Quality

| Rule                                                   | Points |
| ------------------------------------------------------ | ------ |
| Initial analysis note exists                           | 20     |
| At least one meaningful note exists beyond boilerplate | 20     |
| Candidate apps documented where relevant               | 20     |
| Dependencies / assumptions documented                  | 20     |
| Review date exists and is current enough               | 20     |

### v1 implementation note

Some of these may be approximated using existing notes and structured fields until dedicated entities exist.

---

## 8.3 Business Alignment

| Rule                             | Points |
| -------------------------------- | ------ |
| Business owner assigned          | 25     |
| Business decision owner assigned | 25     |
| Business review completed        | 25     |
| Business sign-off recorded       | 25     |

### v1 implementation note

If a formal sign-off entity does not yet exist, add explicit status fields and score against those.

---

## 8.4 Technical Alignment

| Rule                              | Points |
| --------------------------------- | ------ |
| Technical owner assigned          | 25     |
| Technical decision owner assigned | 25     |
| Technical feasibility assessed    | 25     |
| Technical sign-off recorded       | 25     |

### v1 implementation note

As with business alignment, explicit technical review and sign-off status fields are sufficient for v1.

---

## 8.5 Execution Readiness

### TSA

| Rule                                       | Points |
| ------------------------------------------ | ------ |
| TSA target date exists                     | 30     |
| TSA status is not Not Started / Unknown    | 20     |
| TSA disposition is actionable              | 20     |
| TSA blockers / open issues documented      | 15     |
| TSA target platform documented if relevant | 15     |

### Long-term

| Rule                                            | Points |
| ----------------------------------------------- | ------ |
| Long-term target date exists                    | 20     |
| Long-term target platform exists where relevant | 30     |
| Long-term status reflects progression           | 20     |
| Dependencies / blockers documented              | 15     |
| Transition path or destination is defined       | 15     |

---

## 8.6 Stability / Consistency

| Rule                                              | Points |
| ------------------------------------------------- | ------ |
| No conflicting disposition data                   | 30     |
| No major unresolved contradictions in notes       | 20     |
| Disposition has not recently churned repeatedly   | 20     |
| Required related fields are internally consistent | 30     |

### v1 implementation note

This can begin with simple consistency checks and evolve later into a richer change-history-based measure.

---

## 9. Scoring Formula

### Weighted factor score

`weightedFactorScore = rawFactorScore * factorWeight / 100`

### Calculated horizon score

`calculatedScore = sum(weightedFactorScores)`

### Final score

`finalScore = clamp(calculatedScore + manualAdjustment, 0, 100)`

### Rounding

- Round calculated score to nearest integer for display and storage
- Preserve fractional weighted scores internally if useful during calculation, but store final rounded score as integer

---

## 10. Manual Adjustment Model

### v1 recommendation

Use **system-calculated score plus optional analyst adjustment**.

### Rules

- adjustment range should be limited to **-20 to +20**
- reason should be required when adjustment is non-zero
- calculated score should remain visible
- final score should always be derived, not free-typed
- reviewer and timestamp should be stored

### Why this approach

This preserves:

- objectivity and comparability
- analyst judgment when structured data lags reality
- auditability and trust

---

## 11. Staleness Model

### v1 recommendation

Do not reduce the score automatically. Instead, flag the assessment as stale.

### Suggested rule

Mark confidence as stale if not reviewed within **90 days**.

### UI treatment

Show a stale indicator on:

- application detail page
- list page
- dashboard summary or work queue

---

## 12. Data Model Design

## 12.1 Core recommendation

Use dedicated entities for confidence, rather than only storing fields directly on `Application`.

### Recommended entities

- `ConfidenceAssessment`
- `ConfidenceFactorScore`

This provides:

- clean separation of concern
- explainability
- easier versioning
- future support for score history and richer evidence

---

## 12.2 Entity: ConfidenceAssessment

### Purpose

Stores the current summary confidence result for one application and one horizon.

### Key fields

- `id`
- `applicationId`
- `horizonType`
- `calculatedScore`
- `manualAdjustment`
- `finalScore`
- `confidenceBand`
- `scoringModelVersion`
- `assessmentStatus`
- `reviewerName` or `reviewerUserId`
- `reviewNotes`
- `overrideReason`
- `isStale`
- `calculatedAt`
- `reviewedAt`
- `createdAt`
- `updatedAt`

### Uniqueness rule

There should be one current row per:

- `applicationId`
- `horizonType`

---

## 12.3 Entity: ConfidenceFactorScore

### Purpose

Stores the raw and weighted result for each factor within a confidence assessment.

### Key fields

- `id`
- `confidenceAssessmentId`
- `factorCode`
- `rawScore`
- `weightPercent`
- `weightedScore`
- `maxScore`
- `explanation`
- `createdAt`
- `updatedAt`

### Uniqueness rule

There should be one row per:

- `confidenceAssessmentId`
- `factorCode`

---

## 12.4 Future entity candidate

### ConfidenceEvidenceLink

Not required for v1. May later support traceability from factor scores back to:

- notes
- sign-offs
- ownership records
- candidate apps
- dependencies

This should remain a future extension, not a v1 dependency.

---

## 13. Prisma Schema Proposal

```prisma
model ConfidenceAssessment {
  id                  String                       @id @default(cuid())
  applicationId       String
  application         Application                  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  horizonType         ConfidenceHorizon
  calculatedScore     Int
  manualAdjustment    Int                          @default(0)
  finalScore          Int
  confidenceBand      ConfidenceBand
  scoringModelVersion String
  assessmentStatus    ConfidenceAssessmentStatus   @default(SYSTEM_CALCULATED)

  reviewerName        String?
  reviewNotes         String?
  overrideReason      String?

  isStale             Boolean                      @default(false)
  calculatedAt        DateTime
  reviewedAt          DateTime?

  createdAt           DateTime                     @default(now())
  updatedAt           DateTime                     @updatedAt

  factorScores        ConfidenceFactorScore[]

  @@unique([applicationId, horizonType])
  @@index([horizonType, finalScore])
  @@index([confidenceBand])
}

model ConfidenceFactorScore {
  id                     String                  @id @default(cuid())
  confidenceAssessmentId String
  confidenceAssessment   ConfidenceAssessment    @relation(fields: [confidenceAssessmentId], references: [id], onDelete: Cascade)

  factorCode             ConfidenceFactorCode
  rawScore               Int
  weightPercent          Decimal                 @db.Decimal(5,2)
  weightedScore          Decimal                 @db.Decimal(6,2)
  maxScore               Int                     @default(100)
  explanation            String?

  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt

  @@unique([confidenceAssessmentId, factorCode])
  @@index([factorCode])
}

enum ConfidenceHorizon {
  TSA
  LONG_TERM
}

enum ConfidenceBand {
  LOW
  MEDIUM
  HIGH
}

enum ConfidenceAssessmentStatus {
  SYSTEM_CALCULATED
  REVIEWED
  APPROVED
  OVERRIDDEN
}

enum ConfidenceFactorCode {
  DISPOSITION_DEFINITION
  EVIDENCE_QUALITY
  BUSINESS_ALIGNMENT
  TECHNICAL_ALIGNMENT
  EXECUTION_READINESS
  STABILITY_CONSISTENCY
}
```

---

## 14. Supporting Field Additions to Existing Models

To support v1, the existing domain models should expose or derive the following information.

### On disposition-related data

For both horizons, the engine should be able to evaluate:

- disposition
- rationale
- target date
- target platform
- status

### Additional recommended v1 fields

If not already present, add explicit status fields such as:

- `businessReviewStatus`
- `businessSignoffStatus`
- `technicalReviewStatus`
- `technicalSignoffStatus`

### Suggested enum values

- `NOT_STARTED`
- `IN_PROGRESS`
- `REVIEWED`
- `SIGNED_OFF`

This is a pragmatic v1 bridge until a fuller sign-off entity exists.

---

## 15. Calculation Architecture

## 15.1 Service-layer structure

Recommended module structure:

```text
src/
  lib/
    confidence/
      confidence-engine.ts
      confidence-rules.ts
      confidence-types.ts
      confidence-utils.ts
```

## 15.2 Responsibilities

### `confidence-types.ts`

- horizon types
- factor codes
- result interfaces
- score breakdown interfaces

### `confidence-rules.ts`

- factor weights
- scoring rule definitions
- scoring model version constant
- confidence band thresholds

### `confidence-utils.ts`

- clamp function
- round function
- stale logic
- applicable / not-applicable helpers
- explanation string helpers

### `confidence-engine.ts`

Main orchestration logic to:

- load application data and related entities
- calculate factor raw scores for TSA
- calculate factor raw scores for Long-term
- apply weights
- compute calculated score
- apply manual adjustment
- determine band
- persist assessment and factor rows

---

## 16. Calculation Flow

### Recommended sequence

1. Load application and related source data
   - application
   - ownership
   - disposition decision(s)
   - notes
   - other supporting entities as available
2. Evaluate applicability rules for each factor sub-rule
3. Calculate TSA raw factor scores
4. Calculate Long-term raw factor scores
5. Apply weights to produce calculated score per horizon
6. Retrieve existing manual adjustment values
7. Compute final score
8. Determine confidence band
9. Evaluate staleness flag
10. Upsert `ConfidenceAssessment`
11. Upsert `ConfidenceFactorScore` rows

---

## 17. API Design

## 17.1 Read endpoint

### `GET /api/applications/:id/confidence`

Returns confidence for both horizons, including factor breakdown.

### Response shape

```json
{
  "applicationId": "app_123",
  "tsa": {
    "calculatedScore": 68,
    "manualAdjustment": 5,
    "finalScore": 73,
    "band": "HIGH",
    "status": "REVIEWED",
    "scoringModelVersion": "v1.0",
    "calculatedAt": "2026-03-28T17:00:00Z",
    "reviewedAt": "2026-03-28T17:10:00Z",
    "isStale": false,
    "factorScores": [
      {
        "factorCode": "BUSINESS_ALIGNMENT",
        "rawScore": 100,
        "weightPercent": 20,
        "weightedScore": 20,
        "explanation": "Business owner and business decision owner assigned; business sign-off recorded."
      }
    ]
  },
  "longTerm": {
    "calculatedScore": 54,
    "manualAdjustment": 0,
    "finalScore": 54,
    "band": "MEDIUM",
    "status": "SYSTEM_CALCULATED",
    "scoringModelVersion": "v1.0",
    "calculatedAt": "2026-03-28T17:00:00Z",
    "reviewedAt": null,
    "isStale": false,
    "factorScores": []
  }
}
```

---

## 17.2 Recalculate endpoint

### `POST /api/applications/:id/confidence/recalculate`

Recomputes both horizon assessments and persists current results.

### Expected behavior

- loads current source data
- recalculates TSA and Long-term
- preserves any stored manual adjustment
- updates factor scores
- returns the refreshed assessment payload

---

## 17.3 Manual review / adjustment endpoint

### `PATCH /api/applications/:id/confidence/:horizon`

Updates reviewer-entered adjustment and review metadata.

### Example payload

```json
{
  "manualAdjustment": 10,
  "overrideReason": "Architecture review completed; structured technical sign-off not yet captured in the workflow.",
  "reviewNotes": "Raised confidence after review with business and technical leads.",
  "assessmentStatus": "REVIEWED"
}
```

### Validation rules

- adjustment must be between -20 and +20
- override reason required when adjustment is non-zero
- horizon must be one of: `TSA`, `LONG_TERM`

---

## 17.4 Optional portfolio summary endpoint

### `GET /api/confidence/summary`

Provides dashboard-oriented rollups such as:

- average TSA confidence
- average Long-term confidence
- count by confidence band
- low-confidence applications
- stale assessments

---

## 18. UI Design

## 18.1 Application list page

### Add columns or score chips

- **TSA Confidence**
- **LT Confidence**

### Display format

- numeric score
- confidence band
- optional stale icon
- optional override icon

### Example

- `82 High`
- `54 Medium`

### Expected user value

This allows the application list to be sorted and filtered by decision confidence, not only by disposition or owner fields.

---

## 18.2 Application detail page

Add a dedicated **Confidence** section.

### Recommended layout

#### Summary row

- TSA confidence score and band
- Long-term confidence score and band
- last calculated timestamp
- last reviewed timestamp
- scoring model version

#### Horizon cards

For each horizon display:

- calculated score
- manual adjustment
- final score
- confidence band
- assessment status
- review notes
- stale flag if applicable

#### Factor breakdown

Display the six factors with bars or segmented indicators:

- Disposition Definition
- Evidence Quality
- Business Alignment
- Technical Alignment
- Execution Readiness
- Stability / Consistency

#### Explainability section

Two supporting lists:

- **What is helping confidence**
- **What is lowering confidence**

#### Actions

- Recalculate confidence
- Review / adjust confidence
- View scoring details

---

## 19. Dashboard Design

## v1 dashboard summary

Recommended starter metrics:

- average TSA confidence
- average Long-term confidence
- count of Low confidence applications
- count of stale assessments

## Recommended work queues

### Low confidence queue

Fields:

- application name
- TSA score
- Long-term score
- dominant missing factor
- disposition

### Gap queue

Examples:

- weak business alignment
- weak technical alignment
- weak evidence quality
- missing target platform for long-term disposition

This turns confidence grading into a work-management feature rather than just a visual indicator.

---

## 20. Filters and Sorting

### Recommended filters

- TSA confidence band
- Long-term confidence band
- TSA score range
- Long-term score range
- stale only
- overridden only

### Recommended sorts

- lowest TSA first
- lowest Long-term first
- most recently reviewed
- stalest first

---

## 21. Versioning Strategy

### Required field

Store `scoringModelVersion` on each confidence assessment.

### Initial value

`v1.0`

### Why this matters

The scoring model will almost certainly evolve. Versioning prevents ambiguity when interpreting existing scores and supports future recalculation campaigns.

---

## 22. Implementation Phasing

## Phase A – Foundation

Implement:

- Prisma schema additions
- confidence service module
- scoring rules and utilities
- recalculate endpoint
- read endpoint
- application detail page confidence panel
- application list page score display

## Phase B – Workflow refinement

Implement:

- manual adjustment UI
- review notes
- stale flags
- sort and filter support
- dashboard summary tiles

## Phase C – Richer evidence and governance

Implement:

- candidate app entity integration
- dependency / risk entity integration
- formal sign-off entity
- score history snapshots
- trend and delta views

---

## 23. Recommended Build Decisions

### Decision 1

Use **two horizon-specific scores** only in v1.

### Decision 2

Use **dedicated confidence entities** rather than only fields on Application.

### Decision 3

Use **system-calculated score plus manual adjustment**, not free-form manual score entry.

### Decision 4

Add **explicit review and sign-off status fields** now if formal approval entities do not yet exist.

### Decision 5

Make score breakdown visible in the UI from the first release so the feature remains explainable and credible.

---

## 24. Key Design Principles

### Explainability first

The user should be able to answer:

> Why is this application a 58 and not an 82?

If the feature cannot answer that clearly, users will distrust the score.

### Score as signal, not truth

Confidence should guide attention and conversation. It should not imply absolute certainty.

### Favor structured evidence where possible

Over time, confidence quality will improve as notes, reviews, sign-offs, candidate apps, and dependencies become more structured.

### Keep v1 practical

The first version should use currently available data and a clean extension path rather than waiting for every supporting workflow to be perfect.

---

## 25. Suggested Next Technical Deliverables

After this canvas spec, the next useful build artifacts would be:

1. **Prisma migration draft**
2. **TypeScript domain interfaces and score types**
3. **Confidence calculation pseudocode / service skeleton**
4. **API contract definitions**
5. **UI component breakdown for list page and detail page**
6. **Implementation task plan by phase**

---

## 26. Build Task Plan

This section translates the confidence grading design into an implementation-oriented work plan for the Merge\_and\_ACQ codebase.

---

## 26.1 Delivery approach

Recommended delivery sequence:

1. **Data foundation**
2. **Confidence engine and persistence**
3. **Read/recalculate APIs**
4. **Application detail UI**
5. **Application list UI**
6. **Manual review / adjustment workflow**
7. **Dashboard and portfolio filters**
8. **Hardening, testing, and rollout controls**

This sequence keeps the feature shippable in slices and avoids building UI before the underlying model is stable.

---

## 26.2 Phase A – Foundation

### Goal

Stand up the minimum data model, calculation logic, and read surfaces needed to produce trustworthy confidence scores.

### A1. Confirm current source-of-truth fields

**Objective:** map existing fields and identify what can already drive scoring versus what must be added.

**Tasks**

- inventory current fields on `Application`, `Ownership`, `DispositionDecision`, and `Note`
- identify which fields map directly to TSA scoring rules
- identify which fields map directly to Long-term scoring rules
- identify any missing fields needed for v1 scoring
- confirm whether review/sign-off state already exists anywhere in current model or UI
- document any fields that are currently free-text but need structured interpretation

**Deliverable**

- source field mapping note or dev checklist

**Dependencies**

- none

---

### A2. Add required supporting fields to existing models

**Objective:** ensure the current domain models expose enough structured data for v1 scoring.

**Tasks**

- add review/sign-off status fields if not already present:
  - `businessReviewStatus`
  - `businessSignoffStatus`
  - `technicalReviewStatus`
  - `technicalSignoffStatus`
- add or confirm horizon-specific status fields as needed
- confirm target date and target platform semantics for both TSA and Long-term
- decide whether candidate-app relevance is explicit or inferred in v1
- update Prisma schema for these supporting fields
- generate and apply migration

**Deliverable**

- Prisma migration for supporting fields
- updated schema committed

**Dependencies**

- A1

---

### A3. Add confidence entities to Prisma schema

**Objective:** introduce the dedicated persistence model for confidence assessments and factor scores.

**Tasks**

- add `ConfidenceAssessment` model
- add `ConfidenceFactorScore` model
- add enums:
  - `ConfidenceHorizon`
  - `ConfidenceBand`
  - `ConfidenceAssessmentStatus`
  - `ConfidenceFactorCode`
- add indexes and uniqueness constraints
- validate relations to `Application`
- generate migration
- test migration locally against development database

**Deliverable**

- Prisma migration for confidence entities
- generated Prisma client

**Dependencies**

- A1

---

### A4. Define TypeScript types and constants

**Objective:** establish a single source of truth for confidence model constants and interfaces.

**Tasks**

- create `confidence-types.ts`
- define factor code union/enums for runtime usage if needed
- define interfaces for:
  - factor raw score result
  - weighted factor result
  - horizon assessment result
  - API response payload
- create `confidence-rules.ts`
- define:
  - TSA weights
  - Long-term weights
  - confidence band thresholds
  - scoring model version constant
  - manual adjustment bounds

**Deliverable**

- shared confidence type and rules modules

**Dependencies**

- A3

---

### A5. Build confidence utility helpers

**Objective:** centralize small but important calculation behavior.

**Tasks**

- create `confidence-utils.ts`
- implement helpers for:
  - `clampScore()`
  - `roundScore()`
  - `deriveConfidenceBand()`
  - `isAssessmentStale()`
  - `normalizeApplicableRuleWeight()` or equivalent logic
  - explanation string assembly helpers
- write unit tests for utility functions

**Deliverable**

- confidence utility module with unit coverage

**Dependencies**

- A4

---

### A6. Implement factor scoring functions

**Objective:** produce deterministic raw factor scores for each horizon.

**Tasks**

- create pure scoring functions for each factor:
  - `scoreDispositionDefinition()`
  - `scoreEvidenceQuality()`
  - `scoreBusinessAlignment()`
  - `scoreTechnicalAlignment()`
  - `scoreExecutionReadiness()`
  - `scoreStabilityConsistency()`
- support TSA and Long-term rule differences within each function or via horizon-specific rule maps
- ensure each function returns:
  - raw score
  - explanation string
  - optional reasons/helping/hurting indicators
- add unit tests covering complete, partial, and missing-data scenarios

**Deliverable**

- factor scoring functions with tests

**Dependencies**

- A1, A4, A5

---

### A7. Build orchestration engine

**Objective:** calculate and persist confidence assessments end-to-end.

**Tasks**

- create `confidence-engine.ts`
- load all required application context and related entities
- calculate TSA raw factor scores
- calculate Long-term raw factor scores
- apply weights and derive calculated score per horizon
- fetch existing manual adjustment before persisting
- derive final score and confidence band
- derive stale flag
- upsert `ConfidenceAssessment`
- upsert `ConfidenceFactorScore`
- return normalized payload for API use
- add service-level tests for representative application scenarios

**Deliverable**

- working confidence engine service

**Dependencies**

- A3, A4, A5, A6

---

## 26.3 Phase B – API and backend integration

### Goal

Expose confidence data and recalc workflows cleanly to the application UI.

### B1. Create read endpoint

**Objective:** allow application detail pages and future dashboards to retrieve confidence data.

**Tasks**

- implement `GET /api/applications/:id/confidence`
- shape response for both horizons
- include factor breakdown and metadata
- handle no-assessment-yet case gracefully
- validate route behavior and error handling

**Deliverable**

- production-ready confidence read endpoint

**Dependencies**

- A7

---

### B2. Create recalculate endpoint

**Objective:** trigger on-demand recalculation.

**Tasks**

- implement `POST /api/applications/:id/confidence/recalculate`
- call confidence engine
- preserve existing manual adjustments
- return refreshed payload
- add authorization logic if admin/reviewer permissions exist
- test happy path and failure modes

**Deliverable**

- recalculation endpoint

**Dependencies**

- A7

---

### B3. Create manual adjustment / review endpoint

**Objective:** support analyst-reviewed confidence adjustments.

**Tasks**

- implement `PATCH /api/applications/:id/confidence/:horizon`
- validate adjustment bounds
- require `overrideReason` for non-zero adjustments
- persist `reviewNotes`, `assessmentStatus`, `reviewerName`, `reviewedAt`
- return updated assessment payload
- test negative, positive, and zero-adjustment flows

**Deliverable**

- review/update endpoint

**Dependencies**

- A3, A4, A7

---

### B4. Trigger recalculation from source record changes

**Objective:** keep confidence reasonably current without relying only on manual actions.

**Tasks**

- identify existing API routes that change scoring inputs:
  - disposition updates
  - ownership updates
  - note changes
  - review/sign-off field updates
- decide between synchronous recalc and deferred recalc per mutation path
- call confidence engine after successful save where appropriate
- ensure failures in confidence recalculation do not corrupt core data updates
- add logging around recalc triggers

**Deliverable**

- automatic confidence refresh on key data changes

**Dependencies**

- B2

---

### B5. Optional batch recalc utility

**Objective:** support backfill and model-version refresh.

**Tasks**

- create service or script to recalculate all applications
- add model-version-aware refresh behavior
- support use after migration or scoring-model change
- decide whether to expose via admin API, CLI script, or both

**Deliverable**

- batch recalculation utility

**Dependencies**

- A7

---

## 26.4 Phase C – UI implementation

### Goal

Make confidence visible, usable, and explainable in the application interface.

### C1. Add confidence panel to application detail page

**Objective:** expose scores and breakdown where users manage application decisions.

**Tasks**

- add a new `Confidence` section/card on the application detail page
- show TSA summary card
- show Long-term summary card
- display:
  - calculated score
  - manual adjustment
  - final score
  - confidence band
  - status
  - stale indicator
  - last calculated
  - last reviewed
- call confidence read endpoint and handle loading/error states

**Deliverable**

- detail page confidence panel

**Dependencies**

- B1

---

### C2. Add factor breakdown UI

**Objective:** make the score explainable.

**Tasks**

- render factor breakdown per horizon
- show factor raw or weighted score consistently
- show explanations/tooltips for each factor
- add “helping confidence” and “lowering confidence” summaries if available
- ensure layout remains readable even with partial data

**Deliverable**

- explainable factor breakdown on detail page

**Dependencies**

- C1

---

### C3. Add recalculate action to detail page

**Objective:** allow user-triggered refresh.

**Tasks**

- add `Recalculate Confidence` button
- call recalculate endpoint
- refresh local data after successful recalc
- show success/error toast or inline feedback
- prevent duplicate submissions while processing

**Deliverable**

- user-triggered recalculation flow

**Dependencies**

- B2, C1

---

### C4. Add manual review / adjustment UI

**Objective:** support analyst-reviewed scoring adjustments.

**Tasks**

- add review/edit action per horizon
- provide fields for:
  - manual adjustment
  - override reason
  - review notes
  - assessment status
- validate bounds in UI before submission
- surface current calculated score and final score clearly
- show reviewer and reviewed timestamp after save

**Deliverable**

- confidence review and adjustment form

**Dependencies**

- B3, C1

---

### C5. Add confidence columns/chips to application list

**Objective:** make portfolio triage easier.

**Tasks**

- add TSA confidence column or badge
- add Long-term confidence column or badge
- display numeric score and band
- add stale and override indicators where useful
- confirm list query includes or can retrieve score summary efficiently

**Deliverable**

- confidence visible in application list

**Dependencies**

- B1, or a list-query enhancement if needed

---

### C6. Add confidence-based sorting and filters

**Objective:** make scores operationally useful.

**Tasks**

- add filter controls for:
  - TSA confidence band
  - Long-term confidence band
  - stale only
  - overridden only
- add sorting for:
  - lowest TSA first
  - lowest Long-term first
  - stalest first
  - most recently reviewed
- align API/query behavior to support sorting/filtering efficiently

**Deliverable**

- confidence-driven filtering and sort behavior

**Dependencies**

- C5

---

## 26.5 Phase D – Dashboard and reporting

### Goal

Use confidence to drive portfolio insight and work queues.

### D1. Create confidence summary endpoint

**Objective:** provide aggregated metrics for dashboard views.

**Tasks**

- implement `GET /api/confidence/summary`
- include:
  - average TSA confidence
  - average Long-term confidence
  - count by confidence band
  - stale assessment count
  - low-confidence application count
- validate aggregation logic and response shape

**Deliverable**

- confidence summary API

**Dependencies**

- A7

---

### D2. Add dashboard summary cards

**Objective:** surface portfolio-level confidence health.

**Tasks**

- add dashboard tiles/cards for:
  - average TSA confidence
  - average Long-term confidence
  - low-confidence apps
  - stale assessments
- add loading/error states
- align design with existing dashboard style if one already exists

**Deliverable**

- confidence summary tiles

**Dependencies**

- D1

---

### D3. Add low-confidence and gap work queues

**Objective:** turn confidence into prioritized action.

**Tasks**

- create low-confidence applications table
- create stale assessments table
- create “missing alignment/evidence” queue if factor-level gaps are available
- add navigation from dashboard rows to application detail page

**Deliverable**

- dashboard work queues for follow-up action

**Dependencies**

- D1, C5

---

## 26.6 Phase E – Testing, hardening, and rollout

### Goal

Make the feature reliable enough for real portfolio use.

### E1. Unit tests for scoring logic

**Objective:** verify deterministic scoring.

**Tasks**

- create test fixtures for application scenarios:
  - no data / low maturity
  - partially complete assessment
  - fully aligned / high confidence
  - conflicting fields
  - missing target platform but not applicable
- validate raw factor scores and final horizon scores
- validate band derivation

**Deliverable**

- scoring unit test suite

**Dependencies**

- A6, A7

---

### E2. API integration tests

**Objective:** verify persistence and route contracts.

**Tasks**

- test read endpoint
- test recalc endpoint
- test manual adjustment endpoint
- test invalid payloads and error behavior
- test that recalculation preserves manual adjustments

**Deliverable**

- confidence API integration coverage

**Dependencies**

- B1, B2, B3

---

### E3. UI behavior tests

**Objective:** verify confidence displays and flows behave correctly.

**Tasks**

- test detail page rendering with complete and partial confidence payloads
- test recalc action behavior
- test adjustment form validation
- test list display, sort, and filter behavior if automated UI tests exist

**Deliverable**

- UI regression coverage where practical

**Dependencies**

- C1 through C6

---

### E4. Backfill and rollout plan

**Objective:** safely introduce confidence across existing application records.

**Tasks**

- run migration in dev
- seed or backfill assessments for existing applications using batch recalc utility
- review sample outputs for reasonableness
- tune explanation strings and edge-case handling if needed
- promote to production after validation

**Deliverable**

- backfilled confidence data and rollout checklist

**Dependencies**

- B5, E1, E2

---

## 26.7 Recommended backlog ordering

### Sprint / work package 1

- A1 source field mapping
- A2 supporting fields
- A3 confidence schema
- A4 types and constants
- A5 utilities

### Sprint / work package 2

- A6 factor scoring functions
- A7 confidence engine
- B1 read endpoint
- B2 recalculate endpoint

### Sprint / work package 3

- C1 detail page confidence panel
- C2 factor breakdown UI
- C3 recalculate action
- E1/E2 initial test coverage

### Sprint / work package 4

- B3 manual adjustment endpoint
- C4 manual review UI
- C5 list columns/chips
- C6 sort and filters

### Sprint / work package 5

- D1 summary endpoint
- D2 dashboard tiles
- D3 work queues
- E3/E4 rollout hardening

---

## 26.8 Dependencies summary

| Task                         | Depends on                   |
| ---------------------------- | ---------------------------- |
| A2 supporting fields         | A1                           |
| A3 confidence schema         | A1                           |
| A4 types and constants       | A3                           |
| A5 utilities                 | A4                           |
| A6 factor scoring            | A1, A4, A5                   |
| A7 confidence engine         | A3, A4, A5, A6               |
| B1 read endpoint             | A7                           |
| B2 recalculate endpoint      | A7                           |
| B3 manual review endpoint    | A3, A4, A7                   |
| B4 automatic recalc triggers | B2                           |
| B5 batch recalc utility      | A7                           |
| C1 detail page panel         | B1                           |
| C2 factor breakdown          | C1                           |
| C3 recalc action             | B2, C1                       |
| C4 review / adjustment UI    | B3, C1                       |
| C5 list confidence display   | B1 or list query enhancement |
| C6 sorting and filters       | C5                           |
| D1 summary endpoint          | A7                           |
| D2 dashboard tiles           | D1                           |
| D3 work queues               | D1, C5                       |
| E1 unit tests                | A6, A7                       |
| E2 API tests                 | B1, B2, B3                   |
| E3 UI tests                  | C1–C6                        |
| E4 rollout plan              | B5, E1, E2                   |

---

## 26.9 Acceptance criteria by milestone

### Milestone 1 – Confidence engine live

- confidence schema exists in Prisma and database
- recalculation works for one application
- TSA and Long-term scores persist correctly
- factor scores persist correctly

### Milestone 2 – Confidence visible in UI

- application detail page shows both confidence scores
- factor breakdown is visible and understandable
- user can manually recalculate an application’s confidence

### Milestone 3 – Confidence usable operationally

- user can review and adjust scores with required rationale
- application list supports confidence visibility and sorting
- stale and overridden assessments are visible

### Milestone 4 – Confidence supports portfolio management

- dashboard shows average confidence and low-confidence counts
- low-confidence work queues exist
- existing portfolio records have been backfilled

---

## 26.10 Suggested implementation notes for current codebase

### Practical coding guidance

- keep scoring functions pure and easy to test
- keep horizon-specific rule definitions in configuration where possible
- avoid scattering confidence logic across route handlers
- centralize all score calculation in the confidence engine/service
- preserve manual adjustment across recalculation unless explicitly changed by reviewer action
- treat explainability as a first-class output, not an afterthought

### Likely first-cut simplifications

- use explicit status fields instead of a full sign-off entity
- infer “meaningful note” using simple heuristics until note typing matures
- keep one current assessment per horizon instead of full history snapshots
- use a batch recalc script for initial backfill rather than trying to compute on read for all records

---

## 27. Developer-Ready Checklist

This section converts the build plan into an execution checklist that can be worked directly by a developer.

---

## 27.1 Schema migration checklist

### Supporting field readiness

-

### Supporting field additions

-

### New confidence entities

-

### Migration execution

-

### Backfill readiness

-

---

## 27.2 API checklist

### Confidence module foundations

-

### Rules and constants

-

### Utility helpers

-

### Factor scoring functions

-

### Confidence engine

-

### Read endpoint

-

### Recalculate endpoint

-

### Manual review / adjustment endpoint

-

### Automatic recalculation hooks

-

### Batch/admin utilities

-

---

## 27.3 UI component checklist

### Application detail page

-

### Factor breakdown

-

### Recalculate interaction

-

### Manual review / adjustment UI

-

### Application list page

-

### Sorting and filtering

-

### Dashboard components

-

### UI polish and usability

-

---

## 27.4 Testing checklist

### Unit tests – utilities and scoring

-

### Service / engine tests

-

### API tests

-

### UI tests

-

### Backfill and regression validation

-

---

## 27.5 Suggested developer execution order

### First pass

-

### Second pass

-

### Third pass

-

### Fourth pass

-

---

## Revision History

| Version | Date       | Notes                                                                                             |
| ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| v1.2    | 2026-03-28 | Added developer-ready checklist covering schema, API, UI, and testing work                        |
| v1.1    | 2026-03-28 | Added build task plan, dependencies, milestone acceptance criteria, and implementation sequencing |
| v1.0    | 2026-03-28 | Initial canvas-ready implementation spec for Confidence Grading                                   |

| Version | Date       | Notes                                                                                             |
| ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| v1.1    | 2026-03-28 | Added build task plan, dependencies, milestone acceptance criteria, and implementation sequencing |
| v1.0    | 2026-03-28 | Initial canvas-ready implementation spec for Confidence Grading                                   |

| Version | Date       | Notes                                                           |
| ------- | ---------- | --------------------------------------------------------------- |
| v1.0    | 2026-03-28 | Initial canvas-ready implementation spec for Confidence Grading |

