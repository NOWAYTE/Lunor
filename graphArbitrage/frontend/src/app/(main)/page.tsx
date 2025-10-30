import TradingViewWidget from "~/components/trading/tradingViewWidgets"
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
  ADVANCED_CHART_WIDGET_CONFIG,
} from "~/lib/constants"
import CallToAction from "~/components/landing/call-to-action"
import LandingPageNavbar from "~/components/landing/navbar"

export default async function Page() {
 
  const scriptUrl =
    "https://s3.tradingview.com/external-embedding/embed-widget-"

  const cardClass = "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" 

  return (
    <div className="flex min-h-screen flex-col gap-10 pb-8">
      <section className="container mt-8">
        <LandingPageNavbar />
        <CallToAction />
         <TradingViewWidget
          scriptUrl={`${scriptUrl}advanced-chart.js`}
          config={ADVANCED_CHART_WIDGET_CONFIG("OANDA:EURUSD")}
          className={cardClass}
          height={800}
        />
      </section>
      <section className="container grid grid-cols-1 gap-8 xl:grid-cols-3">
        <TradingViewWidget
          title="Market Overview"
          scriptUrl={`${scriptUrl}market-overview.js`}
          config={MARKET_OVERVIEW_WIDGET_CONFIG}
          className={cardClass}
          height={600}
        />
        <div className="xl:col-span-2">
          <TradingViewWidget
            title="Stock Heatmap"
            scriptUrl={`${scriptUrl}stock-heatmap.js`}
            config={HEATMAP_WIDGET_CONFIG}
            className={cardClass}
            height={600}
          />
        </div>
      </section>

      <section className="container grid grid-cols-1 gap-8 xl:grid-cols-3">
        <TradingViewWidget
          scriptUrl={`${scriptUrl}timeline.js`}
          config={TOP_STORIES_WIDGET_CONFIG}
          className={cardClass}
          height={600}
        />
        <div className="xl:col-span-2">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}market-quotes.js`}
            config={MARKET_DATA_WIDGET_CONFIG}
            className={cardClass}
            height={600}
          />
        </div>
      </section>
    </div>
  )
}
