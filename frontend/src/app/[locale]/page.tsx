import { HeroSection } from "@/components/home/HeroSection";
import { ServiceCategories } from "@/components/home/ServiceCategories";
import { PopularProducts } from "@/components/home/PopularProducts";
import { BusinessHighlight } from "@/components/home/BusinessHighlight";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { AboutTrust } from "@/components/home/AboutTrust";
import { ProjectCTA } from "@/components/home/ProjectCTA";

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceCategories />
      <PopularProducts />
      <BusinessHighlight />
      <HowItWorks />
      <CustomerReviews />
      <AboutTrust />
      <ProjectCTA />
    </>
  );
}
