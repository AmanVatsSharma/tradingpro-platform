// app/login/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    const appId = process.env.NEXT_PUBLIC_VORTEX_APPLICATION_ID;
    window.location.href = `https://flow.rupeezy.in?applicationId=${appId}`;
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <Button onClick={handleLogin}>Login with Rupeezy</Button>
      </div>
    </div>
  );
}
