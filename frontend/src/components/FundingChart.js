import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

const FundingChart = ({ chartData }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candlestickSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const lastDataRef = useRef({ candlestick: null, volume: null });

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
                timeVisible: true,
                secondsVisible: false,
                borderColor: "#4B5563",
            },
            rightPriceScale: {
                borderColor: "#4B5563",
                mode: 0,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.3,
                },
                autoScale: true,
            },
        });
        chartRef.current = chart;

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: "#10B981",
            downColor: "#EF4444",
            borderVisible: false,
            wickVisible: true,
            priceFormat: {
                type: "price",
                precision: 8,
                minMove: 0.00000001,
            },
        });
        candlestickSeriesRef.current = candlestickSeries;

        const volumeSeries = chart.addHistogramSeries({
            color: "#3B82F6",
            priceScaleId: "volume",
            priceFormat: {
                type: "volume",
                precision: 8,
                minMove: 0.00000001,
            },
        });
        volumeSeriesRef.current = volumeSeries;

        chart.priceScale("volume").applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
            autoScale: true,
        });

        const handleResize = () => {
            chart.resize(chartContainerRef.current.clientWidth, 400);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!chartData?.labels?.length || !candlestickSeriesRef.current) return;
    
        console.log("chartData:", chartData);
    
        const hasNonZeroValue = chartData.datasets[0].data.some(value => parseFloat(value) > 0) ||
                                chartData.datasets[1].data.some(value => parseFloat(value) > 0);
    
        if (!hasNonZeroValue) {
            console.log("데이터가 모두 0이므로 차트를 표시하지 않습니다.");
            candlestickSeriesRef.current.setData([]);
            volumeSeriesRef.current.setData([]);
            return;
        }
    
        const candlestickData = [];
        chartData.labels.forEach((label, index) => {
            const timestamp = new Date(label).getTime();
            const close = parseFloat(chartData.datasets[0].data[index]);
            if (isNaN(timestamp) || isNaN(close) || close < 0) {
                console.warn("유효하지 않은 데이터 (candlestick):", { label, close });
                return;
            }
            const time = Math.floor(timestamp / 1000);
            console.log("FundingChart - Label timestamp (UTC):", new Date(timestamp), "Label:", label);
    
            // 시가는 이전 캔들의 close 또는 첫 캔들의 경우 fetchChartData에서 제공된 값
            const open = index === 0 ? close : parseFloat(chartData.datasets[0].data[index - 1]);
            const high = close; // 고가는 close로 단순화
            const low = close;  // 저가는 close로 단순화
    
            candlestickData.push({ time, open, high, low, close });
        });
    
        const volumeData = chartData.labels
            .map((label, index) => {
                const timestamp = new Date(label).getTime();
                const value = parseFloat(chartData.datasets[1].data[index]);
                if (isNaN(timestamp) || isNaN(value) || value < 0) {
                    console.warn("유효하지 않은 데이터 (volume):", { label, value });
                    return null;
                }
                return {
                    time: Math.floor(timestamp / 1000),
                    value,
                };
            })
            .filter(item => item !== null);
    
        console.log("candlestickData:", candlestickData);
        console.log("volumeData:", volumeData);
    
        candlestickData.sort((a, b) => a.time - b.time);
        volumeData.sort((a, b) => a.time - b.time);
    
        if (candlestickData.length > 0) {
            const lastCandlestick = candlestickData[candlestickData.length - 1];
            const lastVolume = volumeData[volumeData.length - 1];
    
            if (
                lastDataRef.current.candlestick &&
                lastDataRef.current.candlestick.time === lastCandlestick.time
            ) {
                candlestickSeriesRef.current.update(lastCandlestick);
                volumeSeriesRef.current.update(lastVolume);
            } else {
                candlestickSeriesRef.current.setData(candlestickData);
                volumeSeriesRef.current.setData(volumeData);
            }
    
            lastDataRef.current = { candlestick: lastCandlestick, volume: lastVolume };
        }
    
        chartRef.current.timeScale().fitContent();
    }, [chartData]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-blue-400 mb-2">프리세일 모금액 차트</h2>
            <div ref={chartContainerRef} />
            <p className="text-gray-400 text-sm mt-2">
                Powered by <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView</a>
            </p>
        </div>
    );
};

export default FundingChart;