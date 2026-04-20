import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError("");

    try {
      const result = await login(data);

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      navigate("/live");
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome Back 👋
          </CardTitle>
          <p className="text-sm text-center text-muted-foreground">
            Login to continue using AlignMate
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2 relative">
              <Label>Password</Label>

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-9 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* SERVER ERROR */}
            {serverError && (
              <p className="text-sm text-red-600 text-center">
                {serverError}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>

            {/* DIVIDER */}
            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            {/* GOOGLE BUTTON */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() =>
                console.log("Google login not implemented yet")
              }
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

            {/* REGISTER LINK */}
            <p className="text-sm text-center text-muted-foreground">
              Don’t have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}