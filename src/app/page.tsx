"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState, useEffect } from "react";

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  age: number;
  racialBackground: string;
  gender: string;
  country: string;
  state: string;
  relationshipStatus: string;
  primaryInsurance: string;
  chronicConditions: string;
  currentSavings: number;
  monthlyDeposits: number;
  yearsRetirement: number;
};

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<'form' | 'review' | 'success'>('form');
  const [formData, setFormData] = useState<Inputs | null>(null);
  const [progress, setProgress] = useState(0);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<Inputs>();

  // Calculate progress based on filled fields
  const watchedFields = watch();
  
  useEffect(() => {
    if (currentStep === 'form') {
      const totalFields = 16;
      const filledFields = Object.values(watchedFields).filter(value => 
        value !== undefined && value !== null && value !== ''
      ).length;
      setProgress((filledFields / totalFields) * 100);
    }
  }, [watchedFields, currentStep]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    // Clear any previous messages
    setRateLimitMessage("");
    setSubmitMessage("");
    
    // Additional client-side validation for security
    if (!data.email || !data.firstName || !data.lastName) {
      setSubmitMessage("Error: Missing required fields");
      return;
    }

    // Validate email format more strictly
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      setSubmitMessage("Error: Please enter a valid email address");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    if (data.phoneNumber && !phoneRegex.test(data.phoneNumber)) {
      setSubmitMessage("Error: Please enter a valid phone number");
      return;
    }

    // Validate date of birth
    const birthDate = new Date(data.dateOfBirth);
    const now = new Date();
    const minDate = new Date('1900-01-01');
    
    if (birthDate > now || birthDate < minDate) {
      setSubmitMessage("Error: Please enter a valid date of birth");
      return;
    }

    // Validate numeric ranges
    if (data.age < 18 || data.age > 150) {
      setSubmitMessage("Error: Age must be between 18 and 150");
      return;
    }

    if (data.currentSavings < 0 || data.currentSavings > 10000000) {
      setSubmitMessage("Error: Current savings must be between 0 and 10,000,000");
      return;
    }

    if (data.monthlyDeposits < 0 || data.monthlyDeposits > 100000) {
      setSubmitMessage("Error: Monthly deposits must be between 0 and 100,000");
      return;
    }

    if (data.yearsRetirement < 0 || data.yearsRetirement > 100) {
      setSubmitMessage("Error: Years to retirement must be between 0 and 100");
      return;
    }

    setFormData(data);
    setCurrentStep('review');
  };

  const handleConfirmSubmission = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    setRateLimitMessage("");

    try {
      // Create FormData to match your API route expectations
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData with proper string conversion
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Send PUT request to your API route
      const response = await fetch('/api/survey', {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const responseData = await response.json();
        setSubmitMessage("Survey submitted successfully!");
        setCurrentStep('success');
        setProgress(100);
        reset(); // Clear the form
        console.log('Submission ID:', responseData.id);
      } else {
        // Handle different error types from the enhanced route
        const errorText = await response.text();
        
        switch (response.status) {
          case 400:
            setSubmitMessage(`Error: ${errorText}`);
            break;
          case 409:
            setSubmitMessage("Error: You have already submitted this survey with this email address.");
            break;
          case 429:
            setRateLimitMessage("Too many requests. Please wait a moment before trying again.");
            setTimeout(() => setRateLimitMessage(""), 5000); // Clear after 5 seconds
            break;
          case 503:
            setSubmitMessage("Service temporarily unavailable. Please try again later.");
            break;
          default:
            setSubmitMessage(`Error: ${errorText}`);
        }
        setCurrentStep('form');
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setSubmitMessage("Network error. Please check your connection and try again.");
      } else {
        setSubmitMessage("An unexpected error occurred while submitting the survey.");
      }
      setCurrentStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResponse = () => {
    setCurrentStep('form');
    setProgress(100); // Show full progress when editing
    setRateLimitMessage(""); // Clear any rate limit messages
  };

  const handleStartOver = () => {
    setCurrentStep('form');
    setFormData(null);
    setSubmitMessage("");
    setRateLimitMessage("");
    setProgress(0);
    reset();
  };

  // Progress bar component
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Progress</span>
        <span style={{ fontSize: '14px', color: '#666' }}>{Math.round(progress)}%</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: progress === 100 ? '#28a745' : '#007bff',
          transition: 'width 0.3s ease, background-color 0.3s ease'
        }} />
      </div>
    </div>
  );

  // Enhanced message display component
  const MessageDisplay = ({ message, type }: { message: string; type: 'error' | 'success' | 'warning' }) => {
    const getStyles = () => {
      switch (type) {
        case 'error':
          return { backgroundColor: '#fee', border: '1px solid #fcc', color: '#d32f2f' };
        case 'success':
          return { backgroundColor: '#efe', border: '1px solid #cfc', color: '#2e7d32' };
        case 'warning':
          return { backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', color: '#856404' };
        default:
          return { backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', color: '#495057' };
      }
    };

    return (
      <div style={{ 
        padding: '12px', 
        marginBottom: '20px', 
        borderRadius: '4px',
        ...getStyles()
      }}>
        {message}
      </div>
    );
  };

  // Review component
  const ReviewSection = () => (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Review Your Submission</h1>
      <ProgressBar progress={100} />
      
      {rateLimitMessage && <MessageDisplay message={rateLimitMessage} type="warning" />}
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Personal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div><strong>First Name:</strong> {formData?.firstName}</div>
          <div><strong>Last Name:</strong> {formData?.lastName}</div>
          <div><strong>Email:</strong> {formData?.email}</div>
          <div><strong>Phone:</strong> {formData?.phoneNumber}</div>
          <div><strong>Date of Birth:</strong> {formData?.dateOfBirth}</div>
          <div><strong>Age:</strong> {formData?.age}</div>
          <div><strong>Racial Background:</strong> {formData?.racialBackground}</div>
          <div><strong>Gender:</strong> {formData?.gender}</div>
        </div>

        <h3 style={{ color: '#333' }}>Location & Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div><strong>Country:</strong> {formData?.country}</div>
          <div><strong>State:</strong> {formData?.state}</div>
          <div><strong>Relationship Status:</strong> {formData?.relationshipStatus}</div>
          <div><strong>Primary Insurance:</strong> {formData?.primaryInsurance}</div>
        </div>

        <h3 style={{ color: '#333' }}>Health & Financial Information</h3>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Chronic Conditions:</strong> {formData?.chronicConditions}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><strong>Current Savings:</strong> ${formData?.currentSavings?.toLocaleString()}</div>
            <div><strong>Monthly Deposits:</strong> ${formData?.monthlyDeposits?.toLocaleString()}</div>
            <div><strong>Years to Retirement:</strong> {formData?.yearsRetirement}</div>
          </div>
        </div>
      </div>

      {submitMessage && (
        <MessageDisplay 
          message={submitMessage} 
          type={submitMessage.includes('Error') ? 'error' : 'success'} 
        />
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleEditResponse}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Edit Response
        </button>
        <button
          onClick={handleConfirmSubmission}
          disabled={isSubmitting}
          style={{
            padding: '12px 24px',
            backgroundColor: isSubmitting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  );

  // Success component
  const SuccessSection = () => (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        backgroundColor: '#d4edda',
        color: '#155724',
        padding: '40px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: '#155724', marginBottom: '10px' }}>✅ Thank You!</h1>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Your survey has been successfully submitted and securely stored.
        </p>
        <ProgressBar progress={100} />
        <p style={{ color: '#666', marginTop: '20px' }}>
          We appreciate you taking the time to complete our healthcare survey. 
          Your responses will help us better understand healthcare needs and planning.
          Your sensitive information has been encrypted and is protected.
        </p>
      </div>
      
      <button
        onClick={handleStartOver}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Submit Another Response
      </button>
    </div>
  );

  // Render based on current step
  if (currentStep === 'review') {
    return <ReviewSection />;
  }

  if (currentStep === 'success') {
    return <SuccessSection />;
  }

  // Main form
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Healthcare Financials Customer Onboarding Form</h1>
      
      <ProgressBar progress={progress} />
      
      {rateLimitMessage && <MessageDisplay message={rateLimitMessage} type="warning" />}
      
      {submitMessage && (
        <MessageDisplay 
          message={submitMessage} 
          type={submitMessage.includes('Error') ? 'error' : 'success'} 
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* First Name */}
        <div>
          <label>First Name</label>
          <input
            {...register("firstName", { 
              required: "First Name is required", 
              maxLength: { value: 50, message: "First name must be less than 50 characters" },
              pattern: {
                value: /^[A-Za-z\s]+$/i,
                message: "First name should only contain letters and spaces"
              }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.firstName && <span style={{ color: 'red' }}>{errors.firstName.message}</span>}
        </div>

        {/* Last Name */}
        <div>
          <label>Last Name</label>
          <input
            {...register("lastName", { 
              required: "Last Name is required", 
              maxLength: { value: 50, message: "Last name must be less than 50 characters" },
              pattern: {
                value: /^[A-Za-z\s]+$/i,
                message: "Last name should only contain letters and spaces"
              }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.lastName && <span style={{ color: 'red' }}>{errors.lastName.message}</span>}
        </div>

        {/* Email */}
        <div>
          <label>Email</label>
          <input
            type="email"
            {...register("email", { 
              required: "Email is required",
              maxLength: { value: 254, message: "Email must be less than 254 characters" },
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Please enter a valid email address"
              }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
        </div>

        {/* Phone Number */}
        <div>
          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="+1 579-809-2728"
            {...register("phoneNumber", { 
              required: "Phone Number is required",
              pattern: {
                value: /^[\+]?[\d\s\-\(\)]{10,15}$/,
                message: "Please enter a valid phone number (10-15 digits)"
              }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.phoneNumber && <span style={{ color: 'red' }}>{errors.phoneNumber.message}</span>}
        </div>

        {/* Date of Birth */}
        <div>
          <label>Date of Birth</label>
          <input
            type="date"
            {...register("dateOfBirth", { 
              required: "Date of Birth is required",
              validate: (value) => {
                const date = new Date(value);
                const now = new Date();
                const minDate = new Date('1900-01-01');
                if (date > now) return "Date of birth cannot be in the future";
                if (date < minDate) return "Please enter a valid date of birth";
                return true;
              }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.dateOfBirth && <span style={{ color: 'red' }}>{errors.dateOfBirth.message}</span>}
        </div>

        {/* Age */}
        <div>
          <label>Age</label>
          <input
            type="number"
            {...register("age", { 
              required: "Age is required", 
              min: { value: 18, message: "Must be at least 18 years old" },
              max: { value: 150, message: "Must be less than 150 years old" },
              valueAsNumber: true
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.age && <span style={{ color: 'red' }}>{errors.age.message}</span>}
        </div>

        {/* Racial Background */}
        <div>
          <label>Racial Background</label>
          <input
            placeholder="e.g., Latino, Asian, Black, White, etc."
            {...register("racialBackground", { 
              required: "Racial Background is required",
              maxLength: { value: 50, message: "Must be less than 50 characters" }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.racialBackground && <span style={{ color: 'red' }}>{errors.racialBackground.message}</span>}
        </div>

        {/* Gender */}
        <div>
          <label>Gender Assigned at Birth</label>
          <select
            {...register("gender", { required: "Gender is required" })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <span style={{ color: 'red' }}>{errors.gender.message}</span>}
        </div>

        {/* Country */}
        <div>
          <label>Country of Primary Residence</label>
          <input
            placeholder="United States of America"
            {...register("country", { 
              required: "Country is required",
              maxLength: { value: 50, message: "Must be less than 50 characters" }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.country && <span style={{ color: 'red' }}>{errors.country.message}</span>}
        </div>

        {/* State */}
        <div>
          <label>State of Primary Residence</label>
          <input
            placeholder="Alabama"
            {...register("state", { 
              required: "State is required",
              maxLength: { value: 50, message: "Must be less than 50 characters" }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.state && <span style={{ color: 'red' }}>{errors.state.message}</span>}
        </div>

        {/* Relationship Status */}
        <div>
          <label>Current Relationship Status</label>
          <select
            {...register("relationshipStatus", { required: "Relationship Status is required" })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Common Law">Common Law</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          {errors.relationshipStatus && <span style={{ color: 'red' }}>{errors.relationshipStatus.message}</span>}
        </div>

        {/* Primary Insurance */}
        <div>
          <label>Primary Insurance Provider</label>
          <input
            placeholder="e.g., Humana, Blue Cross, etc."
            {...register("primaryInsurance", { 
              required: "Primary Insurance Provider is required",
              maxLength: { value: 100, message: "Must be less than 100 characters" }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.primaryInsurance && <span style={{ color: 'red' }}>{errors.primaryInsurance.message}</span>}
        </div>

        {/* Chronic Conditions */}
        <div>
          <label>Any chronic conditions? Please describe.</label>
          <textarea
            placeholder="e.g., Diabetes, Hypertension, or 'None'"
            {...register("chronicConditions", { 
              required: "Please describe any chronic conditions or enter 'None'",
              maxLength: { value: 500, message: "Must be less than 500 characters" }
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
          />
          {errors.chronicConditions && <span style={{ color: 'red' }}>{errors.chronicConditions.message}</span>}
        </div>

        {/* Current Savings */}
        <div>
          <label>Current Total Value of Health Care Savings Account (USD)</label>
          <input
            type="number"
            placeholder="375000"
            {...register("currentSavings", { 
              required: "Current savings amount is required",
              min: { value: 0, message: "Amount must be positive" },
              max: { value: 10000000, message: "Amount must be less than $10,000,000" },
              valueAsNumber: true
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.currentSavings && <span style={{ color: 'red' }}>{errors.currentSavings.message}</span>}
        </div>

        {/* Monthly Deposits */}
        <div>
          <label>Current Monthly Deposits (USD)</label>
          <input
            type="number"
            placeholder="10000"
            {...register("monthlyDeposits", { 
              required: "Monthly deposits amount is required",
              min: { value: 0, message: "Amount must be positive" },
              max: { value: 100000, message: "Amount must be less than $100,000" },
              valueAsNumber: true
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.monthlyDeposits && <span style={{ color: 'red' }}>{errors.monthlyDeposits.message}</span>}
        </div>

        {/* Years to Retirement */}
        <div>
          <label>Years Left to Retirement</label>
          <input
            type="number"
            placeholder="30"
            {...register("yearsRetirement", { 
              required: "Years to retirement is required",
              min: { value: 0, message: "Must be 0 or positive" },
              max: { value: 100, message: "Must be reasonable (under 100 years)" },
              valueAsNumber: true
            })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.yearsRetirement && <span style={{ color: 'red' }}>{errors.yearsRetirement.message}</span>}
        </div>

        <button 
          type="submit" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          Review Submission
        </button>
      </form>
    </div>
  );
}