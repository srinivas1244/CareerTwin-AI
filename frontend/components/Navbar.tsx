"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard } from "lucide-react";
import { useSession } from "@/lib/useSession";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const { session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        scrolled
          ? "border-b border-white/8 bg-background/85 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.03)]"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link
          href={session ? "/dashboard" : "/"}
          className="group flex items-center gap-2.5"
        >
          <motion.span
            className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 shadow-md shadow-brand/25"
            whileHover={{ scale: 1.1, rotate: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 14 }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </motion.span>
          <span className="font-semibold tracking-tight transition-colors duration-200 group-hover:text-foreground">
            CareerTwin AI
          </span>
        </Link>

        {/* Nav items */}
        {session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                pathname === "/dashboard"
                  ? "border border-brand/20 bg-brand/12 text-foreground"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <ThemeToggle />
            <ProfileMenu />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="btn-glow">
                Get started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
}
