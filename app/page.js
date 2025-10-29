"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import HomePageHeader from "./_component/HomePageHeader";
import Hero from "./_component/Hero";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.user.createUser);

  useEffect(() => {
    user && CheckUser()
  }, [user])

  const CheckUser = async () => {
    const result = await createUser({
      email: user?.primaryEmailAddress?.emailAddress,
      imageUrl: user?.imageUrl,
      userName: user?.fullName
    })
    console.log(result)
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Layer - Full Screen */}
      <div className="fixed inset-0 z-0 bg-[#f9fafb]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, #d1d5db 1px, transparent 1px),
            linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
          `,
            backgroundSize: "32px 32px",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)",
          }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10" >
        <HomePageHeader />
        <Hero />
      </div >
    </div >
  );
}
