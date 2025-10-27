"use client"
import { useEffect, useRef } from "react"
import type { TradingViewConfig } from "~/lib/constants";

const useTradingViewWidget = ({scriptUrl , config, height = 600, className}: {scriptUrl: string , config: TradingViewConfig, height?: number, className?: string}) => {

    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!containerRef.current) return;
        if (containerRef.current.dataset.loaded === "true") return;
        containerRef.current.innerHTML = `<div class='tradingview-widget-container_widget style='width: 100%; height: ${height}px;${className}'></div>`

        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.innerHTML = JSON.stringify(config)
        containerRef.current.appendChild(script)
        containerRef.current.dataset.loaded = "true"

        return () => {
            if(containerRef.current) {
                containerRef.current.innerHTML = ''
                delete containerRef.current.dataset.loaded;
            }
        }
        
    }, [scriptUrl, config, height, className])

    return {
       containerRef
    }   
}

export default useTradingViewWidget