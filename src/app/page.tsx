import { Navbar } from "@/components/Navbar";
import { MintTokens } from "@/components/MintTokens";
import { TierTable } from "@/components/TierTable";
import Link from "next/link";

export default function Home() {
  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <section className="hero">
          <div className="hero__eyebrow">Uniswap v4 Hook</div>
          <h1 className="hero__title">
            Swap large.<br />
            <span className="hero__accent">Pay less.</span>
          </h1>
          <p className="hero__sub">
            Every swap that moves the market earns you a tier NFT.
            Your next trade gets a fee discount. The NFT burns after redemption.
          </p>
          <Link href="/pool" className="btn btn--ghost hero__cta">
            Go to pool →
          </Link>
        </section>

        <div className="grid">
          <div className="card card--main">
            <div className="card__header">
              <h2 className="card__title">Mint Test Tokens</h2>
              <p className="card__sub">Mint mock token0 or token1 to test out the application</p>
            </div>
            <MintTokens />
          </div>

          <div className="sidebar">
            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Impact tiers</h2>
                <p className="card__sub">Earned by price impact on every swap</p>
              </div>
              <TierTable />
            </div>

            <div className="card card--info">
              <h3 className="card__title card__title--sm">How it works</h3>
              <ol className="how-list">
                <li className="how-list__item">
                  <span className="how-list__num">1</span>
                  <span>Mint test tokens from this page so you have funds</span>
                </li>
                <li className="how-list__item">
                  <span className="how-list__num">2</span>
                  <span>Move to the Pool page to provide liquidity or trade</span>
                </li>
                <li className="how-list__item">
                  <span className="how-list__num">3</span>
                  <span>Swap tokens — the hook measures your impact and gives you an NFT</span>
                </li>
                <li className="how-list__item">
                  <span className="how-list__num">4</span>
                  <span>Your next swap consumes the NFT for a fee discount</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
