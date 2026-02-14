'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, ExternalLink, Sparkles } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { ApplicationStatusSelect } from './application-status-select';
import { ApplicationStatusTimeline } from './application-status-timeline';
import { ApplicationDocumentLinker } from './application-document-linker';
import { DeleteApplicationDialog } from './delete-application-dialog';
import { ExtractJdButton } from './extract-jd-button';
import { JdAnalysisViewer } from './jd-analysis-viewer';
import { MatchScoreButton } from './match-score-button';
import { MatchScoreViewer } from './match-score-viewer';
import { CoverLetterSection } from './cover-letter-section';
import { CoverLetterViewer } from './cover-letter-viewer';
import { InterviewPrepButton } from './interview-prep-button';
import { InterviewPrepViewer } from './interview-prep-viewer';
import { ResumeSuggestionsButton } from './resume-suggestions-button';
import { ResumeSuggestionsViewer } from './resume-suggestions-viewer';
import { MatchScoreActions } from './match-score-actions';
import { type ApplicationItem } from './applications-page-content';
import type { JdExtractedData, MatchScoreResult, InterviewPrepResult, ResumeSuggestionResult } from '@/lib/ai/schemas';

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
}

interface LinkedDocument {
  id: string;
  fileName: string;
  documentType: string;
  customTypeName: string | null;
}

interface AvailableDocument {
  id: string;
  fileName: string;
  documentType: string;
}

interface JobAnalysisData {
  id: string;
  analysis: unknown;
  createdAt: string;
}

interface MatchScoreData {
  id: string;
  score: string;
  result: unknown;
  createdAt: string;
}

interface CoverLetterData {
  id: string;
  tone: string;
  content: string;
  createdAt: string;
}

interface InterviewPrepData {
  id: string;
  result: unknown;
  createdAt: string;
}

interface ResumeSuggestionsData {
  id: string;
  result: unknown;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface ApplicationDetailProps {
  application: ApplicationItem;
  statusHistory: StatusHistoryEntry[];
  linkedDocuments: LinkedDocument[];
  availableDocuments: AvailableDocument[];
  isPro: boolean;
  hasParsedCv: boolean;
  jobAnalysis: JobAnalysisData | null;
  matchScore: MatchScoreData | null;
  coverLetter: CoverLetterData | null;
  interviewPrep: InterviewPrepData | null;
  resumeSuggestions: ResumeSuggestionsData | null;
  roles?: Role[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ApplicationDetail({
  application: initialApp,
  statusHistory: initialHistory,
  linkedDocuments: initialLinkedDocs,
  availableDocuments: initialAvailableDocs,
  isPro,
  hasParsedCv: initialHasParsedCv,
  jobAnalysis: initialJobAnalysis,
  matchScore: initialMatchScore,
  coverLetter: initialCoverLetter,
  interviewPrep: initialInterviewPrep,
  resumeSuggestions: initialResumeSuggestions,
  roles,
}: ApplicationDetailProps) {
  const [application, setApplication] = useState(initialApp);
  const [statusHistory, setStatusHistory] = useState(initialHistory);
  const [linkedDocuments, setLinkedDocuments] = useState(initialLinkedDocs);
  const [availableDocuments, setAvailableDocuments] =
    useState(initialAvailableDocs);
  const [jobAnalysis, setJobAnalysis] = useState(initialJobAnalysis);
  const [matchScore, setMatchScore] = useState(initialMatchScore);
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [interviewPrep, setInterviewPrep] = useState(initialInterviewPrep);
  const [resumeSuggestions, setResumeSuggestions] = useState(initialResumeSuggestions);
  const [hasParsedCv] = useState(initialHasParsedCv);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshDetail = useCallback(async () => {
    const res = await fetch(`/api/applications/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setApplication({
        id: data.id,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl,
        currentStatus: data.currentStatus,
        appliedAt: data.appliedAt
          ? new Date(data.appliedAt).toISOString()
          : null,
        roleCategoryId: data.roleCategoryId,
        roleCategoryName: data.roleCategoryName,
        roleCategoryColor: data.roleCategoryColor,
        createdAt: new Date(data.createdAt).toISOString(),
        updatedAt: new Date(data.updatedAt).toISOString(),
        notes: data.notes,
      });
      setStatusHistory(
        data.statusHistory.map(
          (h: { id: string; fromStatus: string | null; toStatus: string; changedAt: string }) => ({
            ...h,
            changedAt: new Date(h.changedAt).toISOString(),
          }),
        ),
      );
      setLinkedDocuments(data.linkedDocuments);
    }
  }, [application.id]);

  const refreshDocuments = useCallback(async () => {
    const [detailRes, docsRes] = await Promise.all([
      fetch(`/api/applications/${application.id}`),
      fetch('/api/documents'),
    ]);

    if (detailRes.ok) {
      const detail = await detailRes.json();
      setLinkedDocuments(detail.linkedDocuments);
      setStatusHistory(
        detail.statusHistory.map(
          (h: { id: string; fromStatus: string | null; toStatus: string; changedAt: string }) => ({
            ...h,
            changedAt: new Date(h.changedAt).toISOString(),
          }),
        ),
      );
    }

    if (docsRes.ok) {
      const docs = await docsRes.json();
      setAvailableDocuments(docs);
    }
  }, [application.id]);

  const refreshMatchScore = useCallback(async () => {
    const res = await fetch(`/api/ai/match/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setMatchScore({
        id: data.id,
        score: data.score,
        result: data.result,
        createdAt: data.createdAt,
      });
    }
  }, [application.id]);

  const refreshInterviewPrep = useCallback(async () => {
    const res = await fetch(`/api/ai/interview-prep/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setInterviewPrep({
        id: data.id,
        result: data.result,
        createdAt: data.createdAt,
      });
    }
  }, [application.id]);

  const refreshCoverLetter = useCallback(async () => {
    const res = await fetch(`/api/ai/cover-letter/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setCoverLetter({
        id: data.id,
        tone: data.tone,
        content: data.content,
        createdAt: data.createdAt,
      });
    }
  }, [application.id]);

  const refreshResumeSuggestions = useCallback(async () => {
    const res = await fetch(`/api/ai/resume-suggestions/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setResumeSuggestions({
        id: data.id,
        result: data.result,
        createdAt: data.createdAt,
      });
    }
  }, [application.id]);

  const refreshJobAnalysis = useCallback(async () => {
    const res = await fetch(`/api/ai/extract-jd/${application.id}`);
    if (res.ok) {
      const data = await res.json();
      setJobAnalysis({
        id: data.id,
        analysis: data.analysis,
        createdAt: data.createdAt,
      });
    }
  }, [application.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-primary text-2xl">
            {application.companyName}
          </h1>
          <p className="font-body text-muted-foreground text-sm">
            {application.jobTitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {application.jobUrl && (
            <RetroButton variant="secondary" size="sm" asChild>
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Open Job Site
              </a>
            </RetroButton>
          )}
          <RetroButton variant="secondary" size="sm" asChild>
            <Link href={`/applications/${application.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </RetroButton>
          <RetroButton
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </RetroButton>
        </div>
      </div>

      {/* Status */}
      <div className="border-border rounded-md border p-4">
        <h2 className="font-heading text-foreground mb-3 text-lg">Status</h2>
        <ApplicationStatusSelect
          applicationId={application.id}
          currentStatus={application.currentStatus}
          onStatusChanged={refreshDetail}
        />
      </div>

      {/* Info */}
      <div className="border-border rounded-md border p-4">
        <h2 className="font-heading text-foreground mb-3 text-lg">Details</h2>
        <dl className="font-body space-y-2 text-sm">
          {application.roleCategoryName && (
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground w-24 shrink-0">Role</dt>
              <dd
                style={
                  application.roleCategoryColor
                    ? { color: application.roleCategoryColor }
                    : undefined
                }
              >
                {application.roleCategoryName}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground w-24 shrink-0">Applied</dt>
            <dd>{formatDate(application.appliedAt)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground w-24 shrink-0">Created</dt>
            <dd>{formatDate(application.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes */}
      {application.notes && (
        <div className="border-border rounded-md border p-4">
          <h2 className="font-heading text-foreground mb-3 text-lg">Notes</h2>
          <p className="font-body text-foreground whitespace-pre-wrap text-sm">
            {application.notes}
          </p>
        </div>
      )}

      {/* Status History */}
      <div className="border-border rounded-md border p-4">
        <h2 className="font-heading text-foreground mb-3 text-lg">
          Status History
        </h2>
        <ApplicationStatusTimeline history={statusHistory} />
      </div>

      {/* Documents */}
      <div className="border-border rounded-md border p-4">
        <h2 className="font-heading text-foreground mb-3 text-lg">
          Documents
        </h2>
        <ApplicationDocumentLinker
          applicationId={application.id}
          linkedDocuments={linkedDocuments}
          availableDocuments={availableDocuments}
          onChanged={refreshDocuments}
          roles={roles}
        />
      </div>

      {/* Job Description Analysis */}
      <div className="border-border rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-foreground text-lg">
            Job Description
          </h2>
          <ExtractJdButton
            applicationId={application.id}
            jobUrl={application.jobUrl}
            hasAnalysis={!!jobAnalysis}
            onExtracted={refreshJobAnalysis}
          />
        </div>
        {jobAnalysis ? (
          <JdAnalysisViewer
            data={jobAnalysis.analysis as JdExtractedData}
          />
        ) : (
          <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            {application.jobUrl
              ? 'Click "Extract JD" to analyze the job posting'
              : 'Paste a job description or add a URL to enable extraction'}
          </p>
        )}
      </div>

      {/* Match Score */}
      <div id="section-match-score" className="border-border rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-foreground text-lg">Match Score</h2>
          <MatchScoreButton
            applicationId={application.id}
            hasScore={!!matchScore}
            hasParsedCv={hasParsedCv}
            hasJdAnalysis={!!jobAnalysis}
            onScored={refreshMatchScore}
          />
        </div>
        {matchScore ? (
          <>
            <MatchScoreViewer
              data={matchScore.result as MatchScoreResult}
            />
            <MatchScoreActions
              overallScore={(matchScore.result as MatchScoreResult).overallScore}
              hasParsedCv={hasParsedCv}
              hasJdAnalysis={!!jobAnalysis}
              isPro={isPro}
              hasResumeSuggestions={!!resumeSuggestions}
              hasCoverLetter={!!coverLetter}
              hasInterviewPrep={!!interviewPrep}
            />
          </>
        ) : (
          <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            {!hasParsedCv && !jobAnalysis
              ? 'Parse a CV and extract the JD to enable match scoring'
              : !hasParsedCv
                ? 'Parse a CV to enable match scoring'
                : !jobAnalysis
                  ? 'Extract the JD to enable match scoring'
                  : 'Click "Score Match" to analyze fit'}
          </p>
        )}
      </div>

      {/* Cover Letter */}
      <div id="section-cover-letter" className="border-border rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-foreground text-lg">
            Cover Letter
          </h2>
          <CoverLetterSection
            applicationId={application.id}
            hasParsedCv={hasParsedCv}
            hasJdAnalysis={!!jobAnalysis}
            isPro={isPro}
            onGenerated={refreshCoverLetter}
          />
        </div>
        {coverLetter ? (
          <CoverLetterViewer
            content={coverLetter.content}
            tone={coverLetter.tone}
          />
        ) : (
          <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            {!isPro
              ? 'Pro plan required for cover letter generation'
              : !hasParsedCv || !jobAnalysis
                ? 'Parse a CV and extract the JD to generate a cover letter'
                : 'Select a tone and click "Generate" to create a cover letter'}
          </p>
        )}
      </div>

      {/* Interview Prep */}
      <div id="section-interview-prep" className="border-border rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-foreground text-lg">
            Interview Prep
          </h2>
          <InterviewPrepButton
            applicationId={application.id}
            hasPrep={!!interviewPrep}
            hasJdAnalysis={!!jobAnalysis}
            isPro={isPro}
            onGenerated={refreshInterviewPrep}
          />
        </div>
        {interviewPrep ? (
          <InterviewPrepViewer
            data={interviewPrep.result as InterviewPrepResult}
          />
        ) : (
          <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            {!isPro
              ? 'Pro plan required for interview prep'
              : !jobAnalysis
                ? 'Extract the JD to generate interview prep'
                : 'Click "Generate" to create interview preparation materials'}
          </p>
        )}
      </div>

      {/* Resume Suggestions */}
      <div id="section-resume-suggestions" className="border-border rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-foreground text-lg">
            Resume Suggestions
          </h2>
          <ResumeSuggestionsButton
            applicationId={application.id}
            hasSuggestions={!!resumeSuggestions}
            hasParsedCv={hasParsedCv}
            isPro={isPro}
            onGenerated={refreshResumeSuggestions}
          />
        </div>
        {resumeSuggestions ? (
          <ResumeSuggestionsViewer
            data={resumeSuggestions.result as ResumeSuggestionResult}
          />
        ) : (
          <p className="font-body text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            {!isPro
              ? 'Pro plan required for resume suggestions'
              : !hasParsedCv
                ? 'Parse a CV to enable resume suggestions'
                : 'Click "Generate" to get resume improvement suggestions'}
          </p>
        )}
      </div>

      <DeleteApplicationDialog
        applicationId={application.id}
        companyName={application.companyName}
        jobTitle={application.jobTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
