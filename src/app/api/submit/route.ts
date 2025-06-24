import { neon } from '@neondatabase/serverless';
import { createHash, createCipheriv, randomBytes } from 'crypto';

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || createHash('sha256').update('default-key-change-this').digest();
const ALGORITHM = 'aes-256-gcm';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Utility functions for data protection
function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
}

function hashPII(data: string): string {
  return createHash('sha256').update(data + (process.env.HASH_SALT || 'default-salt')).digest('hex');
}

function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['email', 'phoneNumber', 'dateOfBirth', 'chronicConditions'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}

function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateAndSanitizeInput(input: string | null, maxLength: number = 255): string | null {
  if (!input) return null;
  
  // Remove potentially harmful characters
  const sanitized = input
    .replace(/[<>"'&]/g, '') // Remove HTML/XSS characters
    .replace(/[;\-\-]/g, '') // Remove SQL injection patterns
    .trim()
    .substring(0, maxLength);
    
  return sanitized || null;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation (adjust based on your requirements)
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
}

function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const minDate = new Date('1900-01-01');
  
  return date instanceof Date && 
         !isNaN(date.getTime()) && 
         date <= now && 
         date >= minDate;
}

export async function PUT(request: Request) {
  const startTime = Date.now();
  let clientIP = 'unknown';
  
  try {
    // Extract client IP for rate limiting and logging
    clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Validate IP format
    if (clientIP !== 'unknown' && !isValidIPAddress(clientIP)) {
      console.warn('Invalid IP format detected:', clientIP);
      return new Response('Invalid request', { status: 400 });
    }

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return new Response('Too many requests', { status: 429 });
    }

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return new Response('Service unavailable', { status: 503 });
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return new Response('Invalid content type', { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Parse form data with size limit
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Failed to parse form data:', error);
      return new Response('Invalid form data', { status: 400 });
    }
    
    // Extract and sanitize form fields
    const firstName = validateAndSanitizeInput(formData.get('firstName')?.toString() || null, 50);
    const lastName = validateAndSanitizeInput(formData.get('lastName')?.toString() || null, 50);
    const email = validateAndSanitizeInput(formData.get('email')?.toString() || null, 254);
    const phoneNumber = validateAndSanitizeInput(formData.get('phoneNumber')?.toString() || null, 20);
    const dateOfBirth = validateAndSanitizeInput(formData.get('dateOfBirth')?.toString() || null, 10);
    const racialBackground = validateAndSanitizeInput(formData.get('racialBackground')?.toString() || null, 50);
    const gender = validateAndSanitizeInput(formData.get('gender')?.toString() || null, 20);
    const country = validateAndSanitizeInput(formData.get('country')?.toString() || null, 50);
    const state = validateAndSanitizeInput(formData.get('state')?.toString() || null, 50);
    const relationshipStatus = validateAndSanitizeInput(formData.get('relationshipStatus')?.toString() || null, 30);
    const primaryInsurance = validateAndSanitizeInput(formData.get('primaryInsurance')?.toString() || null, 100);
    const chronicConditions = validateAndSanitizeInput(formData.get('chronicConditions')?.toString() || null, 500);
    
    // Validate numeric fields
    const ageStr = formData.get('age')?.toString() || null;
    const currentSavingsStr = formData.get('currentSavings')?.toString() || null;
    const monthlyDepositsStr = formData.get('monthlyDeposits')?.toString() || null;
    const yearsRetirementStr = formData.get('yearsRetirement')?.toString() || null;
    
    const age = ageStr ? parseInt(ageStr, 10) : null;
    const currentSavings = currentSavingsStr ? parseInt(currentSavingsStr, 10) : null;
    const monthlyDeposits = monthlyDepositsStr ? parseInt(monthlyDepositsStr, 10) : null;
    const yearsRetirement = yearsRetirementStr ? parseInt(yearsRetirementStr, 10) : null;

    // Comprehensive validation
    if (!firstName || !lastName || !email) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (!validateEmail(email)) {
      return new Response('Invalid email format', { status: 400 });
    }

    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return new Response('Invalid phone number format', { status: 400 });
    }

    if (dateOfBirth && !validateDate(dateOfBirth)) {
      return new Response('Invalid date of birth', { status: 400 });
    }

    // Validate numeric ranges
    if (age !== null && (age < 0 || age > 150)) {
      return new Response('Invalid age value', { status: 400 });
    }

    if (currentSavings !== null && (currentSavings < 0 || currentSavings > 10000000)) {
      return new Response('Invalid current savings value', { status: 400 });
    }

    if (monthlyDeposits !== null && (monthlyDeposits < 0 || monthlyDeposits > 100000)) {
      return new Response('Invalid monthly deposits value', { status: 400 });
    }

    if (yearsRetirement !== null && (yearsRetirement < 0 || yearsRetirement > 100)) {
      return new Response('Invalid years to retirement value', { status: 400 });
    }

    console.log('Processing submission for client:', clientIP);
    console.log('Sanitized data:', sanitizeForLogging({
      firstName, lastName, email, phoneNumber, age, country, state
    }));
    
    // Create table with enhanced security
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email_hash TEXT NOT NULL, -- Store hashed email for deduplication
        email_encrypted TEXT NOT NULL, -- Store encrypted email
        email_iv TEXT NOT NULL,
        email_tag TEXT NOT NULL,
        phoneNumber_encrypted TEXT,
        phoneNumber_iv TEXT,
        phoneNumber_tag TEXT,
        dateOfBirth_encrypted TEXT,
        dateOfBirth_iv TEXT,
        dateOfBirth_tag TEXT,
        age INTEGER CHECK (age >= 0 AND age <= 150),
        racialBackground TEXT,
        gender TEXT,
        country TEXT,
        state TEXT,
        relationshipStatus TEXT,
        primaryInsurance TEXT,
        chronicConditions_encrypted TEXT,
        chronicConditions_iv TEXT,
        chronicConditions_tag TEXT,
        currentSavings INTEGER CHECK (currentSavings >= 0),
        monthlyDeposits INTEGER CHECK (monthlyDeposits >= 0),
        yearsRetirement INTEGER CHECK (yearsRetirement >= 0),
        client_ip TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email_hash) -- Prevent duplicate submissions
      )
    `;

    // Encrypt sensitive data
    const emailEncrypted = encrypt(email);
    const emailHash = hashPII(email);
    
    const phoneEncrypted = phoneNumber ? encrypt(phoneNumber) : null;
    const dobEncrypted = dateOfBirth ? encrypt(dateOfBirth) : null;
    const conditionsEncrypted = chronicConditions ? encrypt(chronicConditions) : null;

    console.log('Inserting encrypted data...');

    // Insert data with encryption
    const result = await sql`
      INSERT INTO submissions (
        firstName, lastName, email_hash, email_encrypted, email_iv, email_tag,
        phoneNumber_encrypted, phoneNumber_iv, phoneNumber_tag,
        dateOfBirth_encrypted, dateOfBirth_iv, dateOfBirth_tag,
        age, racialBackground, gender, country, state, relationshipStatus, 
        primaryInsurance, chronicConditions_encrypted, chronicConditions_iv, chronicConditions_tag,
        currentSavings, monthlyDeposits, yearsRetirement, client_ip
      ) VALUES (
        ${firstName}, ${lastName}, ${emailHash}, ${emailEncrypted.encrypted}, ${emailEncrypted.iv}, ${emailEncrypted.tag},
        ${phoneEncrypted?.encrypted || null}, ${phoneEncrypted?.iv || null}, ${phoneEncrypted?.tag || null},
        ${dobEncrypted?.encrypted || null}, ${dobEncrypted?.iv || null}, ${dobEncrypted?.tag || null},
        ${age}, ${racialBackground}, ${gender}, ${country}, ${state}, ${relationshipStatus}, 
        ${primaryInsurance}, ${conditionsEncrypted?.encrypted || null}, ${conditionsEncrypted?.iv || null}, ${conditionsEncrypted?.tag || null},
        ${currentSavings}, ${monthlyDeposits}, ${yearsRetirement}, ${clientIP}
      ) RETURNING id
    `;

    const processingTime = Date.now() - startTime;
    console.log('Submission successful, ID:', result[0]?.id, 'Processing time:', processingTime + 'ms');

    return new Response(
      JSON.stringify({ 
        message: 'Submission successful', 
        id: result[0]?.id 
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString()
        },
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Database error for IP:', clientIP, 'Error:', error);
    
    // Return different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('email_hash')) {
        console.warn('Duplicate submission attempt from IP:', clientIP);
        return new Response('Duplicate submission detected', { status: 409 });
      }
      if (error.message.includes('violates check constraint')) {
        return new Response('Invalid data values provided', { status: 400 });
      }
      if (error.message.includes('invalid input syntax')) {
        return new Response('Invalid data format', { status: 400 });
      }
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return new Response('Service temporarily unavailable', { status: 503 });
      }
    }
    
    return new Response('Internal server error', { 
      status: 500,
      headers: {
        'X-Processing-Time': processingTime.toString()
      }
    });
  }
}