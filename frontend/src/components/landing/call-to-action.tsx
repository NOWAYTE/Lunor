import React from "react";
import Link from "next/link";
import GradientText from "./gradient-text";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const CallToAction = () => {
  return (
    <div className="flex flex-col items-start md:items-center gap-y-5 md:gap-y-0 mt-5 mb-15">
      <GradientText
        className="text-[35px] sm:text-[40px] md:text-[45px] lg:text-[45px] xl:text-[65px] 2xl:text-[75px] leading-tight font-semibold"
        element="H1"
      >
        Discipline meets Intelligence
      </GradientText>
      <div>
        <p className="text-sm md:text-center text-left text-muted-foreground">
          Lunoru is the AI-powered trading journal built for serious traders —
          <br className="md:hidden" />
          combining smart performance tracking and behavioral insights,
          <br className="hidden md:block" />
          with predictive analytics that sharpen your strategy edge.
          <br className="md:hidden" />
          Log better trades, build discipline, and trade with confidence.
        </p>
      </div>  
      <div className="flex md:flex-row flex-col md:justify-center gap-5 md:mt-5 w-full text-themeTextGray">
        <Button
          variant="outline"
          className="rounded-xl bg-themeBlack text-base"
        >
          Explore Features
        </Button>
        <Link href="/auth/sign-up">
           <Button className="rounded-xl text-base flex gap-2 w-full bg-white hover:bg-gray-200">
            <Plus /> Start for Free
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CallToAction;