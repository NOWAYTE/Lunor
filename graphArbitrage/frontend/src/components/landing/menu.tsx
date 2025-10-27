"use client";
import React from "react";
import { Card, CardContent } from "../ui/card";
import { LUNORU_CONSTANTS } from "~/lib/constants";
import Link from "next/link";
import { useNavigation } from "~/app/hooks/navigation";
import { cn } from "~/lib/utils";

type MenuProps = {
  orientation: "mobile" | "desktop";
};

const Menu = ({ orientation }: MenuProps) => {
  const { section, onSetSection } = useNavigation();
  switch (orientation) {
    case "desktop":
      return (
        <Card className="bg-themeBlack border-[#032E11] bg-clip-padding backdrop--blur__safari backdrop-filter backdrop-blur-2xl bg-opacity-60 p-1 lg:flex hidden rounded-xl text-themeTextWhite">
          <CardContent className="p-0 flex gap-2">
            {LUNORU_CONSTANTS.landingPageMenu.map((menuItem) => {
              const Icon = menuItem.icon;
              return (
              <Link
                href={menuItem.path}
                onClick={(e) => {
                  if (menuItem.section) {
                    e.preventDefault();
                    onSetSection(menuItem.path);
                  }
                }}
                className={cn(
                  "rounded-xl flex gap-2 py-2 px-4 items-center",
                  section == menuItem.path
                    ? "border-[#27272A]"
                    : ""
                )}
                key={menuItem.id}
              >
                <Icon />
                {menuItem.label}
              </Link>
          )})}
          </CardContent>
        </Card>
      );

    case "mobile":
      return (
        <div className="flex flex-col mt-10">
          { LUNORU_CONSTANTS.landingPageMenu.map((menuItem) => {
            const Icon = menuItem.icon;
            return (
            <Link
              href={menuItem.path}
              {...(menuItem.section && {
                onClick: () => onSetSection(menuItem.path),
              })}
              className={cn(
                "rounded-xl flex gap-2 py-2 px-4 items-center",
                section == menuItem.path ? "bg-themeGray border-[#27272A]" : ""
              )}
              key={menuItem.id}
            >
              <Icon />
              {menuItem.label}
            </Link>
          )})}
        </div>
      );
    default:
      return <></>;
  }
};

export default Menu;