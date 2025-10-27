import React from "react";
import Link from "next/link";
import GradientText from "./gradient-text";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const CallToAction = () => {
  return (
    <div className="flex flex-col items-start md:items-center gap-y-5 md:gap-y-0 mt-15">
      <GradientText
        className="text-[35px] sm:text-[40px] md:text-[45px] lg:text-[55px] xl:text-[70px] 2xl:text-[80px] leading-tight font-semibold"
        element="H1"
      >
        Assistify your business
      </GradientText>
      <div>
        <p className="text-sm md:text-center text-left text-muted-foreground">
          Assistify is the ultimate AI-powered chatbot and voice agent platform
          <br className="md:hidden" />
          designed to boost client engagement,{" "}
          <br className="hidden md:block" />
          streamline workflows, and enhance productivity.{" "}
          <br className="md:hidden" />
          Simplify your processes, automate marketing, and achieve seamless
          communication.
        </p>
      </div>
      <div className="flex md:flex-row flex-col md:justify-center gap-5 md:mt-5 w-full text-themeTextGray">
        <Button
          variant="outline"
          className="rounded-xl bg-themeBlack text-base"
        >
          Explore Features
        </Button>
        <Link href="/sign-up">
           <Button className="rounded-xl text-base flex gap-2 w-full bg-emerald-500 hover:bg-emerald-600">
            <Plus /> Start for Free
          </Button>
        </Link>
      </div>
      <div className="pt-10">
        <GradientText>
          <span className="text-sm md:text-center text-left text-muted-foreground">
            Learn more about assistify Documentation →
          </span>
        </GradientText>
      </div>
    </div>
  );
};

export default CallToAction;