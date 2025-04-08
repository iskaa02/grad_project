"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Github,
  BrainCircuit,
  FilePlus,
  ShieldCheck,
  Zap,
  MessageSquare,
  ArrowDown,
  DatabaseZap,
} from "lucide-react";
import { AuroraBackground } from "@/components/custom/aurora-background"; // <-- Import AuroraBackground (adjust path if needed)
import { Geist } from "next/font/google";
import SpotlightCard from "@/components/custom/spotlight-card";

const giest = Geist({ subsets: ["latin"] });

export default function LandingPage() {
  return (
    <div
      style={giest.style}
      className={"flex flex-col min-h-screen bg-background"}
    >
      <header className="bg-background py-4 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">SecondBrain</h1>
        </div>
      </header>
      <main className="flex-grow">
        <section className="relative flex flex-col items-center justify-center h-[calc(60vh-80px)] min-h-[600px] text-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                backgroundSize: "40px 40px",
                backgroundImage: `linear-gradient(to right, #e4e4e7 1px, transparent 1px),
                                  linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)`,
                // dark mode:
              }}
            />
            {/* Radial gradient for the container to give a faded look */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white dark:bg-black"
              style={{
                maskImage:
                  "radial-gradient(ellipse at center, transparent 20%, black)",
              }}
            ></div>
          </div>
          {/* End Grid Background */}

          <h1 className="relative z-10 text-4xl font-bold tracking-tighter mb-4 animate-fade-in-up">
            Experience AI That Understands{" "}
            <span className="text-orange-500">Your</span> Content.
          </h1>
          <p className="relative z-10 max-w-2xl text-lg sm:text-xl text-muted-foreground mb-8 animate-fade-in-up animation-delay-200">
            Leverage the power of Retrieval-Augmented Generation (RAG) for AI
            responses grounded in your specific data, dramatically reducing
            hallucinations and boosting relevance.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-700 text-white"
            >
              <Link href="/chat">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-orange-500 text-orange-500 hover:bg-orange-100"
            >
              <a href="#learn-more">
                Learn More <ArrowDown className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        <section
          id="learn-more"
          className="py-16 bg-gradient-to-t from-orange-100 via-orange-50 via-30% to-background scroll-mt-20 border-t"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Why Choose Our RAG AI?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BrainCircuit className="h-8 w-8 text-blue-500 mb-4" />}
                title="Fewer AI slip-ups"
                description="AI answers based on your documents, so less inaccurate info."
              />
              <FeatureCard
                icon={<FilePlus className="h-8 w-8 text-blue-500 mb-4" />}
                title="Connect Your Stuff"
                description="AI learns directly from your docs, articles, and more for tailored answers."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-blue-500 mb-4" />}
                title="More Accurate Answers"
                description="Get reliable AI that completes tasks with factually correct info."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-blue-500 mb-4" />}
                title="Quick Knowledge Retrieval"
                description="Get synthesized answers fast, no more endless searching."
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8 text-blue-500 mb-4" />}
                title="Stay on Topic"
                description="Keeps the conversation relevant with context from your documents."
              />
              <FeatureCard
                icon={<DatabaseZap className="h-8 w-8 text-blue-500 mb-4" />}
                title="Grows with Your Content"
                description="Works great even as your knowledge base gets bigger."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section (Keep as is) */}
        <section className="py-16  border-t">
          {/* ... (rest of how it works section) ... */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StepCard
                number="1"
                title="Add Your Content"
                description="Upload your documents, paste text, or connect data sources."
              />
              <StepCard
                number="2"
                title="Ask Your Question"
                description="Interact with the AI in natural language, asking specific questions."
              />
              <StepCard
                number="3"
                title="Get Grounded Answers"
                description="Receive AI-generated responses backed by the relevant information from your content."
              />
            </div>
          </div>
        </section>

        <section className="py-16  bg-muted/40 border-t">
          {/* ... (rest of faq section) ... */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg">
                  What is Retrieval-Augmented Generation (RAG)?
                </AccordionTrigger>
                <AccordionContent className="text-md text-muted-foreground">
                  RAG combines the strengths of large language models (LLMs)
                  with information retrieval. Instead of relying solely on its
                  pre-trained knowledge, the AI first retrieves relevant
                  passages from your provided documents and then uses that
                  information to generate a more accurate and contextually
                  appropriate answer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg">
                  How does this reduce hallucinations?
                </AccordionTrigger>
                <AccordionContent className="text-md text-muted-foreground">
                  LLM hallucinations often occur when the model lacks specific
                  information or tries to "fill in the gaps." By forcing the AI
                  to base its answers on retrieved text from{" "}
                  <strong>your</strong> trusted content, we significantly reduce
                  the likelihood of it generating plausible-sounding but
                  incorrect information. It's grounded in fact.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg">
                  What kind of content can I add?
                </AccordionTrigger>
                <AccordionContent className="text-md text-muted-foreground">
                  You can typically add various text-based formats like PDFs,
                  DOCX files, TXT files, or directly add text content. The goal
                  is to make the AI knowledgeable about <strong>your</strong>{" "}
                  specific domain.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="relative border-t">
          <AuroraBackground className="h-fit py-24">
            <motion.div
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              // Adding padding here, and ensuring text colors work on dynamic background
              className="relative flex flex-col gap-2 items-center justify-center px-4 " // Added vertical padding
            >
              <h2 className="text-4xl  font-bold text-black text-center">
                Ready to Unlock Your Data's Potential?
              </h2>
              <p className="text-base  text-neutral-600 max-w-xl text-center mb-8">
                Stop wrestling with generic AI. Start getting reliable,
                context-aware answers grounded in your own knowledge base today.
              </p>
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-700 text-white"
              >
                <Link href="/chat">Get Started Now</Link>
              </Button>
            </motion.div>
          </AuroraBackground>
        </section>
        {/* --- End Aurora Section --- */}
      </main>

      {/* Footer (Keep as is) */}
      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
            © {new Date().getFullYear()} SecondBrain.
          </p>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="bg-gray-800 rounded-full hover:bg-gray-900"
              size="icon"
              asChild
            >
              <Link
                href="https://github.com/iskaa02/grad_project"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github color="white" />
              </Link>
            </Button>
            {/* Add other social links here if needed */}
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components (FeatureCard, StepCard - Keep as is)
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <SpotlightCard
      className="border-neutral-200 bg-neutral-50"
      spotlightColor="rgba(0, 229, 255, 0.2)"
    >
      <CardHeader className="p-0 mb-4">
        {icon}
        <CardTitle className="text-start text-lg font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </SpotlightCard>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <SpotlightCard
      className="border-none bg-background"
      spotlightColor="rgba(0, 229, 255, 0.2)"
      // className="flex flex-col items-center p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <CardHeader className="p-0 mb-4">
        <div className="flex mx-auto items-center justify-center w-12 h-12 rounded-full bg-orange-500 text-white font-bold text-xl">
          {number}
        </div>
        <CardTitle className="text-xl font-semibold text-center mt-4">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="text-muted-foreground text-center">
          {description}
        </CardDescription>
      </CardContent>
    </SpotlightCard>
  );
}
