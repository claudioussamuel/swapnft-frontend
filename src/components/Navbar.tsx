"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NFTBadge } from "./NFTBadge";
import { useAccount } from "wagmi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { isConnected } = useAccount();
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <div className="navbar__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon points="14,1 17.8,9.3 27,10.6 20.5,16.9 22.1,26 14,21.8 5.9,26 7.5,16.9 1,10.6 10.2,9.3" fill="var(--accent)" opacity="0.9"/>
            </svg>
          </div>
          <span className="navbar__title">SwapImpact</span>
        </div>

        <nav className="navbar__nav">
          <Link href="/"     className={`navbar__nav-link ${pathname === "/"      ? "navbar__nav-link--active" : ""}`}>Create pool</Link>
          <Link href="/pool" className={`navbar__nav-link ${pathname === "/pool"  ? "navbar__nav-link--active" : ""}`}>Pool</Link>
        </nav>

        <div className="navbar__right">
          {isConnected && <NFTBadge />}
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </div>
    </header>
  );
}
