"use client";

import Button from "@/app/components/general/button";
import Input from "@/app/components/general/input";
import { getPort } from "@/app/helpers/port";
import { getCookie } from "@/app/helpers/token_operations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent, useEffect, useState } from "react";

function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function logIn(e: FormEvent) {
    e.preventDefault();
    if (username === "" || password === "") {
      setError("Please fill in both fields");
      return;
    } else if (username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    } else if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const port = getPort();
    const res = await fetch(`${port}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    if (res.ok) {
      setError("");
      router.push('/')
      return;
    } else {
      setError("Invalid username or password. Please try again.");
      return;
    }
  }
  useEffect(() => {
    const token = getCookie("token");

    if (token) {
      router.push('/')
      alert("You're already signed in.");
      return;
    } else {
      return;
    }
  }, [router]);
  return (
    <section className="section">
      <div className="container">
        <form
          className="w-full h-[89vh] flex flex-col justify-center items-center gap-4"
          onSubmit={logIn}
        >
        {error === "" ? <></> : <p>{error}</p>}
          <Input
            type={"text"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={"Username"}
            className={"border border-gray-300 rounded px-2 py-1"}
          />
          <Input
            type={"password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={"Password"}
            className={"border border-gray-300 rounded px-2 py-1"}
          />
          <p>Don&apos;t have an account? <Link className="underline" href="/signup">Sign up.</Link></p>
          <Button text={"Login"} type={"submit"} />
        </form>
      </div>
    </section>
  );
}

export default Page;
