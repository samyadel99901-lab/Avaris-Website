import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { OrganicReach } from "@/components/sections/OrganicReach";
import { Photoshoot } from "@/components/sections/Photoshoot";
import { ServicesOverview } from "@/components/sections/ServicesOverview";
import { Testimonials } from "@/components/sections/Testimonials";
import { TheProof } from "@/components/sections/TheProof";
import { VFX3D } from "@/components/sections/VFX3D";
import { VideoProduction } from "@/components/sections/VideoProduction";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <TheProof />
      <ServicesOverview />
      <VideoProduction />
      <VFX3D />
      <Photoshoot />
      <OrganicReach />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}
