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
- Confirm existing fields on Application, Ownership, DispositionDecision, Note
- Map fields to scoring rules (TSA and Long-term)
- Identify gaps requiring new fields

### Supporting field additions
- Add review/sign-off fields:
  - businessReviewStatus, businessSignoffStatus
  - technicalReviewStatus, technicalSignoffStatus
- Validate targetDate, targetPlatform, status fields for both horizons

### New confidence entities
- Add ConfidenceAssessment
- Add ConfidenceFactorScore
- Add enums: ConfidenceHorizon, ConfidenceBand, ConfidenceAssessmentStatus, ConfidenceFactorCode, ReviewStatus
- Add indexes and unique constraints

### Migration execution
- Generate Prisma migration
- Run locally and validate schema
- Regenerate Prisma client

### Backfill readiness
- Build batch recalc script
- Validate sample applications after backfill

---

## 27.2 API checklist

### Confidence module foundations
- Create confidence-types, rules, utils, scoring, engine, repository modules

### Rules and constants
- Define weights, bands, model version, adjustment bounds

### Utility helpers
- clampScore, roundScore, deriveConfidenceBand, isAssessmentStale

### Factor scoring functions
- Implement all six factor scorers with tests

### Confidence engine
- Implement calculateOnly and calculateAndPersist

### Read endpoint
- GET /api/applications/:id/confidence

### Recalculate endpoint
- POST /api/applications/:id/confidence/recalculate

### Manual review / adjustment endpoint
- PATCH /api/applications/:id/confidence/:horizon

### Automatic recalculation hooks
- Trigger on disposition, ownership, notes, review changes

### Batch/admin utilities
- Script to recalc all applications

---

## 27.3 UI component checklist

### Application detail page
- Confidence summary (TSA + Long-term)
- Status, stale flag, timestamps

### Factor breakdown
- Show factor scores and explanations

### Recalculate interaction
- Button + loading/feedback state

### Manual review / adjustment UI
- Form with validation and reason requirement

### Application list page
- TSA and Long-term score chips/columns

### Sorting and filtering
- Bands, ranges, stale, overridden

### Dashboard components
- Summary tiles and queues

### UI polish and usability
- Tooltips, empty states, error states

---

## 27.4 Testing checklist

### Unit tests – utilities and scoring
- Cover each factor and edge cases

### Service / engine tests
- End-to-end calculation per horizon

### API tests
- Read, recalc, adjustment, validation errors

### UI tests
- Detail panel, recalc, adjustment flows

### Backfill and regression validation
- Validate portfolio after migration

---

## 27.5 Suggested developer execution order

### First pass
- Schema + enums + basic engine skeleton

### Second pass
- Factor scoring + endpoints

### Third pass
- Detail UI + list visibility

### Fourth pass
- Adjustments + dashboard + hardening

---

## 28. Prisma Schema Draft

This section provides a developer-oriented Prisma schema draft for the v1 Confidence Grading feature. It is written to be practical for adaptation into the current Merge_and_ACQ data model.

---

## 28.1 Drafting assumptions

This draft assumes:
- `Application` already exists and is the parent record for disposition work
- at least one existing model currently holds disposition-related data
- `Ownership` and `Note` already exist or equivalent structures are in place
- v1 will use explicit review/sign-off status fields rather than a separate approval workflow entity

Where current model names or field names differ, this draft should be adapted rather than copied blindly.

---

## 28.2 Recommended enums

```prisma
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

enum ReviewStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEWED
  SIGNED_OFF
}
```

### Notes
- `ReviewStatus` is intended as a pragmatic v1 enum for business/technical review fields.
- If the current schema already has a generic workflow status enum that cleanly fits this use, that may be reused instead.

---

## 28.3 Confidence entities

### ConfidenceAssessment

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
  @@index([applicationId])
}
```

### ConfidenceFactorScore

```prisma
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
```

### Design notes
- `manualAdjustment` remains separate from `calculatedScore` so recalculation does not destroy analyst input.
- `finalScore` is persisted for fast reads and filtering.
- `reviewerName` is acceptable in v1 if there is not yet a user identity model in scope.
- `isStale` is denormalized on purpose to make list filtering and dashboard aggregation easier.

---

## 28.4 Application relation addition

Assuming `Application` is your parent entity, add a reverse relation like this:

```prisma
model Application {
  id                    String                  @id @default(cuid())
  // ...existing fields...

  confidenceAssessments ConfidenceAssessment[]
}
```

If the actual primary key type on `Application` is not `String`, adjust the foreign key type on `ConfidenceAssessment.applicationId` accordingly.

---

## 28.5 Supporting field draft for disposition and review data

The exact placement of these fields depends on your current schema. In many cases they belong on an existing `DispositionDecision` model.

### Recommended pattern if `DispositionDecision` already exists

```prisma
model DispositionDecision {
  id                         String        @id @default(cuid())
  applicationId              String
  application                Application   @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  decisionHorizon            ConfidenceHorizon
  targetDisposition          String?
  rationale                  String?
  targetDate                 DateTime?
  targetPlatform            String?
  status                     String?

  businessReviewStatus       ReviewStatus? @default(NOT_STARTED)
  businessSignoffStatus      ReviewStatus? @default(NOT_STARTED)
  technicalReviewStatus      ReviewStatus? @default(NOT_STARTED)
  technicalSignoffStatus     ReviewStatus? @default(NOT_STARTED)

  reviewedAt                 DateTime?
  createdAt                  DateTime      @default(now())
  updatedAt                  DateTime      @updatedAt

  @@index([applicationId])
  @@index([decisionHorizon])
}
```

### Notes
- If you already store TSA and Long-term decisions as separate rows, `decisionHorizon` fits well.
- If you already store both horizons as separate field groups on one row, keep that structure and adapt the confidence engine to map accordingly.
- `status` is shown as `String?` only because your current enum may already exist. If not, introducing a proper disposition workflow enum would be cleaner.

---

## 28.6 Alternative supporting field draft if disposition data is stored directly on Application

If the current app stores disposition fields directly on `Application`, this is a practical transitional pattern:

```prisma
model Application {
  id                          String        @id @default(cuid())
  // ...existing fields...

  tsaDisposition              String?
  tsaRationale                String?
  tsaTargetDate               DateTime?
  tsaTargetPlatform           String?
  tsaStatus                   String?

  longTermDisposition         String?
  longTermRationale           String?
  longTermTargetDate          DateTime?
  longTermTargetPlatform      String?
  longTermStatus              String?

  businessReviewStatus        ReviewStatus? @default(NOT_STARTED)
  businessSignoffStatus       ReviewStatus? @default(NOT_STARTED)
  technicalReviewStatus       ReviewStatus? @default(NOT_STARTED)
  technicalSignoffStatus      ReviewStatus? @default(NOT_STARTED)

  confidenceAssessments       ConfidenceAssessment[]
}
```

### Recommendation
Prefer keeping disposition data in `DispositionDecision` if that entity already exists and is stable. It is usually cleaner than flattening more horizon-specific fields onto `Application`.

---

## 28.7 Ownership-related schema fit

If `Ownership` already exists, confirm it exposes the fields the scoring engine needs. A typical pattern would be:

```prisma
model Ownership {
  id                     String       @id @default(cuid())
  applicationId          String       @unique
  application            Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  businessOwner          String?
  technicalOwner         String?
  businessDecisionOwner  String?
  technicalDecisionOwner String?

  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt
}
```

### Notes
- If `Ownership` is one-to-many instead of one-to-one, that is still workable, but the confidence engine will need a clear rule for which row is authoritative.
- For v1, the cleanest scoring implementation is usually one active ownership record per application.

---

## 28.8 Note-related schema fit

If notes are already modeled, confirm the engine can determine at least:
- whether any initial analysis note exists
- whether any substantive note exists
- whether notes were updated recently enough to support review freshness logic

A typical minimal note shape might look like:

```prisma
model Note {
  id             String       @id @default(cuid())
  applicationId  String
  application    Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  title          String?
  content        String
  noteType       String?

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```

### Recommendation
If `noteType` does not exist today, the feature can still ship. The scoring engine can initially infer “initial analysis” and “meaningful note” using simple heuristics.

---

## 28.9 Combined schema example

This is a consolidated example showing how the confidence-related additions fit together conceptually.

```prisma
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

enum ReviewStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEWED
  SIGNED_OFF
}

model Application {
  id                    String                  @id @default(cuid())
  // ...existing fields...

  ownership             Ownership?
  dispositionDecisions  DispositionDecision[]
  notes                 Note[]
  confidenceAssessments ConfidenceAssessment[]
}

model Ownership {
  id                     String       @id @default(cuid())
  applicationId          String       @unique
  application            Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  businessOwner          String?
  technicalOwner         String?
  businessDecisionOwner  String?
  technicalDecisionOwner String?

  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt
}

model DispositionDecision {
  id                     String             @id @default(cuid())
  applicationId          String
  application            Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  decisionHorizon        ConfidenceHorizon
  targetDisposition      String?
  rationale              String?
  targetDate             DateTime?
  targetPlatform         String?
  status                 String?

  businessReviewStatus   ReviewStatus?      @default(NOT_STARTED)
  businessSignoffStatus  ReviewStatus?      @default(NOT_STARTED)
  technicalReviewStatus  ReviewStatus?      @default(NOT_STARTED)
  technicalSignoffStatus ReviewStatus?      @default(NOT_STARTED)

  reviewedAt             DateTime?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  @@index([applicationId])
  @@index([decisionHorizon])
}

model Note {
  id             String       @id @default(cuid())
  applicationId  String
  application    Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  title          String?
  content        String
  noteType       String?

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([applicationId])
}

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
  @@index([applicationId])
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
```

---

## 28.10 Migration guidance

### Recommended migration sequence
1. Add enums and supporting review/sign-off fields
2. Add `ConfidenceAssessment` and `ConfidenceFactorScore`
3. Regenerate Prisma client
4. Run migration in development
5. Create and run batch backfill script for existing applications

### Suggested migration naming
- `add_confidence_review_status_fields`
- `add_confidence_assessment_models`

### Backfill note
Do not rely on score computation only at read time for existing records. Populate current assessments for all applications after migration so list and dashboard reads are fast and consistent.

---

## 28.11 Open schema decisions to confirm in the codebase

Before finalizing the migration, confirm these against the current repo:
- Is `Application.id` a `String @id @default(cuid())` or something else?
- Is `Ownership` one-to-one or one-to-many?
- Is `DispositionDecision` already horizon-based or field-based?
- Does an enum already exist for disposition workflow status?
- Should `reviewerName` stay as free text, or should it point to a user identity later?
- Are notes already typed, or will v1 infer note meaning heuristically?

These do not block the design, but they do affect the exact migration draft you will commit.

---

## 29. TypeScript Confidence Engine Skeleton

This section provides a developer-ready TypeScript skeleton for the confidence engine layer. It is intentionally scaffold-oriented rather than fully implemented, so it can be adapted cleanly to the current Merge_and_ACQ codebase.

---

## 29.1 Suggested file layout

```text
src/
  lib/
    confidence/
      confidence-types.ts
      confidence-rules.ts
      confidence-utils.ts
      confidence-engine.ts
      confidence-scoring.ts
      confidence-repository.ts
```

### Recommended responsibility split
- `confidence-types.ts` → shared types and interfaces
- `confidence-rules.ts` → weights, thresholds, model version, rule constants
- `confidence-utils.ts` → helpers for clamping, rounding, stale logic, applicability logic
- `confidence-scoring.ts` → pure factor scoring functions
- `confidence-repository.ts` → Prisma reads and upserts for confidence records
- `confidence-engine.ts` → orchestration service used by routes and batch jobs

---

## 29.2 `confidence-types.ts`

```ts
export type ConfidenceHorizon = 'TSA' | 'LONG_TERM';

export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type ConfidenceAssessmentStatus =
  | 'SYSTEM_CALCULATED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'OVERRIDDEN';

export type ConfidenceFactorCode =
  | 'DISPOSITION_DEFINITION'
  | 'EVIDENCE_QUALITY'
  | 'BUSINESS_ALIGNMENT'
  | 'TECHNICAL_ALIGNMENT'
  | 'EXECUTION_READINESS'
  | 'STABILITY_CONSISTENCY';

export type ReviewStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'REVIEWED'
  | 'SIGNED_OFF';

export interface ConfidenceFactorResult {
  factorCode: ConfidenceFactorCode;
  rawScore: number;
  weightPercent: number;
  weightedScore: number;
  maxScore: number;
  explanation: string;
  helpingSignals?: string[];
  loweringSignals?: string[];
}

export interface HorizonConfidenceResult {
  horizonType: ConfidenceHorizon;
  calculatedScore: number;
  manualAdjustment: number;
  finalScore: number;
  confidenceBand: ConfidenceBand;
  assessmentStatus: ConfidenceAssessmentStatus;
  scoringModelVersion: string;
  isStale: boolean;
  calculatedAt: Date;
  reviewedAt: Date | null;
  reviewerName: string | null;
  reviewNotes: string | null;
  overrideReason: string | null;
  factorScores: ConfidenceFactorResult[];
}

export interface ApplicationConfidenceResponse {
  applicationId: string;
  tsa: HorizonConfidenceResult;
  longTerm: HorizonConfidenceResult;
}

export interface ConfidenceEngineInput {
  applicationId: string;
}

export interface ConfidenceContext {
  application: {
    id: string;
    name?: string | null;
  };
  ownership: {
    businessOwner?: string | null;
    technicalOwner?: string | null;
    businessDecisionOwner?: string | null;
    technicalDecisionOwner?: string | null;
  } | null;
  dispositions: Array<{
    id: string;
    decisionHorizon: ConfidenceHorizon;
    targetDisposition?: string | null;
    rationale?: string | null;
    targetDate?: Date | null;
    targetPlatform?: string | null;
    status?: string | null;
    businessReviewStatus?: ReviewStatus | null;
    businessSignoffStatus?: ReviewStatus | null;
    technicalReviewStatus?: ReviewStatus | null;
    technicalSignoffStatus?: ReviewStatus | null;
    reviewedAt?: Date | null;
    updatedAt: Date;
  }>;
  notes: Array<{
    id: string;
    title?: string | null;
    content: string;
    noteType?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  existingAssessments: Array<{
    horizonType: ConfidenceHorizon;
    manualAdjustment: number;
    assessmentStatus: ConfidenceAssessmentStatus;
    reviewerName?: string | null;
    reviewNotes?: string | null;
    overrideReason?: string | null;
    reviewedAt?: Date | null;
  }>;
}
```

---

## 29.3 `confidence-rules.ts`

```ts
import type { ConfidenceBand, ConfidenceFactorCode } from './confidence-types';

export const CONFIDENCE_MODEL_VERSION = 'v1.0';

export const MANUAL_ADJUSTMENT_MIN = -20;
export const MANUAL_ADJUSTMENT_MAX = 20;
export const STALE_DAYS_THRESHOLD = 90;

export const FACTOR_ORDER: ConfidenceFactorCode[] = [
  'DISPOSITION_DEFINITION',
  'EVIDENCE_QUALITY',
  'BUSINESS_ALIGNMENT',
  'TECHNICAL_ALIGNMENT',
  'EXECUTION_READINESS',
  'STABILITY_CONSISTENCY',
];

export const TSA_FACTOR_WEIGHTS: Record<ConfidenceFactorCode, number> = {
  DISPOSITION_DEFINITION: 20,
  EVIDENCE_QUALITY: 20,
  BUSINESS_ALIGNMENT: 20,
  TECHNICAL_ALIGNMENT: 20,
  EXECUTION_READINESS: 15,
  STABILITY_CONSISTENCY: 5,
};

export const LONG_TERM_FACTOR_WEIGHTS: Record<ConfidenceFactorCode, number> = {
  DISPOSITION_DEFINITION: 15,
  EVIDENCE_QUALITY: 20,
  BUSINESS_ALIGNMENT: 20,
  TECHNICAL_ALIGNMENT: 25,
  EXECUTION_READINESS: 10,
  STABILITY_CONSISTENCY: 10,
};

export const CONFIDENCE_BANDS: Array<{
  min: number;
  max: number;
  band: ConfidenceBand;
}> = [
  { min: 0, max: 39, band: 'LOW' },
  { min: 40, max: 69, band: 'MEDIUM' },
  { min: 70, max: 100, band: 'HIGH' },
];
```

---

## 29.4 `confidence-utils.ts`

```ts
import {
  CONFIDENCE_BANDS,
  MANUAL_ADJUSTMENT_MAX,
  MANUAL_ADJUSTMENT_MIN,
  STALE_DAYS_THRESHOLD,
} from './confidence-rules';
import type { ConfidenceBand } from './confidence-types';

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function roundScore(value: number): number {
  return Math.round(value);
}

export function clampManualAdjustment(value: number): number {
  return Math.max(MANUAL_ADJUSTMENT_MIN, Math.min(MANUAL_ADJUSTMENT_MAX, value));
}

export function deriveConfidenceBand(score: number): ConfidenceBand {
  const safeScore = clampScore(score);
  const match = CONFIDENCE_BANDS.find((entry) => safeScore >= entry.min && safeScore <= entry.max);

  if (!match) {
    return 'LOW';
  }

  return match.band;
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function isAssessmentStale(reviewedAt: Date | null, now = new Date()): boolean {
  if (!reviewedAt) {
    return true;
  }

  return daysBetween(reviewedAt, now) > STALE_DAYS_THRESHOLD;
}

export function hasMeaningfulText(value?: string | null, minLength = 10): boolean {
  return Boolean(value && value.trim().length >= minLength);
}

export function buildExplanation(parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}

export function computeWeightedScore(rawScore: number, weightPercent: number): number {
  return (clampScore(rawScore) * weightPercent) / 100;
}
```

---

## 29.5 `confidence-scoring.ts`

```ts
import {
  LONG_TERM_FACTOR_WEIGHTS,
  TSA_FACTOR_WEIGHTS,
} from './confidence-rules';
import {
  buildExplanation,
  clampScore,
  computeWeightedScore,
  hasMeaningfulText,
} from './confidence-utils';
import type {
  ConfidenceContext,
  ConfidenceFactorCode,
  ConfidenceFactorResult,
  ConfidenceHorizon,
  ReviewStatus,
} from './confidence-types';

function getWeight(horizon: ConfidenceHorizon, factorCode: ConfidenceFactorCode): number {
  return horizon === 'TSA'
    ? TSA_FACTOR_WEIGHTS[factorCode]
    : LONG_TERM_FACTOR_WEIGHTS[factorCode];
}

function getDispositionForHorizon(context: ConfidenceContext, horizon: ConfidenceHorizon) {
  return context.dispositions.find((item) => item.decisionHorizon === horizon) ?? null;
}

function isReviewed(status?: ReviewStatus | null): boolean {
  return status === 'REVIEWED' || status === 'SIGNED_OFF';
}

function isSignedOff(status?: ReviewStatus | null): boolean {
  return status === 'SIGNED_OFF';
}

export function scoreDispositionDefinition(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'DISPOSITION_DEFINITION';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(disposition?.targetDisposition)) {
    rawScore += 35;
    helpingSignals.push('Disposition selected.');
  } else {
    loweringSignals.push('Disposition not selected.');
  }

  if (hasMeaningfulText(disposition?.rationale)) {
    rawScore += 25;
    helpingSignals.push('Rationale documented.');
  } else {
    loweringSignals.push('Rationale missing.');
  }

  if (disposition?.targetDate) {
    rawScore += horizon === 'TSA' ? 15 : 10;
    helpingSignals.push('Target date documented.');
  } else {
    loweringSignals.push('Target date missing.');
  }

  if (hasMeaningfulText(disposition?.targetPlatform)) {
    rawScore += horizon === 'TSA' ? 15 : 20;
    helpingSignals.push('Target platform documented.');
  }

  if (disposition?.targetDisposition && !['TBD', 'UNKNOWN'].includes(disposition.targetDisposition.toUpperCase())) {
    rawScore += 10;
    helpingSignals.push('Disposition is not TBD/Unknown.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreEvidenceQuality(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'EVIDENCE_QUALITY';
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  const initialAnalysisNote = context.notes.find((note) => {
    const type = note.noteType?.toLowerCase() ?? '';
    const title = note.title?.toLowerCase() ?? '';
    return type.includes('initial') || title.includes('initial analysis');
  });

  if (initialAnalysisNote) {
    rawScore += 20;
    helpingSignals.push('Initial analysis note exists.');
  } else {
    loweringSignals.push('Initial analysis note missing.');
  }

  const meaningfulNote = context.notes.find((note) => hasMeaningfulText(note.content, 40));
  if (meaningfulNote) {
    rawScore += 20;
    helpingSignals.push('Meaningful note exists.');
  } else {
    loweringSignals.push('Meaningful note missing.');
  }

  // Placeholder for candidate app evidence in v1.
  loweringSignals.push('Candidate app evidence not yet implemented in v1 scoring source.');

  const dependencyNote = context.notes.find((note) => {
    const text = `${note.title ?? ''} ${note.content}`.toLowerCase();
    return text.includes('dependency') || text.includes('assumption') || text.includes('blocker');
  });

  if (dependencyNote) {
    rawScore += 20;
    helpingSignals.push('Dependencies or assumptions documented.');
  } else {
    loweringSignals.push('Dependencies or assumptions not documented.');
  }

  const latestReviewedAt = context.dispositions
    .map((item) => item.reviewedAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (latestReviewedAt) {
    rawScore += 20;
    helpingSignals.push('Review date exists.');
  } else {
    loweringSignals.push('Review date missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreBusinessAlignment(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'BUSINESS_ALIGNMENT';
  const weightPercent = getWeight(horizon, factorCode);
  const disposition = getDispositionForHorizon(context, horizon);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(context.ownership?.businessOwner)) {
    rawScore += 25;
    helpingSignals.push('Business owner assigned.');
  } else {
    loweringSignals.push('Business owner missing.');
  }

  if (hasMeaningfulText(context.ownership?.businessDecisionOwner)) {
    rawScore += 25;
    helpingSignals.push('Business decision owner assigned.');
  } else {
    loweringSignals.push('Business decision owner missing.');
  }

  if (isReviewed(disposition?.businessReviewStatus)) {
    rawScore += 25;
    helpingSignals.push('Business review completed.');
  } else {
    loweringSignals.push('Business review incomplete.');
  }

  if (isSignedOff(disposition?.businessSignoffStatus)) {
    rawScore += 25;
    helpingSignals.push('Business sign-off recorded.');
  } else {
    loweringSignals.push('Business sign-off missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreTechnicalAlignment(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'TECHNICAL_ALIGNMENT';
  const weightPercent = getWeight(horizon, factorCode);
  const disposition = getDispositionForHorizon(context, horizon);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(context.ownership?.technicalOwner)) {
    rawScore += 25;
    helpingSignals.push('Technical owner assigned.');
  } else {
    loweringSignals.push('Technical owner missing.');
  }

  if (hasMeaningfulText(context.ownership?.technicalDecisionOwner)) {
    rawScore += 25;
    helpingSignals.push('Technical decision owner assigned.');
  } else {
    loweringSignals.push('Technical decision owner missing.');
  }

  if (isReviewed(disposition?.technicalReviewStatus)) {
    rawScore += 25;
    helpingSignals.push('Technical review completed.');
  } else {
    loweringSignals.push('Technical review incomplete.');
  }

  if (isSignedOff(disposition?.technicalSignoffStatus)) {
    rawScore += 25;
    helpingSignals.push('Technical sign-off recorded.');
  } else {
    loweringSignals.push('Technical sign-off missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreExecutionReadiness(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'EXECUTION_READINESS';
  const weightPercent = getWeight(horizon, factorCode);
  const disposition = getDispositionForHorizon(context, horizon);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (disposition?.targetDate) {
    rawScore += horizon === 'TSA' ? 30 : 20;
    helpingSignals.push('Target date exists.');
  } else {
    loweringSignals.push('Target date missing.');
  }

  if (hasMeaningfulText(disposition?.status) && !['NOT_STARTED', 'UNKNOWN'].includes((disposition?.status ?? '').toUpperCase())) {
    rawScore += 20;
    helpingSignals.push('Status reflects progression.');
  } else {
    loweringSignals.push('Status does not reflect progression.');
  }

  if (horizon === 'TSA' && hasMeaningfulText(disposition?.targetDisposition)) {
    rawScore += 20;
    helpingSignals.push('TSA disposition is actionable.');
  }

  const blockerNote = context.notes.find((note) => note.content.toLowerCase().includes('blocker'));
  if (blockerNote) {
    rawScore += 15;
    helpingSignals.push('Blockers or issues documented.');
  } else {
    loweringSignals.push('Blockers or issues not documented.');
  }

  if (hasMeaningfulText(disposition?.targetPlatform)) {
    rawScore += horizon === 'TSA' ? 15 : 30;
    helpingSignals.push('Target platform exists.');
  } else if (horizon === 'LONG_TERM') {
    loweringSignals.push('Long-term target platform missing.');
  }

  if (horizon === 'LONG_TERM') {
    const transitionNote = context.notes.find((note) => {
      const text = note.content.toLowerCase();
      return text.includes('transition') || text.includes('destination') || text.includes('migration');
    });

    if (transitionNote) {
      rawScore += 15;
      helpingSignals.push('Transition path or destination is defined.');
    } else {
      loweringSignals.push('Transition path or destination is not defined.');
    }
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreStabilityConsistency(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'STABILITY_CONSISTENCY';
  const weightPercent = getWeight(horizon, factorCode);
  const disposition = getDispositionForHorizon(context, horizon);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (disposition?.targetDisposition) {
    rawScore += 30;
    helpingSignals.push('No obvious conflicting disposition data detected in v1 heuristic.');
  } else {
    loweringSignals.push('Disposition missing, so consistency is weaker.');
  }

  const contradictionNote = context.notes.find((note) => {
    const text = note.content.toLowerCase();
    return text.includes('contradict') || text.includes('conflict');
  });

  if (!contradictionNote) {
    rawScore += 20;
    helpingSignals.push('No contradiction note detected.');
  } else {
    loweringSignals.push('Potential contradiction noted.');
  }

  rawScore += 20;
  helpingSignals.push('Disposition churn logic deferred in v1; neutral placeholder applied.');

  if (
    disposition?.targetDisposition &&
    (hasMeaningfulText(disposition?.rationale) || hasMeaningfulText(disposition?.targetPlatform) || disposition?.targetDate)
  ) {
    rawScore += 30;
    helpingSignals.push('Related supporting fields are internally consistent.');
  } else {
    loweringSignals.push('Supporting fields for disposition appear incomplete.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}
```

---

## 29.6 `confidence-repository.ts`

```ts
import type { PrismaClient } from '@prisma/client';
import type {
  ConfidenceContext,
  ConfidenceHorizon,
  HorizonConfidenceResult,
} from './confidence-types';

export async function loadConfidenceContext(
  prisma: PrismaClient,
  applicationId: string,
): Promise<ConfidenceContext> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      ownership: true,
      dispositionDecisions: true,
      notes: true,
      confidenceAssessments: true,
    },
  });

  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  return {
    application: {
      id: application.id,
      name: 'name' in application ? application.name ?? null : null,
    },
    ownership: application.ownership,
    dispositions: application.dispositionDecisions.map((item) => ({
      id: item.id,
      decisionHorizon: item.decisionHorizon as ConfidenceHorizon,
      targetDisposition: item.targetDisposition,
      rationale: item.rationale,
      targetDate: item.targetDate,
      targetPlatform: item.targetPlatform,
      status: item.status,
      businessReviewStatus: item.businessReviewStatus as any,
      businessSignoffStatus: item.businessSignoffStatus as any,
      technicalReviewStatus: item.technicalReviewStatus as any,
      technicalSignoffStatus: item.technicalSignoffStatus as any,
      reviewedAt: item.reviewedAt,
      updatedAt: item.updatedAt,
    })),
    notes: application.notes.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      noteType: note.noteType,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })),
    existingAssessments: application.confidenceAssessments.map((item) => ({
      horizonType: item.horizonType as ConfidenceHorizon,
      manualAdjustment: item.manualAdjustment,
      assessmentStatus: item.assessmentStatus as any,
      reviewerName: item.reviewerName,
      reviewNotes: item.reviewNotes,
      overrideReason: item.overrideReason,
      reviewedAt: item.reviewedAt,
    })),
  };
}

export async function upsertHorizonAssessment(
  prisma: PrismaClient,
  applicationId: string,
  result: HorizonConfidenceResult,
): Promise<void> {
  const assessment = await prisma.confidenceAssessment.upsert({
    where: {
      applicationId_horizonType: {
        applicationId,
        horizonType: result.horizonType,
      },
    },
    create: {
      applicationId,
      horizonType: result.horizonType,
      calculatedScore: result.calculatedScore,
      manualAdjustment: result.manualAdjustment,
      finalScore: result.finalScore,
      confidenceBand: result.confidenceBand,
      scoringModelVersion: result.scoringModelVersion,
      assessmentStatus: result.assessmentStatus,
      reviewerName: result.reviewerName,
      reviewNotes: result.reviewNotes,
      overrideReason: result.overrideReason,
      isStale: result.isStale,
      calculatedAt: result.calculatedAt,
      reviewedAt: result.reviewedAt,
    },
    update: {
      calculatedScore: result.calculatedScore,
      manualAdjustment: result.manualAdjustment,
      finalScore: result.finalScore,
      confidenceBand: result.confidenceBand,
      scoringModelVersion: result.scoringModelVersion,
      assessmentStatus: result.assessmentStatus,
      reviewerName: result.reviewerName,
      reviewNotes: result.reviewNotes,
      overrideReason: result.overrideReason,
      isStale: result.isStale,
      calculatedAt: result.calculatedAt,
      reviewedAt: result.reviewedAt,
    },
  });

  await Promise.all(
    result.factorScores.map((factor) =>
      prisma.confidenceFactorScore.upsert({
        where: {
          confidenceAssessmentId_factorCode: {
            confidenceAssessmentId: assessment.id,
            factorCode: factor.factorCode,
          },
        },
        create: {
          confidenceAssessmentId: assessment.id,
          factorCode: factor.factorCode,
          rawScore: factor.rawScore,
          weightPercent: factor.weightPercent,
          weightedScore: factor.weightedScore,
          maxScore: factor.maxScore,
          explanation: factor.explanation,
        },
        update: {
          rawScore: factor.rawScore,
          weightPercent: factor.weightPercent,
          weightedScore: factor.weightedScore,
          maxScore: factor.maxScore,
          explanation: factor.explanation,
        },
      }),
    ),
  );
}
```

---

## 29.7 `confidence-engine.ts`

```ts
import type { PrismaClient } from '@prisma/client';
import { CONFIDENCE_MODEL_VERSION } from './confidence-rules';
import {
  scoreBusinessAlignment,
  scoreDispositionDefinition,
  scoreEvidenceQuality,
  scoreExecutionReadiness,
  scoreStabilityConsistency,
  scoreTechnicalAlignment,
} from './confidence-scoring';
import { loadConfidenceContext, upsertHorizonAssessment } from './confidence-repository';
import {
  clampScore,
  deriveConfidenceBand,
  isAssessmentStale,
  roundScore,
} from './confidence-utils';
import type {
  ApplicationConfidenceResponse,
  ConfidenceContext,
  ConfidenceFactorResult,
  ConfidenceHorizon,
  HorizonConfidenceResult,
} from './confidence-types';

export class ConfidenceEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async calculateAndPersist(applicationId: string): Promise<ApplicationConfidenceResponse> {
    const context = await loadConfidenceContext(this.prisma, applicationId);
    const tsa = this.calculateHorizon(context, 'TSA');
    const longTerm = this.calculateHorizon(context, 'LONG_TERM');

    await upsertHorizonAssessment(this.prisma, applicationId, tsa);
    await upsertHorizonAssessment(this.prisma, applicationId, longTerm);

    return {
      applicationId,
      tsa,
      longTerm,
    };
  }

  async calculateOnly(applicationId: string): Promise<ApplicationConfidenceResponse> {
    const context = await loadConfidenceContext(this.prisma, applicationId);

    return {
      applicationId,
      tsa: this.calculateHorizon(context, 'TSA'),
      longTerm: this.calculateHorizon(context, 'LONG_TERM'),
    };
  }

  private calculateHorizon(
    context: ConfidenceContext,
    horizon: ConfidenceHorizon,
  ): HorizonConfidenceResult {
    const now = new Date();
    const existing = context.existingAssessments.find((item) => item.horizonType === horizon);

    const factorScores: ConfidenceFactorResult[] = [
      scoreDispositionDefinition(context, horizon),
      scoreEvidenceQuality(context, horizon),
      scoreBusinessAlignment(context, horizon),
      scoreTechnicalAlignment(context, horizon),
      scoreExecutionReadiness(context, horizon),
      scoreStabilityConsistency(context, horizon),
    ];

    const calculatedScore = roundScore(
      factorScores.reduce((sum, factor) => sum + factor.weightedScore, 0),
    );

    const manualAdjustment = existing?.manualAdjustment ?? 0;
    const finalScore = clampScore(calculatedScore + manualAdjustment);
    const reviewedAt = existing?.reviewedAt ?? null;

    return {
      horizonType: horizon,
      calculatedScore,
      manualAdjustment,
      finalScore,
      confidenceBand: deriveConfidenceBand(finalScore),
      assessmentStatus: existing?.assessmentStatus ?? 'SYSTEM_CALCULATED',
      scoringModelVersion: CONFIDENCE_MODEL_VERSION,
      isStale: isAssessmentStale(reviewedAt, now),
      calculatedAt: now,
      reviewedAt,
      reviewerName: existing?.reviewerName ?? null,
      reviewNotes: existing?.reviewNotes ?? null,
      overrideReason: existing?.overrideReason ?? null,
      factorScores,
    };
  }
}
```

---

## 29.8 Route usage example

```ts
import { prisma } from '@/lib/prisma';
import { ConfidenceEngine } from '@/lib/confidence/confidence-engine';

const confidenceEngine = new ConfidenceEngine(prisma);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await confidenceEngine.calculateOnly(id);

  return Response.json(result);
}
```

### Recalculate example

```ts
import { prisma } from '@/lib/prisma';
import { ConfidenceEngine } from '@/lib/confidence/confidence-engine';

const confidenceEngine = new ConfidenceEngine(prisma);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await confidenceEngine.calculateAndPersist(id);

  return Response.json(result);
}
```

---

## 29.9 Manual adjustment service sketch

This is not the full route, but it shows how manual review data should be applied independently of score recalculation.

```ts
import type { PrismaClient } from '@prisma/client';
import {
  MANUAL_ADJUSTMENT_MAX,
  MANUAL_ADJUSTMENT_MIN,
} from './confidence-rules';
import type {
  ConfidenceAssessmentStatus,
  ConfidenceHorizon,
} from './confidence-types';

interface UpdateConfidenceReviewInput {
  applicationId: string;
  horizonType: ConfidenceHorizon;
  manualAdjustment: number;
  overrideReason?: string | null;
  reviewNotes?: string | null;
  reviewerName?: string | null;
  assessmentStatus: ConfidenceAssessmentStatus;
}

export async function updateConfidenceReview(
  prisma: PrismaClient,
  input: UpdateConfidenceReviewInput,
) {
  if (
    input.manualAdjustment < MANUAL_ADJUSTMENT_MIN ||
    input.manualAdjustment > MANUAL_ADJUSTMENT_MAX
  ) {
    throw new Error('Manual adjustment is out of allowed range.');
  }

  if (input.manualAdjustment !== 0 && !input.overrideReason?.trim()) {
    throw new Error('Override reason is required when manual adjustment is non-zero.');
  }

  return prisma.confidenceAssessment.update({
    where: {
      applicationId_horizonType: {
        applicationId: input.applicationId,
        horizonType: input.horizonType,
      },
    },
    data: {
      manualAdjustment: input.manualAdjustment,
      overrideReason: input.overrideReason ?? null,
      reviewNotes: input.reviewNotes ?? null,
      reviewerName: input.reviewerName ?? null,
      assessmentStatus: input.assessmentStatus,
      reviewedAt: new Date(),
    },
  });
}
```

---

## 29.10 Implementation notes

### Strong recommendations
- keep factor scoring functions pure and side-effect free
- keep Prisma access out of scoring functions
- keep manual review updates separate from recalculation logic
- persist both calculated and final scores for easy filtering and traceability
- treat explanation text as required output, not optional decoration

### First-cut simplifications that are acceptable
- use heuristic note parsing in v1
- use `reviewerName` string instead of a user relation
- use current-state-only assessments instead of history snapshots
- score candidate-app evidence as placeholder logic until candidate app data is structured

### Areas likely to evolve next
- richer applicability logic for “target platform if relevant”
- churn/history-based stability scoring
- typed evidence model
- score history snapshots by model version

---

## 30. Sample Application Scoring Walkthrough

This section provides a concrete sample showing how the confidence model would behave for a realistic application record. The goal is to make the scoring model easier to validate and discuss with stakeholders.

---

## 30.1 Sample application profile

### Application
**Order Tracking Legacy**

### Business context
A legacy order-tracking application from an acquired business unit. It remains needed during the TSA period, but the likely long-term direction is migration into an existing enterprise platform.

### Recorded disposition state

#### TSA horizon
- TSA disposition: **Retain for TSA / Transitional Use**
- TSA rationale: documented
- TSA target date: present
- TSA target platform: not applicable / not required for the short-term transitional state
- TSA status: **In Progress**

#### Long-term horizon
- Long-term disposition: **Migrate to Enterprise Order Platform**
- Long-term rationale: documented
- Long-term target date: present
- Long-term target platform: documented
- Long-term status: **In Progress**

### Ownership state
- Business owner: assigned
- Business decision owner: assigned
- Technical owner: assigned
- Technical decision owner: missing

### Review / sign-off state
#### TSA
- Business review: completed
- Business sign-off: completed
- Technical review: completed
- Technical sign-off: not yet completed

#### Long-term
- Business review: completed
- Business sign-off: not yet completed
- Technical review: completed
- Technical sign-off: not yet completed

### Notes / evidence state
- Initial analysis note exists
- Multiple substantive notes exist
- Notes mention dependencies and blockers
- Transition approach is described in notes
- Candidate replacement applications are discussed, but not yet stored as structured candidate-app records
- Recent review date exists

---

## 30.2 Sample raw factor scoring – TSA

### Disposition Definition
**Assessment:** strong

| Rule | Points | Result |
|---|---:|---|
| TSA disposition selected | 35 | 35 |
| TSA rationale documented | 25 | 25 |
| TSA target date documented | 15 | 15 |
| TSA target platform documented if applicable | 15 | 15 *(treated as not applicable / neutralized)* |
| TSA disposition not TBD / Unknown | 10 | 10 |
| **Raw score** | **100** | **100** |

### Evidence Quality
**Assessment:** good but not perfect in structured-data terms

| Rule | Points | Result |
|---|---:|---|
| Initial analysis note exists | 20 | 20 |
| Meaningful note exists | 20 | 20 |
| Candidate apps documented where relevant | 20 | 10 *(discussed in notes, not structured)* |
| Dependencies / assumptions documented | 20 | 20 |
| Review date exists and is current | 20 | 20 |
| **Raw score** | **100** | **90** |

### Business Alignment
**Assessment:** complete

| Rule | Points | Result |
|---|---:|---|
| Business owner assigned | 25 | 25 |
| Business decision owner assigned | 25 | 25 |
| Business review completed | 25 | 25 |
| Business sign-off recorded | 25 | 25 |
| **Raw score** | **100** | **100** |

### Technical Alignment
**Assessment:** mostly strong, one key gap

| Rule | Points | Result |
|---|---:|---|
| Technical owner assigned | 25 | 25 |
| Technical decision owner assigned | 25 | 0 |
| Technical feasibility assessed / review completed | 25 | 25 |
| Technical sign-off recorded | 25 | 0 |
| **Raw score** | **100** | **50** |

### Execution Readiness
**Assessment:** strong for short-term execution

| Rule | Points | Result |
|---|---:|---|
| TSA target date exists | 30 | 30 |
| TSA status is not Not Started / Unknown | 20 | 20 |
| TSA disposition is actionable | 20 | 20 |
| TSA blockers / open issues documented | 15 | 15 |
| TSA target platform documented if relevant | 15 | 15 *(treated as not applicable / neutralized)* |
| **Raw score** | **100** | **100** |

### Stability / Consistency
**Assessment:** strong

| Rule | Points | Result |
|---|---:|---|
| No conflicting disposition data | 30 | 30 |
| No major unresolved contradictions in notes | 20 | 20 |
| No recent disposition churn | 20 | 20 |
| Required related fields are internally consistent | 30 | 30 |
| **Raw score** | **100** | **100** |

---

## 30.3 TSA weighted result

Using TSA weights:

| Factor | Raw Score | Weight % | Weighted Score |
|---|---:|---:|---:|
| Disposition Definition | 100 | 20 | 20.0 |
| Evidence Quality | 90 | 20 | 18.0 |
| Business Alignment | 100 | 20 | 20.0 |
| Technical Alignment | 50 | 20 | 10.0 |
| Execution Readiness | 100 | 15 | 15.0 |
| Stability / Consistency | 100 | 5 | 5.0 |
| **Calculated TSA Score** |  |  | **88.0** |

### TSA final result
- Calculated TSA score: **88**
- Manual adjustment: **0**
- Final TSA score: **88**
- Confidence band: **High**

### TSA interpretation
The transitional disposition is highly credible and operationally ready. The main gap is technical governance maturity, not the disposition itself.

---

## 30.4 Sample raw factor scoring – Long-term

### Disposition Definition
**Assessment:** strong

| Rule | Points | Result |
|---|---:|---|
| Long-term disposition selected | 35 | 35 |
| Long-term rationale documented | 25 | 25 |
| Long-term target date documented | 10 | 10 |
| Long-term target platform documented | 20 | 20 |
| Long-term disposition not TBD / Unknown | 10 | 10 |
| **Raw score** | **100** | **100** |

### Evidence Quality
**Assessment:** good, but candidate-app evidence still not fully structured

| Rule | Points | Result |
|---|---:|---|
| Initial analysis note exists | 20 | 20 |
| Meaningful note exists | 20 | 20 |
| Candidate apps documented where relevant | 20 | 10 |
| Dependencies / assumptions documented | 20 | 20 |
| Review date exists and is current | 20 | 20 |
| **Raw score** | **100** | **90** |

### Business Alignment
**Assessment:** mostly strong, but not fully approved

| Rule | Points | Result |
|---|---:|---|
| Business owner assigned | 25 | 25 |
| Business decision owner assigned | 25 | 25 |
| Business review completed | 25 | 25 |
| Business sign-off recorded | 25 | 0 |
| **Raw score** | **100** | **75** |

### Technical Alignment
**Assessment:** meaningful gaps remain

| Rule | Points | Result |
|---|---:|---|
| Technical owner assigned | 25 | 25 |
| Technical decision owner assigned | 25 | 0 |
| Technical feasibility assessed / review completed | 25 | 25 |
| Technical sign-off recorded | 25 | 0 |
| **Raw score** | **100** | **50** |

### Execution Readiness
**Assessment:** decent, but not fully locked down

| Rule | Points | Result |
|---|---:|---|
| Long-term target date exists | 20 | 20 |
| Long-term target platform exists | 30 | 30 |
| Long-term status reflects progression | 20 | 20 |
| Dependencies / blockers documented | 15 | 15 |
| Transition path or destination defined | 15 | 15 |
| **Raw score** | **100** | **100** |

### Stability / Consistency
**Assessment:** strong

| Rule | Points | Result |
|---|---:|---|
| No conflicting disposition data | 30 | 30 |
| No major unresolved contradictions in notes | 20 | 20 |
| No recent disposition churn | 20 | 20 |
| Required related fields are internally consistent | 30 | 30 |
| **Raw score** | **100** | **100** |

---

## 30.5 Long-term weighted result

Using Long-term weights:

| Factor | Raw Score | Weight % | Weighted Score |
|---|---:|---:|---:|
| Disposition Definition | 100 | 15 | 15.0 |
| Evidence Quality | 90 | 20 | 18.0 |
| Business Alignment | 75 | 20 | 15.0 |
| Technical Alignment | 50 | 25 | 12.5 |
| Execution Readiness | 100 | 10 | 10.0 |
| Stability / Consistency | 100 | 10 | 10.0 |
| **Calculated Long-term Score** |  |  | **80.5** |

### Long-term final result
- Calculated Long-term score: **81**
- Manual adjustment: **0**
- Final Long-term score: **81**
- Confidence band: **High**

### Long-term interpretation
The long-term disposition is directionally strong and reasonably well-supported, but still held back by incomplete technical decision ownership and missing technical sign-off.

---

## 30.6 Why this sample is useful

This sample demonstrates several important behaviors of the model:

- a score can still be high even when a few governance gaps remain
- technical alignment issues meaningfully reduce confidence without collapsing the full score
- notes and rationale materially help the score
- the model distinguishes between short-term execution confidence and long-term strategic confidence
- candidate-app structure matters, but absence of that structure does not make the whole model unusable in v1

---

## 30.7 Example UI narrative for this application

### Application list display
- TSA Confidence: **88 High**
- Long-term Confidence: **81 High**

### Detail page explanation
**What is helping confidence**
- Disposition and rationale are documented for both horizons
- Business ownership is clear
- Review activity is present
- Dependencies and transition notes exist

**What is lowering confidence**
- Technical decision owner is missing
- Technical sign-off is incomplete
- Candidate replacement-app evidence is not yet structured

---

## 30.8 Suggested follow-up actions from this sample

For this application, the next actions implied by the model would be:
- assign technical decision owner
- complete technical sign-off for TSA
- complete business and technical sign-off for Long-term
- convert candidate replacement-app evidence from notes into structured data when that capability exists

This is exactly the kind of work-queue behavior the confidence model should drive.

---

## Revision History

| Version | Date | Notes |
|---|---|---|
| v1.4 | 2026-03-29 | Added TypeScript confidence engine skeleton and repository/orchestration patterns |
| v1.3 | 2026-03-29 | Added Prisma schema draft and migration guidance |
| v1.2 | 2026-03-28 | Added developer checklist and build plan |
| v1.1 | 2026-03-28 | Added phased implementation plan |
| v1.0 | 2026-03-28 | Initial spec |

