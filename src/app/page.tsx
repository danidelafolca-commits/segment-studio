import Hero from "@/components/Hero";
import ParticleAnalyzer from "@/components/ParticleAnalyzer";
import HowItWorks from "@/components/HowItWorks";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ParticleAnalyzer />
        <HowItWorks />
      </main>
      <SiteFooter />
    </>
  );
}
