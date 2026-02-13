import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

const DEMO_EMAIL = 'demo@trackyourfuture.app';
const DEMO_PASSWORD = 'demo-password-2026!';
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

try {
  console.log('Seeding database...');

  // Hash password
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Create demo user
  await db.execute(sql`
    INSERT INTO users (id, name, email, hashed_password, email_verified, onboarding_completed)
    VALUES (
      ${DEMO_USER_ID},
      'Demo User',
      ${DEMO_EMAIL},
      ${passwordHash},
      NOW(),
      true
    )
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  Demo user created');

  // Create free subscription
  await db.execute(sql`
    INSERT INTO subscriptions (id, user_id, tier, status)
    VALUES (
      '00000000-0000-4000-8000-000000000002',
      ${DEMO_USER_ID},
      'free',
      'active'
    )
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  Free subscription created');

  // Create role categories
  const roles = [
    { id: '00000000-0000-4000-8000-000000000010', name: 'Software Engineer', color: '#22c55e' },
    { id: '00000000-0000-4000-8000-000000000011', name: 'Data Scientist', color: '#3b82f6' },
    { id: '00000000-0000-4000-8000-000000000012', name: 'Product Manager', color: '#f59e0b' },
  ];

  for (const [i, role] of roles.entries()) {
    await db.execute(sql`
      INSERT INTO role_categories (id, user_id, name, color, position)
      VALUES (${role.id}, ${DEMO_USER_ID}, ${role.name}, ${role.color}, ${i})
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Role categories created');

  // Create form field templates
  const fields = [
    { roleId: roles[0].id, fieldKey: 'Years of Experience', fieldValue: '5 years' },
    { roleId: roles[0].id, fieldKey: 'Tech Stack', fieldValue: 'TypeScript, React, Node.js, PostgreSQL, AWS' },
    { roleId: roles[0].id, fieldKey: 'Salary Expectation', fieldValue: '$120,000 - $150,000' },
    { roleId: roles[1].id, fieldKey: 'Years of Experience', fieldValue: '3 years' },
    { roleId: roles[1].id, fieldKey: 'Tech Stack', fieldValue: 'Python, TensorFlow, PyTorch, SQL, Spark' },
    { roleId: roles[1].id, fieldKey: 'Salary Expectation', fieldValue: '$130,000 - $160,000' },
    { roleId: roles[2].id, fieldKey: 'Years of Experience', fieldValue: '4 years' },
    { roleId: roles[2].id, fieldKey: 'Domain Expertise', fieldValue: 'B2B SaaS, Developer Tools, Platform Products' },
    { roleId: roles[2].id, fieldKey: 'Salary Expectation', fieldValue: '$140,000 - $170,000' },
  ];

  for (const [i, field] of fields.entries()) {
    await db.execute(sql`
      INSERT INTO form_field_templates (id, user_id, role_category_id, field_key, field_value, position)
      VALUES (
        ${`00000000-0000-4000-8000-0000000001${(20 + i).toString()}`},
        ${DEMO_USER_ID},
        ${field.roleId},
        ${field.fieldKey},
        ${field.fieldValue},
        ${i % 3}
      )
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Form field templates created');

  // Create sample applications
  const apps = [
    { id: '00000000-0000-4000-8000-000000000030', company: 'Acme Corp', title: 'Senior Software Engineer', status: 'draft', roleIdx: 0 },
    { id: '00000000-0000-4000-8000-000000000031', company: 'TechStart Inc', title: 'Full Stack Developer', status: 'applied', roleIdx: 0 },
    { id: '00000000-0000-4000-8000-000000000032', company: 'DataFlow AI', title: 'ML Engineer', status: 'phone_screen', roleIdx: 1 },
    { id: '00000000-0000-4000-8000-000000000033', company: 'CloudNine', title: 'Backend Engineer', status: 'interview', roleIdx: 0 },
    { id: '00000000-0000-4000-8000-000000000034', company: 'Quantum Labs', title: 'Data Scientist', status: 'offer', roleIdx: 1 },
    { id: '00000000-0000-4000-8000-000000000035', company: 'NexGen', title: 'Product Manager', status: 'rejected', roleIdx: 2 },
    { id: '00000000-0000-4000-8000-000000000036', company: 'Innovate Co', title: 'Senior PM', status: 'applied', roleIdx: 2 },
    { id: '00000000-0000-4000-8000-000000000037', company: 'Meta Systems', title: 'Software Engineer', status: 'interview', roleIdx: 0 },
  ];

  for (const app of apps) {
    const appliedAt = app.status === 'draft' ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.execute(sql`
      INSERT INTO applications (id, user_id, role_category_id, company_name, job_title, current_status, applied_at)
      VALUES (
        ${app.id},
        ${DEMO_USER_ID},
        ${roles[app.roleIdx].id},
        ${app.company},
        ${app.title},
        ${app.status},
        ${appliedAt}
      )
      ON CONFLICT (id) DO NOTHING
    `);
  }
  console.log('  Sample applications created');

  // Create status history for non-draft applications
  const statusProgression = {
    applied: ['draft', 'applied'],
    phone_screen: ['draft', 'applied', 'phone_screen'],
    interview: ['draft', 'applied', 'phone_screen', 'interview'],
    offer: ['draft', 'applied', 'phone_screen', 'interview', 'offer'],
    rejected: ['draft', 'applied', 'rejected'],
  };

  let historyIdx = 0;
  for (const app of apps) {
    if (app.status === 'draft') continue;
    const progression = statusProgression[app.status] || [];
    for (let i = 1; i < progression.length; i++) {
      const changedAt = new Date(Date.now() - (progression.length - i) * 3 * 24 * 60 * 60 * 1000).toISOString();
      await db.execute(sql`
        INSERT INTO application_status_history (id, application_id, from_status, to_status, changed_at)
        VALUES (
          ${`00000000-0000-4000-8000-00000000${(50 + historyIdx).toString().padStart(2, '0')}${historyIdx.toString().padStart(2, '0')}`},
          ${app.id},
          ${progression[i - 1]},
          ${progression[i]},
          ${changedAt}
        )
        ON CONFLICT (id) DO NOTHING
      `);
      historyIdx++;
    }
  }
  console.log('  Status history created');

  console.log('Seed complete');
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
} finally {
  await client.end();
}
