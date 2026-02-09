import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { applicationDocuments } from '@/db/schema/applications';
import { documents } from '@/db/schema/core';
import { parsedProfiles, jobAnalyses } from '@/db/schema/ai';
import type { CvParsedData, JdExtractedData } from './schemas';

export interface ApplicationCvData {
  parsedData: CvParsedData;
  documentId: string;
}

export interface ApplicationJdData {
  analysis: JdExtractedData;
  jobAnalysisId: string;
}

export async function getApplicationCvData(
  applicationId: string,
  userId: string,
): Promise<ApplicationCvData | null> {
  const rows = await db
    .select({
      parsedData: parsedProfiles.parsedData,
      documentId: parsedProfiles.documentId,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .innerJoin(parsedProfiles, eq(parsedProfiles.documentId, documents.id))
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        eq(documents.documentType, 'cv'),
        eq(documents.userId, userId),
        eq(parsedProfiles.userId, userId),
      ),
    )
    .limit(1);

  if (rows.length === 0) return null;

  return {
    parsedData: rows[0].parsedData as CvParsedData,
    documentId: rows[0].documentId,
  };
}

export async function getApplicationJdData(
  applicationId: string,
  userId: string,
): Promise<ApplicationJdData | null> {
  const analysis = await db.query.jobAnalyses.findFirst({
    where: and(
      eq(jobAnalyses.applicationId, applicationId),
      eq(jobAnalyses.userId, userId),
    ),
  });

  if (!analysis) return null;

  return {
    analysis: analysis.analysis as JdExtractedData,
    jobAnalysisId: analysis.id,
  };
}
