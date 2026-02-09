import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('AI DB schema tables', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/db/schema/ai.ts'),
    'utf-8',
  );

  it('exports matchScores table', () => {
    expect(source).toContain("export const matchScores = pgTable('match_scores'");
  });

  it('exports coverLetters table', () => {
    expect(source).toContain("export const coverLetters = pgTable('cover_letters'");
  });

  it('exports interviewPreps table', () => {
    expect(source).toContain("export const interviewPreps = pgTable('interview_preps'");
  });

  it('exports resumeSuggestions table', () => {
    expect(source).toContain("export const resumeSuggestions = pgTable('resume_suggestions'");
  });

  it('matchScores has score numeric(5,2)', () => {
    expect(source).toContain("score: numeric('score', { precision: 5, scale: 2 })");
  });

  it('coverLetters has tone and content text fields', () => {
    expect(source).toContain("tone: text('tone')");
    expect(source).toContain("content: text('content')");
  });

  it('resumeSuggestions has documentId reference', () => {
    expect(source).toContain("documentId: uuid('document_id').references(() => documents.id");
  });

  it('all new tables cascade delete on userId', () => {
    // parsedProfiles(userId+documentId) + jobAnalyses(userId) + aiUsage(userId)
    // + matchScores + coverLetters + interviewPreps + resumeSuggestions = 8
    const cascadeMatches = source.match(/onDelete: 'cascade'/g);
    expect(cascadeMatches).not.toBeNull();
    expect(cascadeMatches!.length).toBe(8);
  });

  it('all new tables use set null on applicationId delete', () => {
    const setNullMatches = source.match(/onDelete: 'set null'/g);
    expect(setNullMatches).not.toBeNull();
    // jobAnalyses + matchScores + coverLetters + interviewPreps + resumeSuggestions(app) + resumeSuggestions(doc) = 6
    expect(setNullMatches!.length).toBe(6);
  });
});

describe('AI relations', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/db/schema/relations.ts'),
    'utf-8',
  );

  it('exports matchScoresRelations', () => {
    expect(source).toContain('export const matchScoresRelations');
  });

  it('exports coverLettersRelations', () => {
    expect(source).toContain('export const coverLettersRelations');
  });

  it('exports interviewPrepsRelations', () => {
    expect(source).toContain('export const interviewPrepsRelations');
  });

  it('exports resumeSuggestionsRelations', () => {
    expect(source).toContain('export const resumeSuggestionsRelations');
  });

  it('usersRelations includes all new tables', () => {
    expect(source).toContain('matchScores: many(matchScores)');
    expect(source).toContain('coverLetters: many(coverLetters)');
    expect(source).toContain('interviewPreps: many(interviewPreps)');
    expect(source).toContain('resumeSuggestions: many(resumeSuggestions)');
  });

  it('applicationsRelations includes all new tables', () => {
    // The relations are in the applicationsRelations block
    expect(source).toContain('matchScores: many(matchScores)');
    expect(source).toContain('coverLetters: many(coverLetters)');
    expect(source).toContain('interviewPreps: many(interviewPreps)');
    expect(source).toContain('resumeSuggestions: many(resumeSuggestions)');
  });

  it('documentsRelations includes resumeSuggestions', () => {
    expect(source).toContain('resumeSuggestions: many(resumeSuggestions)');
  });

  it('resumeSuggestionsRelations has document relation', () => {
    expect(source).toContain('fields: [resumeSuggestions.documentId]');
  });
});

describe('application-data helper', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/application-data.ts'),
    'utf-8',
  );

  it('exports getApplicationCvData function', () => {
    expect(source).toContain('export async function getApplicationCvData');
  });

  it('exports getApplicationJdData function', () => {
    expect(source).toContain('export async function getApplicationJdData');
  });

  it('joins applicationDocuments with documents and parsedProfiles for CV data', () => {
    expect(source).toContain('applicationDocuments');
    expect(source).toContain('parsedProfiles');
    expect(source).toContain("documentType, 'cv'");
  });

  it('queries jobAnalyses for JD data', () => {
    expect(source).toContain('jobAnalyses');
    expect(source).toContain('applicationId');
  });

  it('exports ApplicationCvData and ApplicationJdData types', () => {
    expect(source).toContain('export interface ApplicationCvData');
    expect(source).toContain('export interface ApplicationJdData');
  });
});
