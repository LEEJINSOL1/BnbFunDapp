// src/components/FundingChart.js
import React, { useEffect, useRef, useMemo } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

const FundingChart = ({ chartData, selectedToken }) => {
  const chartContainerRef    = useRef(null);
  const chartRef             = useRef(null);
  const candleSeriesRef      = useRef(null);
  const volumeSeriesRef      = useRef(null);
  const lastCandleTimeRef    = useRef(null);

  // 제목에 표시할 토큰 심볼(없으면 BNB)
  const tokenLabel = useMemo(() => {
    if (!selectedToken) return "BNB";
    return typeof selectedToken === "object"
      ? selectedToken.symbol
      : selectedToken;
  }, [selectedToken]);

  // 차트 초기화 (1분봉 고정)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#1F2937" },
        textColor: "#D1D5DB",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#6B7280",
          labelBackgroundColor: "#4B5563",
        },
        horzLine: {
          color: "#6B7280",
          labelBackgroundColor: "#4B5563",
        },
      },
      timeScale: {
        timeVisible:    true,
        secondsVisible: false,
        borderColor:    "#4B5563",
        fixLeftEdge:    true,
        tickMarkFormatter: (t) =>
          new Date(t * 1000).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          }),
      },
      rightPriceScale: {
        borderColor: "#4B5563",
        mode:        0,
        scaleMargins:{ top: 0.1, bottom: 0.3 },
        autoScale:   true,
      },
    });

    // 가격 캔들 시리즈
    const candleSeries = chart.addCandlestickSeries({
      upColor:       "#10B981",
      downColor:     "#EF4444",
      borderVisible: false,
      wickVisible:   true,
      priceFormat: {
        type:      "price",
        precision: 8,
        minMove:   0.00000001,
      },
      title: `총 모금액 (${tokenLabel})`,
    });

    // 거래량 히스토그램 시리즈
    const volumeSeries = chart.addHistogramSeries({
      color:        "#3B82F6",
      priceScaleId: "volume",
      priceFormat:  {
        type:      "volume",
        precision: 8,
        minMove:   0.00000001,
      },
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      autoScale:    true,
    });

    chartRef.current        = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () =>
      chart.resize(chartContainerRef.current.clientWidth, 400);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [tokenLabel]);

  // 데이터 바인딩 및 업데이트
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries || !Array.isArray(chartData)) return;
    if (chartData.length === 0) {
      candleSeries.setData([]);
      volumeSeries.setData([]);
      lastCandleTimeRef.current = null;
      return;
    }

    const candles = [];
    const vols    = [];
    // 최신 1000개만 사용
    chartData.slice(-1000).forEach((c) => {
      const t = parseInt(c.time, 10);
      candles.push({
        time:  t,
        open:  parseFloat(c.open),
        high:  parseFloat(c.high),
        low:   parseFloat(c.low),
        close: parseFloat(c.close),
      });
      vols.push({ time: t, value: parseFloat(c.volume) });
    });
    candles.sort((a, b) => a.time - b.time);
    vols.sort((a, b) => a.time - b.time);

    const last    = candles[candles.length - 1];
    const lastVol = vols[vols.length - 1];
    if (last && last.time === lastCandleTimeRef.current) {
      candleSeries.update(last);
      volumeSeries.update(lastVol);
    } else {
      candleSeries.setData(candles);
      volumeSeries.setData(vols);
      lastCandleTimeRef.current = last.time;
    }
    chartRef.current.timeScale().fitContent();
  }, [chartData]);

   return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      {/* 좌측 상단: 토큰 아이콘 + 제목 */}
      <div className="flex items-center mb-2">
        {selectedToken?.image_url && (
          <img
            src={selectedToken.image_url}
            alt={tokenLabel}
            className="w-6 h-6 rounded-full mr-2 object-cover"
          />
        )}
        <h2 className="text-xl font-bold text-blue-400">
          총 모금액 차트 ({tokenLabel})
        </h2>
      </div>
      {/* 차트 렌더링 영역 */}
      <div ref={chartContainerRef} style={{ height: 400 }} />
      <p className="text-gray-400 text-sm mt-2">
        Powered by{" "}
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">
          TradingView
        </a>
      </p>
    </div>
  );
};

export default FundingChart;
