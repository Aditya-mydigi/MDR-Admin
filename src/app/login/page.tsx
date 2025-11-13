"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState(""); // 🟢 NEW
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("Send OTP:", data);

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setOtpToken(data.otpToken); // 🟢 STORE JWT OTP TOKEN
      setStep("otp");
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError("An error occurred. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otp,
          otpToken, // 🟢 SEND JWT OTP TOKEN
        }),
      });

      const data = await response.json();
      console.log("Verify OTP:", data);

      if (response.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError("Something went wrong. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setOtpToken(""); // 🟢 Clear token
    setError("");
  };

  if (!isClient) return null;

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* Left Illustration */}
      <div className="hidden lg:flex flex-1 justify-center items-center px-6 py-10 bg-white">
        <div className="w-full h-full flex justify-center items-center rounded-2xl overflow-hidden">
          <Image
            src="/left_illustration.png"
            alt="MDR App"
            width={600}
            height={800}
            className="object-cover rounded-2xl w-full h-full"
            priority
          />
        </div>
      </div>

      {/* Main Login */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 md:px-12 bg-white">
        <div className="mb-10">
          <Image
            src="/mdr_logo.png"
            alt="MDR Logo"
            width={160}
            height={60}
            priority
          />
        </div>

        <Card className="w-full max-w-sm border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-center">
              MDR Admin Panel
            </CardTitle>
            <CardDescription className="text-center">
              {step === "email"
                ? "Enter your email to receive an OTP"
                : "Enter the OTP sent to your email"}
            </CardDescription>
          </CardHeader>

          {/* Step 1: Email */}
          {step === "email" ? (
            <form onSubmit={handleSendOTP}>
              <CardContent className="space-y-4">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-[#00C2D1] hover:bg-[#00A8B5] text-white"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyOTP}>
              <CardContent className="space-y-4">
                <Label>Email</Label>
                <Input value={email} disabled className="bg-gray-50" />

                <Label>Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full bg-[#00C2D1] hover:bg-[#00A8B5] text-white"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToEmail}
                >
                  Back to Email
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
