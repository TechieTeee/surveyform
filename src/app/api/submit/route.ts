import { neon } from '@neondatabase/serverless';

export async function PUT(request: Request) {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return new Response('Database configuration error', { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract and validate required fields
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const email = formData.get('email')?.toString();
    const phoneNumber = formData.get('phoneNumber')?.toString();
    const dateOfBirth = formData.get('dateOfBirth')?.toString();
    const racialBackground = formData.get('racialBackground')?.toString();
    const gender = formData.get('gender')?.toString();
    const country = formData.get('country')?.toString();
    const state = formData.get('state')?.toString();
    const relationshipStatus = formData.get('relationshipStatus')?.toString();
    const primaryInsurance = formData.get('primaryInsurance')?.toString();
    const chronicConditions = formData.get('chronicConditions')?.toString();
    
    // Convert numeric fields with proper validation
    const age = formData.get('age') ? parseInt(formData.get('age')!.toString(), 10) : null;
    const currentSavings = formData.get('currentSavings') ? parseInt(formData.get('currentSavings')!.toString(), 10) : null;
    const monthlyDeposits = formData.get('monthlyDeposits') ? parseInt(formData.get('monthlyDeposits')!.toString(), 10) : null;
    const yearsRetirement = formData.get('yearsRetirement') ? parseInt(formData.get('yearsRetirement')!.toString(), 10) : null;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return new Response('Missing required fields: firstName, lastName, email', { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response('Invalid email format', { status: 400 });
    }

    console.log('Creating table if not exists...');
    
    // Create table with proper data types and constraints
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT NOT NULL,
        phoneNumber TEXT,
        dateOfBirth DATE,
        age INTEGER CHECK (age >= 0 AND age <= 150),
        racialBackground TEXT,
        gender TEXT,
        country TEXT,
        state TEXT,
        relationshipStatus TEXT,
        primaryInsurance TEXT,
        chronicConditions TEXT,
        currentSavings INTEGER CHECK (currentSavings >= 0),
        monthlyDeposits INTEGER CHECK (monthlyDeposits >= 0),
        yearsRetirement INTEGER CHECK (yearsRetirement >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Inserting data ...');

    // Insert data with proper error handling
    const result = await sql`
      INSERT INTO submissions (
        firstName, lastName, email, phoneNumber, dateOfBirth, age, 
        racialBackground, gender, country, state, relationshipStatus, 
        primaryInsurance, chronicConditions, currentSavings, monthlyDeposits, yearsRetirement
      ) VALUES (
        ${firstName}, ${lastName}, ${email}, ${phoneNumber}, ${dateOfBirth}, ${age}, 
        ${racialBackground}, ${gender}, ${country}, ${state}, ${relationshipStatus}, 
        ${primaryInsurance}, ${chronicConditions}, ${currentSavings}, ${monthlyDeposits}, ${yearsRetirement}
      ) RETURNING id
    `;

    console.log('Submission successful, ID:', result[0]?.id);

    return new Response(
      JSON.stringify({ 
        message: 'Submission successful', 
        id: result[0]?.id 
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Database error:', error);
    
    // Return different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return new Response('Duplicate submission detected', { status: 409 });
      }
      if (error.message.includes('violates check constraint')) {
        return new Response('Invalid data values provided', { status: 400 });
      }
      if (error.message.includes('invalid input syntax')) {
        return new Response('Invalid data format', { status: 400 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}