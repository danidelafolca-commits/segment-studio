import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
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
        <Manifesto />
        <ParticleAnalyzer />
        <HowItWorks />
      </main>
      <SiteFooter />
    </>
  );
}
