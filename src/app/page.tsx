"use client";
import { useForm, SubmitHandler } from "react-hook-form";

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
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  console.log(watch("firstName")); // watch input value by passing the name of it

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Label for First Name */}
      <label>First Name</label>
      {/* Registers Value for First Name*/}
      <input
        defaultValue="John"
        {...register("firstName", { required: true, pattern: /^[A-Za-z]+$/i })}
      />
      {/* errors will return when field validation fails  */}
      {errors.firstName && <span>First Name Required</span>}

      {/* include validation with required or other standard HTML validation rules */}
      {/* Label for Last Name */}
      <label>Last Name</label>
      <input
        defaultValue="Doe"
        {...register("lastName", { required: true, pattern: /^[A-Za-z]+$/i })}
      />
      {/* errors will return when field validation fails  */}
      {errors.lastName && <span>Last Name Required</span>}

      {/* include validation with required or other standard HTML validation rules */}
      {/* Label for Email */}
      <label>Email</label>
      <input
        defaultValue="JohnDoe@yahoo.com"
        {...register("email", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.email && <span>Email Required</span>}

      {/* Label for Phone Number */}
      <label>Phone Number</label>
      <input
        defaultValue="+1 579-809-2728"
        {...register("phoneNumber", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.phoneNumber && <span>Phone Number Required</span>}

      {/* Label for Date of Birth */}
      <label>Date of Birth</label>
      <input
        defaultValue="Month/Date/Year Example: 05/08/1962"
        {...register("dateOfBirth", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.dateOfBirth && <span>Date of Birth Required</span>}

      {/* Label for Age */}
      <label>Age</label>
      <input defaultValue="65" {...register("age", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.age && <span>Age Required</span>}

      {/* Label for Race */}
      <label>Racial Background</label>
      <input
        defaultValue="Latino"
        {...register("racialBackground", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.racialBackground && <span>Racial Background Required</span>}

      {/* Label for Gender */}
      <label>Gender Assigned at Birth</label>
      <input
        defaultValue="Female"
        {...register("gender", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.gender && <span>Gender Required</span>}

      {/* Label for Country */}
      <label>Country of Primary Residence</label>
      <input
        defaultValue="United States of America"
        {...register("country", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.country && <span>Country Required</span>}

      {/* Label for State */}
      <label>State of Primary Residence</label>
      <input
        defaultValue="Alabama"
        {...register("state", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.state && <span>State Required</span>}

      {/* Label for Relationship Status */}
      <label>Current Relationship Status</label>
      <input
        defaultValue="Example: Single, Commomn Law, Married, etc."
        {...register("relationshipStatus", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.relationshipStatus && <span>Relationship Status Required</span>}

      {/* Label for Primary Insurance Provider */}
      <label>Primary Insurance Provider</label>
      <input
        defaultValue="Humana"
        {...register("primaryInsurance", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.primaryInsurance && (
        <span>Primary Insurance Provider Required</span>
      )}

      {/* Label for Chronic Conditions */}
      <label>Any chronic conditions? Please describe. </label>
      <input
        defaultValue="Diabetes"
        {...register("chronicConditions", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.chronicConditions && (
        <span>Chronic Conditions Status Required</span>
      )}

      {/* Label for Current Healthcare Savings */}
      <label>Current Total Value of Health Care Savings Account $USD </label>
      <input
        defaultValue="375000"
        {...register("currentSavings", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.currentSavings && (
        <span>Total Value of Current Healthcare Savings Required</span>
      )}

      {/* Label for Monthly Deposits */}
      <label>Current Monthly Deposits $USD</label>
      <input
        defaultValue="10000"
        {...register("monthlyDeposits", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.monthlyDeposits && <span>Current Monthly Deposits Required</span>}

      {/* Label for Years to Retirement*/}
      <label>Years Left to Retirement</label>
      <input
        defaultValue="30"
        {...register("yearsRetirement", { required: true })}
      />
      {/* errors will return when field validation fails  */}
      {errors.yearsRetirement && <span>Years to Retirement Required</span>}
      <input type="submit" />
    </form>
  );
}
