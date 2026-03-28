import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  const [
    totalApplications,
    withOwnership,
    withNotes,
    tsaDecisions,
    longTermDecisions,
    businessAreaGroups,
    tsaDispositionGroups,
    longTermDispositionGroups,
  ] = await Promise.all([
    prisma.application.count(),

    prisma.application.count({
      where: {
        Ownership: {
          some: {},
        },
      },
    }),

    prisma.application.count({
      where: {
        Note: {
          some: {},
        },
      },
    }),

    prisma.dispositionDecision.count({
      where: {
        decisionHorizon: "TSA_EXPIRATION",
      },
    }),

    prisma.dispositionDecision.count({
      where: {
        decisionHorizon: "LONG_TERM",
      },
    }),

    prisma.application.groupBy({
      by: ["businessArea"],
      _count: {
        businessArea: true,
      },
      orderBy: {
        _count: {
          businessArea: "desc",
        },
      },
    }),

    prisma.dispositionDecision.groupBy({
      by: ["targetDisposition"],
      where: {
        decisionHorizon: "TSA_EXPIRATION",
      },
      _count: {
        targetDisposition: true,
      },
      orderBy: {
        _count: {
          targetDisposition: "desc",
        },
      },
    }),

    prisma.dispositionDecision.groupBy({
      by: ["targetDisposition"],
      where: {
        decisionHorizon: "LONG_TERM",
      },
      _count: {
        targetDisposition: true,
      },
      orderBy: {
        _count: {
          targetDisposition: "desc",
        },
      },
    }),
  ]);

  return {
    totalApplications,
    withOwnership,
    withNotes,
    tsaDecisions,
    longTermDecisions,

    businessArea: businessAreaGroups.map((row) => ({
      label: row.businessArea ?? "Unspecified",
      count: row._count.businessArea,
    })),

    tsaDisposition: tsaDispositionGroups.map((row) => ({
      label: row.targetDisposition ?? "Unspecified",
      count: row._count.targetDisposition,
    })),

    longTermDisposition: longTermDispositionGroups.map((row) => ({
      label: row.targetDisposition ?? "Unspecified",
      count: row._count.targetDisposition,
    })),
  };
}
