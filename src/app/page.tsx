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
  chronicConditions:string;
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
      <input defaultValue="John" {...register("firstName", { required: true, pattern: /^[A-Za-z]+$/i })} />

      {/* include validation with required or other standard HTML validation rules */}
         {/* Label for Last Name */}
      <label>Last Name</label>
      <input defaultValue="Doe" {...register("lastName", { required: true, pattern: /^[A-Za-z]+$/i })} />
      {/* errors will return when field validation fails  */}
      {errors.lastName && <span>Last Name Required</span>}


      {/* include validation with required or other standard HTML validation rules */}
         {/* Label for Email */}
      <label>Email</label>
      <input defaultValue="JohnDoe@yahoo.com" {...register("email", { required: true})} />
      {/* errors will return when field validation fails  */}
      {errors.lastName && <span>Email Required</span>}

      <input type="submit" />
    </form>
  );
}
