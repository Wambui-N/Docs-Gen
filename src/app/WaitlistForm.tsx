"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const { redirectToSignUp } = useClerk();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    redirectToSignUp({ initialValues: { emailAddress: email } });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md items-center space-x-2"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit">Join Waitlist</Button>
    </form>
  );
} 