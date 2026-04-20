import PageWrapper from "@/components/layout/PageWrapper";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import BenefitsSection from "@/components/landing/BenefitsSection";
import PrivacyBanner from "@/components/landing/PrivacyBanner";
import FinalCTA from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <PageWrapper>
      <HeroSection />
      <HowItWorks />
      <BenefitsSection />
      <PrivacyBanner />
      <FinalCTA />
    </PageWrapper>
  );
}