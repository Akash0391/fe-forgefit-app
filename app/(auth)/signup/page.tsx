"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

const SignupPage = () => {
  const { login } = useAuth();
  
  const handleGoogleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex flex-col p-4 relative">
      {/* Header */}
      <div className="pt-8 pb-4">
        <h1 className="text-3xl font-bold text-center text-foreground">
          ForgeFit
        </h1>
        <p className="text-muted-foreground text-center mt-2">
          Sign up to continue with ForgeFit
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section */}
      <div className="pb-8 space-y-4">
        <div className="w-full max-w-md mx-auto">
          <Button
            onClick={handleGoogleLogin}
            className="w-full text-lg rounded-[12px] p-6 justify-start"
            size="lg"
            variant="outline"
          >
            <Image
              src="/images/google-logo.png"
              alt="Google"
              width={20}
              height={20}
              className="flex-shrink-0"
              unoptimized
            />
            <span className="flex-1 mr-8">Sign up with Google</span>
          </Button>
        </div>
        <p className="text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
