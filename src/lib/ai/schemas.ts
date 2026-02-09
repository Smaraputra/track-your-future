import { z } from 'zod';

export const cvParsedDataSchema = z.object({
  name: z
    .string()
    .optional()
    .describe('Full name of the person'),
  email: z
    .string()
    .optional()
    .describe('Email address'),
  phone: z
    .string()
    .optional()
    .describe('Phone number'),
  location: z
    .string()
    .optional()
    .describe('City, state/province, or country'),
  linkedin: z
    .string()
    .optional()
    .describe('LinkedIn profile URL'),
  website: z
    .string()
    .optional()
    .describe('Personal website or portfolio URL'),
  summary: z
    .string()
    .optional()
    .describe('Professional summary or objective statement'),
  skills: z
    .array(z.string())
    .describe('List of technical and soft skills'),
  experience: z
    .array(
      z.object({
        company: z.string().describe('Company or organization name'),
        title: z.string().describe('Job title or position'),
        startDate: z.string().describe('Start date in YYYY-MM format'),
        endDate: z
          .string()
          .nullable()
          .describe('End date in YYYY-MM format, or null if current position'),
        current: z.boolean().describe('Whether this is the current position'),
        description: z
          .string()
          .optional()
          .describe('Job description, responsibilities, and achievements'),
      }),
    )
    .describe('Work experience entries in reverse chronological order'),
  education: z
    .array(
      z.object({
        institution: z.string().describe('School, university, or institution name'),
        degree: z.string().describe('Degree type (e.g., BSc, MSc, PhD, BA)'),
        field: z
          .string()
          .optional()
          .describe('Field of study or major'),
        startDate: z
          .string()
          .optional()
          .describe('Start date in YYYY-MM format'),
        endDate: z
          .string()
          .optional()
          .describe('End date or graduation date in YYYY-MM format'),
      }),
    )
    .describe('Education history'),
  certifications: z
    .array(
      z.object({
        name: z.string().describe('Certification or license name'),
        issuer: z
          .string()
          .optional()
          .describe('Issuing organization'),
        date: z
          .string()
          .optional()
          .describe('Date obtained in YYYY-MM format'),
      }),
    )
    .optional()
    .describe('Professional certifications and licenses'),
  languages: z
    .array(z.string())
    .optional()
    .describe('Languages spoken with proficiency level'),
});

export type CvParsedData = z.infer<typeof cvParsedDataSchema>;
