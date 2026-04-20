import { useState } from "react";
import { useForm, useController } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUserFn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const { field: termsField } = useController({
    name: "terms",
    control,
  });

  const handleGoogleSignup = () => {
    console.log("Google signup not implemented yet");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await registerUserFn(data);

      if (!result.success) {
        setError("email", {
          type: "manual",
          message: result.message,
        });
        return;
      }

      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Create your AlignMate account
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          
          {/* GOOGLE BUTTON */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignup}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="18"
              height="18"
            >
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.2 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.6 4.6 29.6 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c10.5 0 19.3-7.7 19.3-20 0-1.3-.1-2.7-.3-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.7 1.1 7.8 2.9l6-6C34.6 4.6 29.6 2 24 2 16.3 2 9.6 6.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 42c5.1 0 9.8-1.9 13.3-5.1l-6.1-5c-2.1 1.5-4.8 2.4-7.2 2.4-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.5 37.7 16.1 42 24 42z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.6 5.6-6.6 7.1l6.1 5C39.9 36.4 44 30 44 22c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </Button>

          {/* DIVIDER */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="flex-1 h-px bg-gray-300" />
            <span>OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* NAME */}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register("name")} placeholder="John Doe" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input {...register("email")} type="email" />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* TERMS */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  checked={!!termsField.value}
                  onCheckedChange={termsField.onChange}
                />
                <Label>
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              {errors.terms && (
                <p className="text-sm text-red-500">{errors.terms.message}</p>
              )}
            </div>

            {/* SUBMIT */}
            <Button className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}