// TradingViewWidget.jsx
"use client"
import React, { useEffect, useRef, memo } from 'react';
import type { TradingViewConfig } from '~/lib/constants';
import useTradingViewWidget from '~/app/hooks/useTradingViewWidget';
import { cn } from '~/lib/utils';

interface UseTradingViewWidgetProps {
    title: string;
    scriptUrl: string;
    config: TradingViewConfig;
    height: number;
    className?: string;
}
const TradingViewWidget = ({title, scriptUrl, config, height = 600, className}: UseTradingViewWidgetProps) => {
    const {containerRef} = useTradingViewWidget({scriptUrl, config, height, className})
  return (
    <div className='w-full'>
        {title && <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>}
    <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
    </div>
  );
}

export default memo(TradingViewWidget);
