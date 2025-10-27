// hooks/navigation.ts
"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export const useNavigation = () => {
    const pathName = usePathname();
    const [section, setSection] = useState<string>("");

    useEffect(() => {
        setSection(pathName);
    }, [pathName]);

    const onSetSection = (page: string) => setSection(page);
  
    return {
      section,
      onSetSection,
    };
};