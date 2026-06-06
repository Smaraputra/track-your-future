import { randomBytes } from 'crypto';

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}
const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// MinIO / S3
// ---------------------------------------------------------------------------
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
const MINIO_PORT = process.env.MINIO_PORT ?? '9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const BUCKET = process.env.MINIO_BUCKET ?? 'tyf-documents';

const protocol = MINIO_USE_SSL ? 'https' : 'http';
const s3 = new S3Client({
  endpoint: `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
  region: 'us-east-1',
  credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY },
  forcePathStyle: true,
});

let minioAvailable = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PREFIX = '00000000-0000-4000-8000-';
/** Build a deterministic UUID from a 12-char hex suffix. */
function sid(hex12) {
  return `${PREFIX}${hex12}`;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Create a minimal valid PDF 1.4 with a single page of text. */
function createPlaceholderPdf(title, body) {
  const escaped = (s) => s.replace(/[()\\]/g, '\\$&');
  const line1 = `BT /F1 14 Tf 72 720 Td (${escaped(title)}) Tj ET`;
  const line2 = `BT /F1 10 Tf 72 700 Td (${escaped(body)}) Tj ET`;
  const stream = `${line1}\n${line2}`;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj';
  const obj4 = `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj';

  const objects = [obj1, obj2, obj3, obj4, obj5];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
}

function buildFileKey(userId, roleId, docType, docId, version, fileName) {
  const roleSegment = roleId ?? 'unassigned';
  return `${userId}/${roleSegment}/${docType}/${docId}/v${version}/${fileName}`;
}

async function uploadToMinio(fileKey, buffer, mimeType) {
  if (!minioAvailable) return;
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
    }));
  } catch (err) {
    console.warn(`    Warning: failed to upload ${fileKey}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// User 1 -- Demo (Free tier)
// ---------------------------------------------------------------------------
const U1 = sid('000000000001');
const U1_SUB = sid('000000000002');

const U1_ROLES = [
  { id: sid('000000000010'), name: 'Software Engineer', color: '#22c55e', desc: null },
  { id: sid('000000000011'), name: 'Data Scientist', color: '#3b82f6', desc: null },
  { id: sid('000000000012'), name: 'Product Manager', color: '#f59e0b', desc: null },
];

const U1_FIELDS = [
  { roleIdx: 0, key: 'Years of Experience', value: '5 years' },
  { roleIdx: 0, key: 'Tech Stack', value: 'TypeScript, React, Node.js, PostgreSQL, AWS' },
  { roleIdx: 0, key: 'Salary Expectation', value: '$120,000 - $150,000' },
  { roleIdx: 1, key: 'Years of Experience', value: '3 years' },
  { roleIdx: 1, key: 'Tech Stack', value: 'Python, TensorFlow, PyTorch, SQL, Spark' },
  { roleIdx: 1, key: 'Salary Expectation', value: '$130,000 - $160,000' },
  { roleIdx: 2, key: 'Years of Experience', value: '4 years' },
  { roleIdx: 2, key: 'Domain Expertise', value: 'B2B SaaS, Developer Tools, Platform Products' },
  { roleIdx: 2, key: 'Salary Expectation', value: '$140,000 - $170,000' },
];

const U1_DOCS = [
  { id: sid('0000000001a0'), roleIdx: 0, type: 'cv', fileName: 'alex-morgan-cv.pdf', title: 'Alex Morgan - Software Engineer CV', body: 'Experienced full-stack engineer - TypeScript, React, Node.js, AWS' },
  { id: sid('0000000001a1'), roleIdx: 1, type: 'cv', fileName: 'alex-morgan-ds-cv.pdf', title: 'Alex Morgan - Data Science CV', body: 'Software engineer pivoting to data science - Python, SQL, analytics' },
  { id: sid('0000000001a2'), roleIdx: null, type: 'cover_letter', fileName: 'general-cover-letter.pdf', title: 'General Cover Letter', body: 'Versatile cover letter template for various applications' },
];

const U1_APPS = [
  { id: sid('000000000030'), company: 'Acme Corp', title: 'Senior Software Engineer', status: 'draft', roleIdx: 0, url: 'https://acme.com/careers/senior-swe', notes: 'Interesting team, good tech stack. Need to tailor CV.' },
  { id: sid('000000000031'), company: 'TechStart Inc', title: 'Full Stack Developer', status: 'applied', roleIdx: 0, url: 'https://techstart.io/jobs/fsd-42', notes: 'Applied via referral from Sarah.' },
  { id: sid('000000000032'), company: 'DataFlow AI', title: 'ML Engineer', status: 'phone_screen', roleIdx: 1, url: 'https://dataflow.ai/careers', notes: 'Recruiter reached out on LinkedIn. Phone screen scheduled for next week.' },
  { id: sid('000000000033'), company: 'CloudNine', title: 'Backend Engineer', status: 'interview', roleIdx: 0, url: 'https://cloudnine.dev/jobs/backend', notes: 'Completed system design round. Waiting for final loop.' },
  { id: sid('000000000034'), company: 'Quantum Labs', title: 'Data Scientist', status: 'offer', roleIdx: 1, url: null, notes: 'Offer received: $145K base + equity. Need to negotiate.' },
  { id: sid('000000000035'), company: 'NexGen', title: 'Product Manager', status: 'rejected', roleIdx: 2, url: 'https://nexgen.co/pm-role', notes: 'Rejected after second round. Feedback: need more PM experience.' },
  { id: sid('000000000036'), company: 'Innovate Co', title: 'Senior PM', status: 'applied', roleIdx: 2, url: null, notes: null },
  { id: sid('000000000037'), company: 'Meta Systems', title: 'Software Engineer', status: 'interview', roleIdx: 0, url: 'https://metasystems.io/jobs/swe', notes: 'On-site interview completed. Team seemed enthusiastic.' },
];

const U1_APP_DOCS = [
  { appId: sid('000000000030'), docId: sid('0000000001a0') },
  { appId: sid('000000000031'), docId: sid('0000000001a2') },
];

// ---------------------------------------------------------------------------
// User 1 -- AI data
// ---------------------------------------------------------------------------
const U1_PARSED_PROFILE = {
  id: sid('0000000001b0'),
  docId: sid('0000000001a0'),
  confidence: '0.92',
  data: {
    name: 'Alex Morgan',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/alexmorgan',
    website: 'https://alexmorgan.dev',
    summary: 'Full-stack software engineer with 5 years of experience building scalable web applications. Passionate about clean architecture, developer experience, and open-source contributions.',
    skills: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs', 'CI/CD', 'Git', 'Agile/Scrum'],
    experience: [
      { company: 'StreamLine Tech', title: 'Senior Software Engineer', startDate: '2022-03', endDate: null, current: true, description: 'Led development of a real-time analytics platform processing 2M+ events/day. Designed microservices architecture, mentored 3 junior engineers, and reduced deployment time by 60% through CI/CD improvements.' },
      { company: 'DataPulse Inc', title: 'Software Engineer', startDate: '2020-01', endDate: '2022-02', current: false, description: 'Built customer-facing dashboards with React and D3.js. Implemented RESTful APIs with Node.js and Express. Migrated monolithic application to microservices, improving system reliability to 99.9% uptime.' },
      { company: 'CodeCraft Labs', title: 'Junior Developer', startDate: '2019-06', endDate: '2019-12', current: false, description: 'Developed internal tools using Python and Flask. Created automated testing suite that increased code coverage from 40% to 85%.' },
    ],
    education: [
      { institution: 'University of California, Berkeley', degree: 'BSc', field: 'Computer Science', startDate: '2015-08', endDate: '2019-05' },
    ],
    certifications: [
      { name: 'AWS Solutions Architect Associate', issuer: 'Amazon Web Services', date: '2023-06' },
      { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2024-01' },
    ],
    languages: ['English (Native)', 'Spanish (Conversational)'],
  },
};

const U1_JOB_ANALYSES = [
  {
    id: sid('0000000001c0'),
    appId: sid('000000000030'), // Acme Corp
    sourceUrl: 'https://acme.com/careers/senior-swe',
    analysis: {
      companyName: 'Acme Corp',
      jobTitle: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
      preferredSkills: ['GraphQL', 'Kubernetes', 'Redis', 'CI/CD pipelines'],
      experienceYears: 5,
      educationRequired: "Bachelor's in Computer Science or related field",
      responsibilities: ['Design and implement scalable backend services', 'Lead technical design reviews and mentor junior engineers', 'Collaborate with product and design teams on feature development', 'Improve system reliability, performance, and observability'],
      benefits: ['Competitive salary with equity', 'Comprehensive health, dental, and vision insurance', 'Flexible PTO policy', 'Annual learning budget ($3,000)', 'Home office stipend'],
    },
  },
  {
    id: sid('0000000001c1'),
    appId: sid('000000000032'), // DataFlow AI
    sourceUrl: 'https://dataflow.ai/careers/ml-engineer',
    analysis: {
      companyName: 'DataFlow AI',
      jobTitle: 'ML Engineer',
      location: 'Remote (US)',
      locationType: 'remote',
      salaryMin: 140000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Machine Learning'],
      preferredSkills: ['Spark', 'MLflow', 'Kubernetes', 'Data pipelines'],
      experienceYears: 3,
      educationRequired: "Master's in CS, Statistics, or related field preferred",
      responsibilities: ['Design and train ML models for recommendation systems', 'Build and maintain ML pipelines', 'Collaborate with data scientists to productionize research', 'Monitor model performance and implement automated retraining'],
      benefits: ['Fully remote work', 'Stock options', 'Health and wellness stipend', 'Conference attendance budget'],
    },
  },
];

const U1_MATCH_SCORES = [
  {
    id: sid('0000000001d0'),
    appId: sid('000000000030'), // Acme Corp
    score: '82.00',
    result: {
      overallScore: 82,
      skillsMatch: 90,
      experienceMatch: 80,
      educationMatch: 85,
      keywordCoverage: 73,
      strengths: ['Strong TypeScript and React expertise directly matching requirements', 'AWS certification demonstrates cloud proficiency', '5 years experience meets the minimum requirement', 'Previous experience leading development and mentoring aligns with role'],
      weaknesses: ['No explicit GraphQL experience mentioned (listed as preferred)', 'Current role focuses on analytics; role emphasizes general backend services', 'No mention of observability tools (Datadog, New Relic)'],
      suggestions: ['Add GraphQL experience from side projects or coursework', 'Highlight the microservices migration as backend systems design experience', 'Mention specific observability and monitoring tools used', 'Quantify the impact of CI/CD improvements with deployment frequency metrics'],
    },
  },
  {
    id: sid('0000000001d1'),
    appId: sid('000000000032'), // DataFlow AI
    score: '45.00',
    result: {
      overallScore: 45,
      skillsMatch: 30,
      experienceMatch: 50,
      educationMatch: 60,
      keywordCoverage: 35,
      strengths: ['Strong SQL and data handling experience', 'BSc in Computer Science meets minimum education', 'Experience working with data-heavy applications at DataPulse'],
      weaknesses: ['No Python, TensorFlow, or PyTorch listed in skills', 'No machine learning or data science work history', 'Role prefers Masters degree; candidate has only BSc', 'Missing MLOps and ML pipeline experience'],
      suggestions: ['This role is a significant pivot from current backend/fullstack experience', 'Consider completing ML courses (fast.ai, Coursera ML specialization)', 'Highlight data analysis or statistical work from existing roles', 'Consider ML-adjacent roles (ML Platform Engineer) as a stepping stone'],
    },
  },
];

const U1_COVER_LETTER = {
  id: sid('0000000001e0'),
  appId: sid('000000000031'), // TechStart Inc
  tone: 'professional',
  content: `Dear Hiring Manager,

I am writing to express my strong interest in the Full Stack Developer position at TechStart Inc. With five years of experience building scalable web applications using TypeScript, React, and Node.js, I am confident I can contribute meaningfully to your team.

In my current role as Senior Software Engineer at StreamLine Tech, I lead the development of a real-time analytics platform that processes over 2 million events daily. I designed the microservices architecture from the ground up and implemented CI/CD pipelines that reduced deployment time by 60%. This experience has sharpened my ability to build reliable, high-throughput systems.

Previously at DataPulse Inc, I built customer-facing dashboards using React and D3.js, and led the migration from a monolithic architecture to microservices. This project improved system reliability to 99.9% uptime while serving growing traffic. I thrive at the intersection of frontend polish and backend robustness.

What draws me to TechStart is your commitment to developer experience and your rapid growth trajectory. I am eager to bring my full-stack expertise and passion for clean code to help build products that developers love.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.

Best regards,
Alex Morgan`,
};

const U1_INTERVIEW_PREP = {
  id: sid('0000000001f0'),
  appId: sid('000000000033'), // CloudNine
  result: {
    categories: [
      {
        name: 'behavioral',
        questions: [
          {
            question: 'Tell me about a time you had to lead a technical decision that others disagreed with.',
            starHint: 'Situation: Describe the disagreement. Task: Your role. Action: How you built consensus. Result: Outcome.',
            suggestedAnswer: 'At StreamLine Tech, I proposed migrating our monolithic deployment to containerized microservices. Several senior engineers preferred the existing VM-based approach. I organized a proof-of-concept sprint, documenting performance benchmarks and failure recovery scenarios. After presenting the data, the team agreed to a phased migration. We achieved 60% faster deployments and 99.95% uptime post-migration.',
          },
          {
            question: 'Describe a situation where you had to mentor someone who was struggling.',
            starHint: 'Situation: Who was struggling and why. Task: What was expected. Action: Mentoring approach. Result: Improvement.',
            suggestedAnswer: 'A junior engineer was struggling with async patterns in our Node.js codebase. I set up weekly pair programming sessions focused on Promises and async/await, created a reading list, and assigned progressively complex tasks. Within two months, they were independently shipping features and gave a tech talk on async error handling.',
          },
        ],
      },
      {
        name: 'technical',
        questions: [
          {
            question: 'How would you design a real-time notification system that scales to millions of users?',
            starHint: 'Structure: Requirements, architecture, trade-offs, scaling.',
            suggestedAnswer: 'I would use a pub/sub architecture with Redis or Kafka as the message broker. WebSocket connections from clients go to a stateless gateway service. Events publish to relevant topics, consumer services fan out to connected sessions via user-to-server mapping in Redis. For offline users, persist to PostgreSQL and deliver on reconnection. Scale horizontally by adding gateway instances behind a load balancer.',
          },
          {
            question: 'Explain how you would optimize a slow PostgreSQL query joining three tables with millions of rows.',
            starHint: 'Structure: Diagnosis, specific techniques, measuring results.',
            suggestedAnswer: 'Run EXPLAIN ANALYZE to understand the plan and identify sequential scans. Add composite indexes on join and WHERE columns, use partial indexes for filtered subsets, rewrite subqueries as CTEs or lateral joins. Check statistics with ANALYZE, consider partitioning for 100M+ row tables. Measure before/after with pg_stat_statements.',
          },
        ],
      },
      {
        name: 'situational',
        questions: [
          {
            question: 'You discover a critical security vulnerability in production on a Friday evening. What do you do?',
            starHint: 'Structure: Immediate response, communication, remediation, post-mortem.',
            suggestedAnswer: 'Assess severity and blast radius first. If data is actively at risk, disable the affected endpoint immediately. Notify the security lead and engineering manager. Deploy a hotfix or feature flag to mitigate. Document the timeline and impact. Schedule a post-mortem for Monday to identify root cause and preventive measures.',
          },
        ],
      },
    ],
  },
};

const U1_RESUME_SUGGESTIONS = {
  id: sid('000000000190'),
  appId: sid('000000000030'), // Acme Corp
  docId: sid('0000000001a0'),
  result: {
    suggestions: [
      { category: 'keywords', title: 'Add missing required keywords', description: 'The JD emphasizes "system design" and "observability" not mentioned in your CV. Adding these improves ATS pass-through rates.', before: 'Led development of a real-time analytics platform', after: 'Led system design and development of a real-time analytics platform with comprehensive observability (logging, metrics, tracing)', priority: 'high' },
      { category: 'impact', title: 'Quantify mentoring impact', description: 'Mentoring experience lacks measurable outcomes. Hiring managers look for leadership impact metrics.', before: 'mentored 3 junior engineers', after: 'mentored 3 junior engineers, all promoted within 18 months; two now lead their own feature teams', priority: 'high' },
      { category: 'content', title: 'Add dedicated technical skills section', description: 'A formatted skills section helps recruiters and ATS quickly identify qualifications. Group by category: languages, frameworks, infrastructure, tools.', priority: 'medium' },
      { category: 'formatting', title: 'Use consistent date formatting', description: 'Standardize date format throughout the CV for a polished appearance.', before: 'March 2022 - Present ... 2020-01 to 2022-02', after: 'Mar 2022 - Present ... Jan 2020 - Feb 2022', priority: 'low' },
      { category: 'content', title: 'Expand open-source contributions', description: 'Summary mentions open-source passion but experience section has no evidence. Add a projects section or mention specific contributions.', priority: 'medium' },
    ],
  },
};

const U1_AI_USAGE = [
  { feature: 'parse', model: 'gpt-4o-mini', inputTokens: 2400, outputTokens: 800, costCents: '0.0180', daysAgo: 25 },
  { feature: 'jd_extraction', model: 'gpt-4o-mini', inputTokens: 3200, outputTokens: 600, costCents: '0.0210', daysAgo: 24 },
  { feature: 'jd_extraction', model: 'gpt-4o-mini', inputTokens: 2800, outputTokens: 550, costCents: '0.0190', daysAgo: 20 },
  { feature: 'match', model: 'gpt-4o-mini', inputTokens: 4500, outputTokens: 1200, costCents: '0.0420', daysAgo: 23 },
  { feature: 'match', model: 'gpt-4o-mini', inputTokens: 4200, outputTokens: 1100, costCents: '0.0390', daysAgo: 19 },
  { feature: 'cover_letter', model: 'gpt-4o-mini', inputTokens: 3800, outputTokens: 2400, costCents: '0.0600', daysAgo: 18 },
  { feature: 'interview_prep', model: 'gpt-4o-mini', inputTokens: 3500, outputTokens: 3200, costCents: '0.0780', daysAgo: 10 },
];

const U1_NOTIFICATIONS = [
  { id: sid('000000000170'), type: 'milestone', title: 'First Application Created', body: 'You created your first job application. The journey begins!', isRead: true, appId: sid('000000000030'), daysAgo: 28 },
  { id: sid('000000000171'), type: 'milestone', title: 'First Offer Received', body: 'Congratulations! You received your first job offer from Quantum Labs.', isRead: false, appId: sid('000000000034'), daysAgo: 3 },
  { id: sid('000000000172'), type: 'stale_app', title: 'Application needs attention', body: 'Your application to Acme Corp has not been updated in 14 days.', isRead: false, appId: sid('000000000030'), daysAgo: 1 },
  { id: sid('000000000173'), type: 'follow_up', title: 'Follow up reminder', body: 'Consider following up on your application to TechStart Inc.', isRead: true, appId: sid('000000000031'), daysAgo: 5 },
];

// ---------------------------------------------------------------------------
// User 2 -- Pro
// ---------------------------------------------------------------------------
const U2 = sid('000000000200');
const U2_SUB = sid('000000000201');

const U2_ROLES = [
  { id: sid('000000000210'), name: 'Frontend Developer', color: '#06b6d4', desc: 'React, Vue, and design system roles' },
  { id: sid('000000000211'), name: 'Backend Developer', color: '#8b5cf6', desc: 'Server-side, APIs, and infrastructure' },
  { id: sid('000000000212'), name: 'DevOps Engineer', color: '#ef4444', desc: 'Cloud, CI/CD, and platform engineering' },
  { id: sid('000000000213'), name: 'Engineering Manager', color: '#f97316', desc: 'Leadership and people management roles' },
];

const U2_FIELDS = [
  { roleIdx: 0, key: 'Years of Experience', value: '7 years' },
  { roleIdx: 0, key: 'Tech Stack', value: 'React, Vue.js, TypeScript, Tailwind CSS, Storybook' },
  { roleIdx: 0, key: 'Salary Expectation', value: '$160,000 - $190,000' },
  { roleIdx: 1, key: 'Years of Experience', value: '7 years' },
  { roleIdx: 1, key: 'Tech Stack', value: 'Go, Python, PostgreSQL, Kafka, gRPC, AWS' },
  { roleIdx: 1, key: 'Salary Expectation', value: '$170,000 - $200,000' },
  { roleIdx: 2, key: 'Years of Experience', value: '5 years' },
  { roleIdx: 2, key: 'Tech Stack', value: 'Terraform, Kubernetes, AWS, GitHub Actions, Prometheus' },
  { roleIdx: 2, key: 'Salary Expectation', value: '$165,000 - $195,000' },
  { roleIdx: 3, key: 'Years of Experience', value: '3 years management, 7 total' },
  { roleIdx: 3, key: 'Team Size', value: '8-15 engineers' },
  { roleIdx: 3, key: 'Salary Expectation', value: '$190,000 - $230,000' },
];

const U2_DOCS = [
  { id: sid('000000000230'), roleIdx: 0, type: 'cv', fileName: 'jordan-rivera-frontend-cv.pdf', title: 'Jordan Rivera - Frontend CV', body: 'Staff frontend engineer - React, Vue, design systems, accessibility' },
  { id: sid('000000000231'), roleIdx: 1, type: 'cv', fileName: 'jordan-rivera-backend-cv.pdf', title: 'Jordan Rivera - Backend CV', body: 'Staff engineer - Go, Python, distributed systems, cloud architecture' },
  { id: sid('000000000232'), roleIdx: 0, type: 'cover_letter', fileName: 'frontend-cover-letter.pdf', title: 'Frontend Cover Letter', body: 'Cover letter emphasizing UI/UX and design system expertise' },
  { id: sid('000000000233'), roleIdx: 1, type: 'cover_letter', fileName: 'backend-cover-letter.pdf', title: 'Backend Cover Letter', body: 'Cover letter emphasizing distributed systems and scalability' },
  { id: sid('000000000234'), roleIdx: null, type: 'custom', fileName: 'portfolio-summary.pdf', title: 'Portfolio Summary', body: 'Key projects and open-source contributions overview', customTypeName: 'Portfolio' },
];

const U2_APPS = [
  { id: sid('000000000240'), company: 'Vercel', title: 'Staff Frontend Engineer', status: 'interview', roleIdx: 0, url: 'https://vercel.com/careers/staff-fe', notes: 'Final round scheduled. Team focuses on Next.js tooling.' },
  { id: sid('000000000241'), company: 'Stripe', title: 'Senior Backend Engineer', status: 'applied', roleIdx: 1, url: 'https://stripe.com/jobs/backend', notes: 'Applied through employee referral.' },
  { id: sid('000000000242'), company: 'Datadog', title: 'Senior DevOps Engineer', status: 'phone_screen', roleIdx: 2, url: 'https://careers.datadoghq.com', notes: 'Recruiter call went well. Technical screen next.' },
  { id: sid('000000000243'), company: 'Linear', title: 'Frontend Engineer', status: 'offer', roleIdx: 0, url: 'https://linear.app/careers', notes: 'Offer: $175K base + 0.05% equity. Strong culture fit.' },
  { id: sid('000000000244'), company: 'HashiCorp', title: 'Platform Engineer', status: 'rejected', roleIdx: 2, url: 'https://hashicorp.com/jobs', notes: 'Rejected after on-site. Feedback: Terraform expertise not deep enough.' },
  { id: sid('000000000245'), company: 'Figma', title: 'Engineering Manager', status: 'interview', roleIdx: 3, url: 'https://figma.com/careers/em', notes: 'Completed manager panel. Team of 10, working on plugin platform.' },
  { id: sid('000000000246'), company: 'Cloudflare', title: 'Backend Engineer', status: 'ghosted', roleIdx: 1, url: 'https://cloudflare.com/careers', notes: 'No response after second interview. Been 3 weeks.' },
  { id: sid('000000000247'), company: 'Notion', title: 'Senior Frontend Engineer', status: 'withdrawn', roleIdx: 0, url: null, notes: 'Withdrew after receiving Linear offer.' },
  { id: sid('000000000248'), company: 'Grafana Labs', title: 'DevOps Engineer', status: 'applied', roleIdx: 2, url: 'https://grafana.com/careers', notes: null },
  { id: sid('000000000249'), company: 'GitLab', title: 'Engineering Manager, Create', status: 'draft', roleIdx: 3, url: 'https://gitlab.com/jobs/em-create', notes: 'Drafting application. Need to research the Create stage team.' },
];

const U2_APP_DOCS = [
  { appId: sid('000000000240'), docId: sid('000000000230') }, // Vercel <- frontend CV
  { appId: sid('000000000240'), docId: sid('000000000232') }, // Vercel <- frontend cover letter
  { appId: sid('000000000241'), docId: sid('000000000231') }, // Stripe <- backend CV
  { appId: sid('000000000243'), docId: sid('000000000230') }, // Linear <- frontend CV
];

// User 2 -- AI data
const U2_PARSED_PROFILES = [
  {
    id: sid('000000000250'),
    docId: sid('000000000230'), // frontend CV
    confidence: '0.95',
    data: {
      name: 'Jordan Rivera',
      email: 'jordan.rivera@email.com',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX',
      linkedin: 'https://linkedin.com/in/jordanrivera',
      website: 'https://jordanrivera.io',
      summary: 'Frontend-focused engineer with 7 years of experience building performant, accessible web applications. Strong design systems background with experience leading UI platform teams.',
      skills: ['TypeScript', 'React', 'Vue.js', 'Next.js', 'Tailwind CSS', 'Storybook', 'Figma', 'Accessibility (WCAG)', 'Performance Optimization', 'Design Systems', 'GraphQL', 'Testing Library', 'Playwright', 'Node.js', 'PostgreSQL'],
      experience: [
        { company: 'ScaleUp Technologies', title: 'Staff Frontend Engineer', startDate: '2021-06', endDate: null, current: true, description: 'Architected and led the design system used across 12 product teams. Reduced bundle size by 35% through code splitting and lazy loading. Established frontend testing standards achieving 90% coverage.' },
        { company: 'BrightPath Software', title: 'Senior Frontend Developer', startDate: '2019-03', endDate: '2021-05', current: false, description: 'Built customer portal serving 50K+ monthly active users. Implemented real-time collaboration features using WebSockets. Led WCAG 2.1 AA accessibility audit and remediation.' },
        { company: 'WebForge Agency', title: 'Frontend Developer', startDate: '2017-08', endDate: '2019-02', current: false, description: 'Delivered 15+ client projects using React and Vue.js. Developed reusable component libraries that reduced project kickoff time by 40%.' },
      ],
      education: [{ institution: 'University of Texas at Austin', degree: 'BSc', field: 'Computer Science', startDate: '2013-08', endDate: '2017-05' }],
      certifications: [{ name: 'Google UX Design Certificate', issuer: 'Google', date: '2022-03' }],
      languages: ['English (Native)', 'Portuguese (Intermediate)'],
    },
  },
  {
    id: sid('000000000251'),
    docId: sid('000000000231'), // backend CV
    confidence: '0.93',
    data: {
      name: 'Jordan Rivera',
      email: 'jordan.rivera@email.com',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX',
      summary: 'Backend and infrastructure engineer with 7 years experience designing distributed systems. Expertise in cloud architecture, database optimization, and DevOps practices.',
      skills: ['Go', 'Python', 'TypeScript', 'PostgreSQL', 'Redis', 'Kafka', 'gRPC', 'AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD', 'Prometheus', 'Grafana', 'Linux'],
      experience: [
        { company: 'ScaleUp Technologies', title: 'Staff Engineer', startDate: '2021-06', endDate: null, current: true, description: 'Designed event-driven architecture handling 500K+ requests/minute. Led migration from monolith to microservices using Go and gRPC. Reduced infrastructure costs by 40% through auto-scaling optimization.' },
        { company: 'BrightPath Software', title: 'Senior Backend Developer', startDate: '2019-03', endDate: '2021-05', current: false, description: 'Built real-time data pipeline processing 10TB/day using Kafka and Spark. Implemented database sharding strategy that improved query performance by 10x.' },
      ],
      education: [{ institution: 'University of Texas at Austin', degree: 'BSc', field: 'Computer Science', startDate: '2013-08', endDate: '2017-05' }],
      certifications: [
        { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', date: '2023-09' },
        { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022-11' },
      ],
      languages: ['English (Native)', 'Portuguese (Intermediate)'],
    },
  },
];

const U2_JOB_ANALYSES = [
  {
    id: sid('000000000260'),
    appId: sid('000000000240'), // Vercel
    sourceUrl: 'https://vercel.com/careers/staff-fe',
    analysis: {
      companyName: 'Vercel',
      jobTitle: 'Staff Frontend Engineer',
      location: 'Remote (US)',
      locationType: 'remote',
      salaryMin: 190000,
      salaryMax: 250000,
      salaryCurrency: 'USD',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Performance Optimization', 'Design Systems'],
      preferredSkills: ['Rust', 'WebAssembly', 'Bundler internals', 'Turborepo'],
      experienceYears: 8,
      educationRequired: "Bachelor's degree or equivalent experience",
      responsibilities: ['Lead architecture decisions for the Next.js developer experience', 'Build and maintain core frontend infrastructure', 'Mentor engineers across the organization', 'Drive performance improvements across the platform'],
      benefits: ['Competitive salary + equity', 'Remote-first culture', 'Unlimited PTO', 'Health, dental, vision', 'Home office budget'],
    },
  },
  {
    id: sid('000000000261'),
    appId: sid('000000000241'), // Stripe
    sourceUrl: 'https://stripe.com/jobs/backend-senior',
    analysis: {
      companyName: 'Stripe',
      jobTitle: 'Senior Backend Engineer',
      location: 'San Francisco, CA or Remote',
      locationType: 'hybrid',
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: 'USD',
      requiredSkills: ['Go', 'Ruby', 'Distributed Systems', 'PostgreSQL', 'API Design'],
      preferredSkills: ['Payment systems', 'Financial regulations', 'Kafka', 'gRPC'],
      experienceYears: 5,
      educationRequired: "Bachelor's in CS or equivalent",
      responsibilities: ['Design and build payment processing infrastructure', 'Ensure 99.999% uptime for critical financial systems', 'Collaborate with product on API design', 'Optimize database performance at scale'],
      benefits: ['Top-of-market compensation', 'Equity refresh grants', 'Comprehensive benefits', 'Learning stipend', 'Commuter benefits'],
    },
  },
  {
    id: sid('000000000262'),
    appId: sid('000000000245'), // Figma EM
    sourceUrl: 'https://figma.com/careers/em-plugin-platform',
    analysis: {
      companyName: 'Figma',
      jobTitle: 'Engineering Manager, Plugin Platform',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      salaryMin: 210000,
      salaryMax: 280000,
      salaryCurrency: 'USD',
      requiredSkills: ['People Management', 'Technical Leadership', 'Web Technologies', 'Cross-functional Collaboration'],
      preferredSkills: ['Plugin/extension platforms', 'Developer ecosystems', 'WebAssembly', 'Performance optimization'],
      experienceYears: 3,
      educationRequired: "Bachelor's degree or equivalent",
      responsibilities: ['Manage a team of 8-12 engineers building the plugin platform', 'Set technical vision and roadmap', 'Partner with product and design on strategy', 'Hire and develop engineering talent', 'Drive operational excellence'],
      benefits: ['Competitive salary + equity', 'Annual bonus', 'Health benefits', 'Generous parental leave', 'Professional development budget'],
    },
  },
];

const U2_MATCH_SCORES = [
  {
    id: sid('000000000270'),
    appId: sid('000000000240'), // Vercel
    score: '91.00',
    result: {
      overallScore: 91,
      skillsMatch: 95,
      experienceMatch: 88,
      educationMatch: 85,
      keywordCoverage: 92,
      strengths: ['Exact match on React, TypeScript, Next.js core requirements', 'Design systems experience directly relevant to role', 'Staff-level experience leading platform teams', 'Performance optimization track record (35% bundle reduction)'],
      weaknesses: ['No Rust or WebAssembly experience (preferred skills)', 'Role asks for 8 years; candidate has 7', 'No experience with bundler internals or Turborepo'],
      suggestions: ['Highlight Next.js specific projects and contributions', 'Mention any Rust or WASM exploration, even hobby projects', 'Emphasize the scale of the design system (12 teams, 40+ engineers)'],
    },
  },
  {
    id: sid('000000000271'),
    appId: sid('000000000241'), // Stripe
    score: '72.00',
    result: {
      overallScore: 72,
      skillsMatch: 75,
      experienceMatch: 70,
      educationMatch: 85,
      keywordCoverage: 60,
      strengths: ['Strong Go experience matching primary language', 'Distributed systems architecture at ScaleUp', 'gRPC and Kafka experience relevant to payment infrastructure', 'Database optimization experience (10x query improvement)'],
      weaknesses: ['No Ruby experience (used extensively at Stripe)', 'No payment systems or financial domain experience', 'API design experience not highlighted in CV', 'Missing 99.999% uptime track record'],
      suggestions: ['Add a section about API design philosophy and patterns', 'Highlight any experience with financial data or compliance', 'Emphasize the 500K+ req/min system as reliability evidence', 'Consider mentioning Ruby willingness to learn'],
    },
  },
  {
    id: sid('000000000272'),
    appId: sid('000000000245'), // Figma EM
    score: '38.00',
    result: {
      overallScore: 38,
      skillsMatch: 35,
      experienceMatch: 30,
      educationMatch: 80,
      keywordCoverage: 28,
      strengths: ['Web technologies background relevant to Figma platform', 'Experience leading cross-functional initiatives', 'Strong technical depth for credibility with reports'],
      weaknesses: ['No formal management experience listed in CV', 'No plugin/extension platform experience', 'CV positions as IC, not manager -- role requires 3+ years management', 'Missing hiring and people development experience'],
      suggestions: ['This role requires explicit management experience not shown in CV', 'Create an EM-focused CV highlighting leadership aspects of each role', 'Document team sizes, hiring, mentoring, and process improvements', 'Consider EM roles at smaller companies to build formal management track record first'],
    },
  },
];

const U2_COVER_LETTERS = [
  {
    id: sid('000000000280'),
    appId: sid('000000000240'), // Vercel
    tone: 'technical',
    content: `Dear Vercel Engineering Team,

I am excited to apply for the Staff Frontend Engineer position. As someone who has spent 7 years pushing the boundaries of frontend engineering, I see this role as the perfect intersection of my expertise and passion.

At ScaleUp Technologies, I architect and maintain a design system that serves 12 product teams and over 40 engineers. This system has become the foundation for consistent, performant UI across the entire product suite. I led the initiative to reduce our main bundle by 35% through strategic code splitting, lazy loading, and tree-shaking optimizations -- the kind of deep performance work I understand is central to Vercel's mission.

My experience building the customer portal at BrightPath (50K+ MAU) with real-time WebSocket collaboration taught me how to balance developer experience with end-user performance. Achieving WCAG 2.1 AA compliance across the platform reinforced my belief that great frontend engineering serves everyone.

I am particularly drawn to Vercel because of its commitment to making the web faster and more accessible. The opportunity to work on Next.js developer tooling, where my design systems and performance expertise can have outsized impact, is exactly the challenge I am looking for.

I would love to discuss how my experience leading frontend platform initiatives aligns with Vercel's vision.

Best regards,
Jordan Rivera`,
  },
  {
    id: sid('000000000281'),
    appId: sid('000000000241'), // Stripe
    tone: 'professional',
    content: `Dear Stripe Hiring Team,

I am writing to apply for the Senior Backend Engineer position. With 7 years of experience building distributed systems and a passion for reliable, well-designed infrastructure, I believe I can make a meaningful contribution to Stripe's engineering team.

In my current role at ScaleUp Technologies, I designed an event-driven architecture that handles over 500,000 requests per minute. I led the migration from a monolithic system to microservices using Go and gRPC, which reduced infrastructure costs by 40% while improving system reliability. This experience in building and operating high-throughput, low-latency systems directly aligns with the demands of payment infrastructure.

At BrightPath Software, I built real-time data pipelines processing 10TB daily using Kafka and Spark, and implemented a database sharding strategy that improved query performance by 10x. I understand the critical importance of data integrity and system availability that financial systems demand.

What excites me about Stripe is the combination of technical excellence and real-world impact. The challenge of maintaining 99.999% uptime for systems that power global commerce is exactly the kind of problem I want to solve.

I look forward to discussing how my distributed systems experience can contribute to Stripe's infrastructure.

Sincerely,
Jordan Rivera`,
  },
];

const U2_INTERVIEW_PREPS = [
  {
    id: sid('000000000290'),
    appId: sid('000000000240'), // Vercel
    result: {
      categories: [
        {
          name: 'technical',
          questions: [
            { question: 'How would you approach building a design system that supports both server and client components in Next.js?', starHint: 'Structure: Requirements analysis, component architecture, hydration strategy, testing approach.', suggestedAnswer: 'I would create a layered architecture: primitive components (buttons, inputs) as client components with "use client" directive, layout components as server components, and composite components that accept either. Use a shared token system for theming that works in both contexts. For hydration, ensure server-rendered markup matches client expectations by using CSS-only interactivity where possible.' },
            { question: 'Explain your approach to measuring and improving Core Web Vitals.', starHint: 'Structure: Measurement tools, specific metrics, optimization techniques, monitoring.', suggestedAnswer: 'I use a combination of Lighthouse CI in the deployment pipeline, real-user monitoring via the web-vitals library, and Chrome DevTools for debugging. For LCP, I focus on critical resource preloading and image optimization. For CLS, I ensure all dynamic content has reserved space. For INP, I use React concurrent features and requestIdleCallback for non-critical work.' },
          ],
        },
        {
          name: 'behavioral',
          questions: [
            { question: 'Tell me about a time you had to influence a technical direction without direct authority.', starHint: 'Situation: Cross-team challenge. Task: Your goal. Action: Influence strategy. Result: Outcome.', suggestedAnswer: 'When introducing our design system at ScaleUp, I needed buy-in from 12 product teams without having authority over any of them. I started by solving a pain point for the most skeptical team, demonstrating a 40% reduction in their component development time. I then created an adoption playbook and offered migration support. Within 6 months, all 12 teams had voluntarily adopted the system.' },
          ],
        },
        {
          name: 'situational',
          questions: [
            { question: 'A product team needs a feature shipped in 2 weeks that would typically take 6. How do you handle this?', starHint: 'Structure: Scope negotiation, trade-off analysis, communication, delivery plan.', suggestedAnswer: 'First, understand the business driver for the deadline. Then break the feature into must-have vs nice-to-have components. Propose a phased delivery: MVP in 2 weeks with core functionality, then iterate. Be transparent about technical debt incurred and create tickets to address it. If the timeline is truly impossible even with reduced scope, communicate that clearly with data.' },
          ],
        },
      ],
    },
  },
  {
    id: sid('000000000291'),
    appId: sid('000000000245'), // Figma EM
    result: {
      categories: [
        {
          name: 'behavioral',
          questions: [
            { question: 'How do you approach hiring for your team?', starHint: 'Structure: Hiring philosophy, process design, evaluation criteria, diversity.', suggestedAnswer: 'I focus on structured interviews with clear rubrics to reduce bias. I design a mix of technical and collaborative assessments that reflect actual work. I prioritize growth mindset and collaboration over specific technology experience. I actively source diverse candidates and ensure the interview panel is representative.' },
            { question: 'Tell me about a time you had to deliver difficult feedback to a team member.', starHint: 'Situation: Performance issue. Task: Your responsibility. Action: Feedback approach. Result: Outcome.', suggestedAnswer: 'At ScaleUp, a senior engineer was consistently shipping code without adequate tests, causing regression issues. I had a direct 1:1 conversation, framed around specific incidents and their impact on the team. We co-created an improvement plan with weekly check-ins. Within a month, their test coverage improved significantly, and they eventually championed testing best practices for the team.' },
          ],
        },
        {
          name: 'situational',
          questions: [
            { question: 'Two senior engineers on your team have a fundamental disagreement about technical direction. How do you resolve it?', starHint: 'Structure: Understanding both sides, facilitation approach, decision framework, follow-through.', suggestedAnswer: 'First, meet with each engineer individually to understand their perspective and underlying concerns. Then facilitate a structured technical discussion where both present their approach with data. If consensus is not reached, I use a decision framework: reversibility, team capability, timeline constraints. I make the final call if needed, document the rationale, and ensure the person whose approach was not chosen feels heard and understands the reasoning.' },
          ],
        },
        {
          name: 'technical',
          questions: [
            { question: 'How would you set technical vision for a plugin platform team?', starHint: 'Structure: Research, stakeholder input, technical strategy, execution roadmap.', suggestedAnswer: 'Start by understanding the developer ecosystem: survey plugin authors, analyze usage patterns, and study competitive platforms. Align with product on user-facing goals. Define technical principles (e.g., security-first, performance budgets, backward compatibility). Create a 6-month roadmap with clear milestones, balancing platform improvements with developer-facing features. Review quarterly with stakeholders.' },
          ],
        },
      ],
    },
  },
];

const U2_RESUME_SUGGESTIONS = [
  {
    id: sid('0000000002a0'),
    appId: sid('000000000240'), // Vercel
    docId: sid('000000000230'), // frontend CV
    result: {
      suggestions: [
        { category: 'keywords', title: 'Mention Next.js explicitly', description: 'Vercel created Next.js -- it must appear prominently in your CV. Currently buried in skills list.', before: 'Skills: TypeScript, React, Vue.js, Next.js, Tailwind CSS', after: 'Built production applications with Next.js (App Router, Server Components, ISR) serving 50K+ monthly users', priority: 'high' },
        { category: 'impact', title: 'Quantify design system adoption', description: 'Add specific adoption metrics and business impact.', before: 'Architected design system used across 12 product teams', after: 'Architected design system adopted by 12 product teams (40+ engineers), reducing component development time by 40% and ensuring visual consistency across 8 products', priority: 'high' },
        { category: 'content', title: 'Add performance metrics section', description: 'Vercel cares deeply about web performance. Create a dedicated section highlighting your optimization achievements with specific numbers.', priority: 'medium' },
        { category: 'keywords', title: 'Add Rust/WASM interest', description: 'Even if you have limited experience, mentioning interest or side projects in Rust/WebAssembly shows alignment with Vercel direction.', priority: 'low' },
      ],
    },
  },
  {
    id: sid('0000000002a1'),
    appId: sid('000000000241'), // Stripe
    docId: sid('000000000231'), // backend CV
    result: {
      suggestions: [
        { category: 'content', title: 'Add API design section', description: 'Stripe is known for excellent API design. Highlight any API design work, versioning strategies, or developer documentation you have created.', priority: 'high' },
        { category: 'keywords', title: 'Emphasize reliability and uptime', description: 'Financial systems require extreme reliability. Your CV should prominently feature SLA achievements and incident response experience.', before: 'Designed event-driven architecture handling 500K+ requests/minute', after: 'Designed event-driven architecture handling 500K+ requests/minute with 99.99% uptime SLA, including automated failover and graceful degradation', priority: 'high' },
        { category: 'impact', title: 'Quantify cost savings differently', description: 'Frame infrastructure cost savings in business terms, not just percentages.', before: 'Reduced infrastructure costs by 40%', after: 'Reduced infrastructure costs by 40% ($180K/year savings) through auto-scaling optimization and reserved instance strategy', priority: 'medium' },
        { category: 'formatting', title: 'Add technology versions', description: 'For backend roles, specifying versions (Go 1.21, PostgreSQL 16) signals hands-on recency.', priority: 'low' },
      ],
    },
  },
];

const U2_AI_USAGE = [
  { feature: 'parse', model: 'gpt-4o-mini', inputTokens: 2600, outputTokens: 900, costCents: '0.0200', daysAgo: 40 },
  { feature: 'parse', model: 'gpt-4o-mini', inputTokens: 2200, outputTokens: 750, costCents: '0.0170', daysAgo: 38 },
  { feature: 'jd_extraction', model: 'gpt-4o-mini', inputTokens: 3400, outputTokens: 650, costCents: '0.0220', daysAgo: 35 },
  { feature: 'jd_extraction', model: 'gpt-4o-mini', inputTokens: 3100, outputTokens: 600, costCents: '0.0200', daysAgo: 30 },
  { feature: 'jd_extraction', model: 'gpt-4o-mini', inputTokens: 2900, outputTokens: 580, costCents: '0.0195', daysAgo: 25 },
  { feature: 'match', model: 'gpt-4o-mini', inputTokens: 4800, outputTokens: 1300, costCents: '0.0450', daysAgo: 34 },
  { feature: 'match', model: 'gpt-4o-mini', inputTokens: 4400, outputTokens: 1150, costCents: '0.0410', daysAgo: 29 },
  { feature: 'match', model: 'gpt-4o-mini', inputTokens: 4100, outputTokens: 1050, costCents: '0.0380', daysAgo: 24 },
  { feature: 'cover_letter', model: 'gpt-4o-mini', inputTokens: 4000, outputTokens: 2600, costCents: '0.0650', daysAgo: 33 },
  { feature: 'cover_letter', model: 'gpt-4o-mini', inputTokens: 3900, outputTokens: 2500, costCents: '0.0630', daysAgo: 28 },
  { feature: 'interview_prep', model: 'gpt-4o-mini', inputTokens: 3800, outputTokens: 3400, costCents: '0.0850', daysAgo: 20 },
  { feature: 'interview_prep', model: 'gpt-4o-mini', inputTokens: 3600, outputTokens: 3100, costCents: '0.0790', daysAgo: 15 },
  { feature: 'resume_suggestions', model: 'gpt-4o-mini', inputTokens: 5200, outputTokens: 1800, costCents: '0.0550', daysAgo: 32 },
  { feature: 'resume_suggestions', model: 'gpt-4o-mini', inputTokens: 5000, outputTokens: 1700, costCents: '0.0520', daysAgo: 27 },
];

const U2_NOTIFICATIONS = [
  { id: sid('0000000002c0'), type: 'milestone', title: 'First Application Created', body: 'You created your first job application. Good luck!', isRead: true, appId: sid('000000000240'), daysAgo: 42 },
  { id: sid('0000000002c1'), type: 'milestone', title: 'First Offer Received', body: 'You received an offer from Linear. Well done!', isRead: true, appId: sid('000000000243'), daysAgo: 8 },
  { id: sid('0000000002c2'), type: 'stale_app', title: 'Application needs attention', body: 'Your application to Stripe has not been updated in 10 days.', isRead: false, appId: sid('000000000241'), daysAgo: 2 },
  { id: sid('0000000002c3'), type: 'stale_app', title: 'Application may be stale', body: 'Your application to Grafana Labs has had no updates recently.', isRead: false, appId: sid('000000000248'), daysAgo: 1 },
  { id: sid('0000000002c4'), type: 'follow_up', title: 'Follow up reminder', body: 'Consider following up with Datadog about your phone screen.', isRead: false, appId: sid('000000000242'), daysAgo: 3 },
  { id: sid('0000000002c5'), type: 'weekly_summary', title: 'Weekly Summary', body: 'This week: 2 applications updated, 1 new interview scheduled, 1 offer received.', isRead: true, appId: null, daysAgo: 7 },
];

const U2_PAYMENTS = [
  { id: sid('0000000002d0'), providerPaymentId: 'pi_seed_001', amountCents: 900, status: 'succeeded', daysAgo: 35 },
  { id: sid('0000000002d1'), providerPaymentId: 'pi_seed_002', amountCents: 900, status: 'succeeded', daysAgo: 5 },
];

// ---------------------------------------------------------------------------
// Status progression map
// ---------------------------------------------------------------------------
const STATUS_PROGRESSION = {
  applied: ['draft', 'applied'],
  phone_screen: ['draft', 'applied', 'phone_screen'],
  interview: ['draft', 'applied', 'phone_screen', 'interview'],
  offer: ['draft', 'applied', 'phone_screen', 'interview', 'offer'],
  rejected: ['draft', 'applied', 'rejected'],
  ghosted: ['draft', 'applied', 'phone_screen', 'ghosted'],
  withdrawn: ['draft', 'applied', 'withdrawn'],
};

// ===========================================================================
// SEED EXECUTION
// ===========================================================================
try {
  console.log('Seeding database...');

  // Check MinIO availability
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    minioAvailable = true;
    console.log('  MinIO bucket verified');
  } catch {
    console.warn('  MinIO not available -- document DB records will be created but files will NOT be uploaded');
  }

  // -------------------------------------------------------------------------
  // 1. Users
  // -------------------------------------------------------------------------
  // Demo account passwords come from env; otherwise a random one is generated
  // and printed below, so no working credential is hardcoded in the repo.
  const demoPassword =
    process.env.SEED_DEMO_PASSWORD || randomBytes(12).toString('base64url');
  const proPassword =
    process.env.SEED_PRO_PASSWORD || randomBytes(12).toString('base64url');
  const u1Hash = await bcrypt.hash(demoPassword, 10);
  const u2Hash = await bcrypt.hash(proPassword, 10);

  await db.execute(sql`
    INSERT INTO users (id, name, email, hashed_password, email_verified, onboarding_completed)
    VALUES (${U1}, 'Demo User', 'demo@trackedyourfuture.com', ${u1Hash}, NOW(), true)
    ON CONFLICT (id) DO NOTHING
  `);
  await db.execute(sql`
    INSERT INTO users (id, name, email, hashed_password, email_verified, onboarding_completed)
    VALUES (${U2}, 'Jordan Rivera', 'pro@trackedyourfuture.com', ${u2Hash}, NOW(), true)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  Users created (demo + pro)');

  // -------------------------------------------------------------------------
  // 2. Subscriptions
  // -------------------------------------------------------------------------
  await db.execute(sql`
    INSERT INTO subscriptions (id, user_id, tier, status)
    VALUES (${U1_SUB}, ${U1}, 'free', 'active')
    ON CONFLICT (id) DO NOTHING
  `);
  const periodStart = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute(sql`
    INSERT INTO subscriptions (id, user_id, tier, status, provider_customer_id, provider_subscription_id, provider_price_id, current_period_start, current_period_end)
    VALUES (${U2_SUB}, ${U2}, 'pro', 'active', 'cus_seed_pro', 'sub_seed_pro', 'price_seed_pro', ${periodStart}, ${periodEnd})
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  Subscriptions created (free + pro)');

  // -------------------------------------------------------------------------
  // 3. Role categories
  // -------------------------------------------------------------------------
  for (const [i, role] of U1_ROLES.entries()) {
    await db.execute(sql`
      INSERT INTO role_categories (id, user_id, name, description, color, position)
      VALUES (${role.id}, ${U1}, ${role.name}, ${role.desc}, ${role.color}, ${i})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const [i, role] of U2_ROLES.entries()) {
    await db.execute(sql`
      INSERT INTO role_categories (id, user_id, name, description, color, position)
      VALUES (${role.id}, ${U2}, ${role.name}, ${role.desc}, ${role.color}, ${i})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Role categories created');

  // -------------------------------------------------------------------------
  // 4. Form field templates
  // -------------------------------------------------------------------------
  for (const [i, f] of U1_FIELDS.entries()) {
    const fid = sid(`0000000001${(20 + i).toString().padStart(2, '0')}`);
    await db.execute(sql`
      INSERT INTO form_field_templates (id, user_id, role_category_id, field_key, field_value, position)
      VALUES (${fid}, ${U1}, ${U1_ROLES[f.roleIdx].id}, ${f.key}, ${f.value}, ${i % 3})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const [i, f] of U2_FIELDS.entries()) {
    const fid = sid(`0000000022${i.toString(16).padStart(2, '0')}`);
    await db.execute(sql`
      INSERT INTO form_field_templates (id, user_id, role_category_id, field_key, field_value, position)
      VALUES (${fid}, ${U2}, ${U2_ROLES[f.roleIdx].id}, ${f.key}, ${f.value}, ${i % 3})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Form field templates created');

  // -------------------------------------------------------------------------
  // 5. Documents (DB + MinIO upload)
  // -------------------------------------------------------------------------
  for (const doc of U1_DOCS) {
    const roleId = doc.roleIdx !== null ? U1_ROLES[doc.roleIdx].id : null;
    const fileKey = buildFileKey(U1, roleId, doc.type, doc.id, 1, doc.fileName);
    const pdf = createPlaceholderPdf(doc.title, doc.body);
    await uploadToMinio(fileKey, pdf, 'application/pdf');
    await db.execute(sql`
      INSERT INTO documents (id, user_id, role_category_id, document_type, file_name, file_key, mime_type, file_size_bytes, version, is_latest)
      VALUES (${doc.id}, ${U1}, ${roleId}, ${doc.type}, ${doc.fileName}, ${fileKey}, 'application/pdf', ${pdf.length}, 1, true)
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const doc of U2_DOCS) {
    const roleId = doc.roleIdx !== null ? U2_ROLES[doc.roleIdx].id : null;
    const fileKey = buildFileKey(U2, roleId, doc.type, doc.id, 1, doc.fileName);
    const pdf = createPlaceholderPdf(doc.title, doc.body);
    await uploadToMinio(fileKey, pdf, 'application/pdf');
    await db.execute(sql`
      INSERT INTO documents (id, user_id, role_category_id, document_type, custom_type_name, file_name, file_key, mime_type, file_size_bytes, version, is_latest)
      VALUES (${doc.id}, ${U2}, ${roleId}, ${doc.type}, ${doc.customTypeName ?? null}, ${doc.fileName}, ${fileKey}, 'application/pdf', ${pdf.length}, 1, true)
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Documents created' + (minioAvailable ? ' (with MinIO uploads)' : ' (DB only, no MinIO)'));

  // -------------------------------------------------------------------------
  // 6. Applications
  // -------------------------------------------------------------------------
  for (const app of U1_APPS) {
    const appliedAt = app.status === 'draft' ? null : daysAgo(Math.floor(Math.random() * 30) + 10);
    await db.execute(sql`
      INSERT INTO applications (id, user_id, role_category_id, company_name, job_title, job_url, current_status, applied_at, notes)
      VALUES (${app.id}, ${U1}, ${U1_ROLES[app.roleIdx].id}, ${app.company}, ${app.title}, ${app.url ?? null}, ${app.status}, ${appliedAt}, ${app.notes ?? null})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const app of U2_APPS) {
    const appliedAt = app.status === 'draft' ? null : daysAgo(Math.floor(Math.random() * 40) + 5);
    await db.execute(sql`
      INSERT INTO applications (id, user_id, role_category_id, company_name, job_title, job_url, current_status, applied_at, notes)
      VALUES (${app.id}, ${U2}, ${U2_ROLES[app.roleIdx].id}, ${app.company}, ${app.title}, ${app.url ?? null}, ${app.status}, ${appliedAt}, ${app.notes ?? null})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Applications created');

  // -------------------------------------------------------------------------
  // 7. Application-document links
  // -------------------------------------------------------------------------
  for (const link of [...U1_APP_DOCS, ...U2_APP_DOCS]) {
    await db.execute(sql`
      INSERT INTO application_documents (application_id, document_id)
      VALUES (${link.appId}, ${link.docId})
      ON CONFLICT (application_id, document_id) DO NOTHING
    `);
  }
  console.log('  Application-document links created');

  // -------------------------------------------------------------------------
  // 8. Status history
  // -------------------------------------------------------------------------
  let histIdx = 0;
  for (const apps of [U1_APPS, U2_APPS]) {
    for (const app of apps) {
      if (app.status === 'draft') continue;
      const progression = STATUS_PROGRESSION[app.status] || [];
      for (let i = 1; i < progression.length; i++) {
        const changedAt = daysAgo(Math.max(1, (progression.length - i) * 3 + Math.floor(Math.random() * 5)));
        const hid = sid(`0000000e${histIdx.toString(16).padStart(4, '0')}`);
        await db.execute(sql`
          INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_at)
          VALUES (${hid}, ${app.id}, ${progression[i - 1]}, ${progression[i]}, ${changedAt})
          ON CONFLICT (id) DO NOTHING
        `);
        histIdx++;
      }
    }
  }
  console.log('  Status history created');

  // -------------------------------------------------------------------------
  // 9. Parsed profiles
  // -------------------------------------------------------------------------
  const pp1 = U1_PARSED_PROFILE;
  await db.execute(sql`
    INSERT INTO parsed_profiles (id, user_id, document_id, parsed_data, raw_text, confidence_score)
    VALUES (${pp1.id}, ${U1}, ${pp1.docId}, ${JSON.stringify(pp1.data)}, ${pp1.data.summary}, ${pp1.confidence})
    ON CONFLICT (id) DO NOTHING
  `);
  for (const pp of U2_PARSED_PROFILES) {
    await db.execute(sql`
      INSERT INTO parsed_profiles (id, user_id, document_id, parsed_data, raw_text, confidence_score)
      VALUES (${pp.id}, ${U2}, ${pp.docId}, ${JSON.stringify(pp.data)}, ${pp.data.summary}, ${pp.confidence})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Parsed profiles created');

  // -------------------------------------------------------------------------
  // 10. Job analyses
  // -------------------------------------------------------------------------
  for (const ja of U1_JOB_ANALYSES) {
    await db.execute(sql`
      INSERT INTO job_analyses (id, user_id, application_id, source_url, analysis)
      VALUES (${ja.id}, ${U1}, ${ja.appId}, ${ja.sourceUrl}, ${JSON.stringify(ja.analysis)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const ja of U2_JOB_ANALYSES) {
    await db.execute(sql`
      INSERT INTO job_analyses (id, user_id, application_id, source_url, analysis)
      VALUES (${ja.id}, ${U2}, ${ja.appId}, ${ja.sourceUrl}, ${JSON.stringify(ja.analysis)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Job analyses created');

  // -------------------------------------------------------------------------
  // 11. Match scores
  // -------------------------------------------------------------------------
  for (const ms of U1_MATCH_SCORES) {
    await db.execute(sql`
      INSERT INTO match_scores (id, user_id, application_id, score, result)
      VALUES (${ms.id}, ${U1}, ${ms.appId}, ${ms.score}, ${JSON.stringify(ms.result)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  for (const ms of U2_MATCH_SCORES) {
    await db.execute(sql`
      INSERT INTO match_scores (id, user_id, application_id, score, result)
      VALUES (${ms.id}, ${U2}, ${ms.appId}, ${ms.score}, ${JSON.stringify(ms.result)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Match scores created');

  // -------------------------------------------------------------------------
  // 12. Cover letters
  // -------------------------------------------------------------------------
  const cl1 = U1_COVER_LETTER;
  await db.execute(sql`
    INSERT INTO cover_letters (id, user_id, application_id, tone, content)
    VALUES (${cl1.id}, ${U1}, ${cl1.appId}, ${cl1.tone}, ${cl1.content})
    ON CONFLICT (id) DO NOTHING
  `);
  for (const cl of U2_COVER_LETTERS) {
    await db.execute(sql`
      INSERT INTO cover_letters (id, user_id, application_id, tone, content)
      VALUES (${cl.id}, ${U2}, ${cl.appId}, ${cl.tone}, ${cl.content})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Cover letters created');

  // -------------------------------------------------------------------------
  // 13. Interview preps
  // -------------------------------------------------------------------------
  const ip1 = U1_INTERVIEW_PREP;
  await db.execute(sql`
    INSERT INTO interview_preps (id, user_id, application_id, result)
    VALUES (${ip1.id}, ${U1}, ${ip1.appId}, ${JSON.stringify(ip1.result)})
    ON CONFLICT (id) DO NOTHING
  `);
  for (const ip of U2_INTERVIEW_PREPS) {
    await db.execute(sql`
      INSERT INTO interview_preps (id, user_id, application_id, result)
      VALUES (${ip.id}, ${U2}, ${ip.appId}, ${JSON.stringify(ip.result)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Interview preps created');

  // -------------------------------------------------------------------------
  // 14. Resume suggestions
  // -------------------------------------------------------------------------
  const rs1 = U1_RESUME_SUGGESTIONS;
  await db.execute(sql`
    INSERT INTO resume_suggestions (id, user_id, application_id, document_id, result)
    VALUES (${rs1.id}, ${U1}, ${rs1.appId}, ${rs1.docId}, ${JSON.stringify(rs1.result)})
    ON CONFLICT (id) DO NOTHING
  `);
  for (const rs of U2_RESUME_SUGGESTIONS) {
    await db.execute(sql`
      INSERT INTO resume_suggestions (id, user_id, application_id, document_id, result)
      VALUES (${rs.id}, ${U2}, ${rs.appId}, ${rs.docId}, ${JSON.stringify(rs.result)})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Resume suggestions created');

  // -------------------------------------------------------------------------
  // 15. AI usage
  // -------------------------------------------------------------------------
  let aiIdx = 0;
  for (const [userId, entries] of [[U1, U1_AI_USAGE], [U2, U2_AI_USAGE]]) {
    for (const [i, entry] of entries.entries()) {
      const aid = sid(`000000a${aiIdx.toString(16).padStart(5, '0')}`);
      aiIdx++;
      const createdAt = daysAgo(entry.daysAgo);
      await db.execute(sql`
        INSERT INTO ai_usage (id, user_id, feature, model, input_tokens, output_tokens, cost_cents, created_at)
        VALUES (${aid}, ${userId}, ${entry.feature}, ${entry.model}, ${entry.inputTokens}, ${entry.outputTokens}, ${entry.costCents}, ${createdAt})
        ON CONFLICT (id) DO NOTHING
      `);
    }
  }
  console.log('  AI usage records created');

  // -------------------------------------------------------------------------
  // 16. Notifications
  // -------------------------------------------------------------------------
  for (const n of [...U1_NOTIFICATIONS, ...U2_NOTIFICATIONS]) {
    const userId = U1_NOTIFICATIONS.includes(n) ? U1 : U2;
    const createdAt = daysAgo(n.daysAgo);
    await db.execute(sql`
      INSERT INTO notifications (id, user_id, type, title, body, is_read, application_id, created_at)
      VALUES (${n.id}, ${userId}, ${n.type}, ${n.title}, ${n.body}, ${n.isRead}, ${n.appId ?? null}, ${createdAt})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Notifications created');

  // -------------------------------------------------------------------------
  // 17. Payments (Pro user only)
  // -------------------------------------------------------------------------
  for (const p of U2_PAYMENTS) {
    const createdAt = daysAgo(p.daysAgo);
    await db.execute(sql`
      INSERT INTO payments (id, user_id, subscription_id, provider_payment_id, amount_cents, currency, status, created_at)
      VALUES (${p.id}, ${U2}, ${U2_SUB}, ${p.providerPaymentId}, ${p.amountCents}, 'usd', ${p.status}, ${createdAt})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Payments created');

  console.log('Seed complete!');
  console.log(`  Demo user: demo@trackedyourfuture.com / ${demoPassword}`);
  console.log(`  Pro user:  pro@trackedyourfuture.com / ${proPassword}`);
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
} finally {
  await client.end();
  s3.destroy();
}
