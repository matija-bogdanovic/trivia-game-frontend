"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeJwt, getCookie } from "@/app/helpers/token_operations";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function Header() {
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const rawToken = getCookie("token");
    if (rawToken) {
      setDecodedToken(decodeJwt(rawToken));
      return;
    } else {
      if (pathname === "/login" || pathname === "/signup") {
        return;
      } else {
        router.push("/login");
      }
    }
  }, [router, pathname]);

  return (
    <header className="section fixed top-0 left-0 right-0">
      <div className="container flex flex-row justify-between items-center py-8 ">
        <Link href="/">
          <Image src="/rrl.png" width={40} height={40} alt="rrl" />
        </Link>
        {decodedToken && decodedToken.username ? (
          <div className="flex flex-row gap-4">
            <Link href="/profile">Profile</Link>
            <Link href="/playgame">Play game</Link>
            <Link href="/joingame">Join Game</Link>
          </div>
        ) : (
          <div className="flex flex-row gap-4">
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
