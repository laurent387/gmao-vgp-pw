const { Client } = require('pg');

async function fixAttachments() {
  const db = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://api_user:password@localhost:5432/in_spectra',
  });

  await db.connect();
  console.log('Connected to database');

  try {
    // Drop old constraint
    await db.query('ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_owner_type_check');
    console.log('Dropped old constraint');

    // Add new constraint with NONCONFORMITY
    await db.query(`ALTER TABLE attachments ADD CONSTRAINT attachments_owner_type_check CHECK (owner_type IN ('EQUIPMENT', 'REPORT', 'VGP_REPORT', 'VGP_RUN', 'NONCONFORMITY', 'MISSION'))`);
    console.log('Added new constraint');

    // Make created_by nullable
    await db.query('ALTER TABLE attachments ALTER COLUMN created_by DROP NOT NULL');
    console.log('Made created_by nullable');

    // Check if original_file_name exists and make it nullable
    const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'attachments' AND column_name = 'original_file_name'`);
    if (res.rows.length > 0) {
      await db.query('ALTER TABLE attachments ALTER COLUMN original_file_name DROP NOT NULL');
      console.log('Made original_file_name nullable');
    }

    console.log('All done!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.end();
  }
}

fixAttachments();
