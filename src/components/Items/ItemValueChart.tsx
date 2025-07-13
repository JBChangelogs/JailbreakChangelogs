import { useEffect, useState, useRef } from 'react';
import { PUBLIC_API_URL } from "@/utils/api";
import { Button, ButtonGroup, Skeleton } from '@mui/material';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TooltipItem,
  ChartData,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface ValueHistory {
  id: string;
  name: string;
  type: string;
  date: string;
  cash_value: string;
  duped_value: string;
}

interface ItemValueChartProps {
  itemId: string;
  variantId?: number;
}

const ItemValueChart = ({ itemId, variantId }: ItemValueChartProps) => {
  const [history, setHistory] = useState<ValueHistory[]>([]);
  const [dateRange, setDateRange] = useState<'1w' | '1m' | '6m' | '1y' | 'all'>('1m');
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const historyId = variantId ? `${itemId}-${variantId}` : itemId;
        const response = await fetch(`${PUBLIC_API_URL}/item/history?id=${historyId}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching item history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [itemId, variantId]);

  useEffect(() => {
    // Dynamically import and register zoom plugin on client side
    const loadZoomPlugin = async () => {
      const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
      ChartJS.register(zoomPlugin);
    };
    loadZoomPlugin();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="30%" height={24} sx={{ bgcolor: '#37424D' }} />
          <div className="flex gap-2">
            {['1w', '1m', '6m', '1y', 'all'].map((range) => (
              <Skeleton key={range} variant="rounded" width={60} height={32} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
        </div>
        <div className="relative">
          <Skeleton variant="rectangular" height={400} sx={{ bgcolor: '#37424D', borderRadius: '8px' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#5865F2', margin: '0 auto 8px' }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#37424D' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center border border-[#37424D] shadow-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-[#5865F2]/20 to-[#4752C4]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#5865F2]/30">
          <svg className="w-8 h-8 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Value History Available</h3>
        <p className="text-[#D3D9D4] text-sm mb-6 max-w-md mx-auto leading-relaxed">
          This item doesn&apos;t have any recorded value changes yet. Value history will appear here once the item&apos;s value is updated.
        </p>
        <div className="bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 border border-[#5865F2]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#5865F2] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-white font-medium mb-1">Want to help?</h4>
              <p className="text-[#D3D9D4] text-sm leading-relaxed">
                If you think this item&apos;s value should be updated, you can suggest a new value through{' '}
                <a 
                  href="https://discord.com/invite/baHCsb8N5A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5865F2] hover:underline font-medium transition-colors"
                >
                  Trading Core
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert string values to numbers (removing 'm' suffix and converting to millions)
  const processValue = (value: string) => {
    if (!value || value === 'N/A') return 0;
    
    const numericPart = value.toLowerCase().replace(/[km]$/, '');
    const suffix = value.toLowerCase().slice(-1);
    const numericValue = parseFloat(numericPart);
    
    if (isNaN(numericValue)) return 0;
    
    switch (suffix) {
      case 'k':
        return numericValue * 1000;
      case 'm':
        return numericValue * 1000000;
      default:
        return numericValue;
    }
  };

  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  // Sort history by date
  const sortedHistory = [...history].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  // Get the oldest date in the history
  const oldestDate = new Date(parseInt(sortedHistory[0].date) * 1000);
  const now = new Date();

  // Calculate available ranges
  const ranges = {
    '1w': new Date(now.setDate(now.getDate() - 7)),
    '1m': new Date(now.setMonth(now.getMonth() - 1)),
    '6m': new Date(now.setMonth(now.getMonth() - 6)),
    '1y': new Date(now.setFullYear(now.getFullYear() - 1)),
    'all': new Date(0),
  };

  // Check if each range has data
  const hasDataForRange = (range: keyof typeof ranges) => {
    if (range === 'all') return true;
    return oldestDate <= ranges[range];
  };

  // Handle date range change
  const handleDateRangeChange = (range: '1w' | '1m' | '6m' | '1y' | 'all') => {
    if (!hasDataForRange(range)) {
      toast.error('No data available for this time range');
      return;
    }
    setDateRange(range);
  };

  // Filter data based on date range
  const getFilteredData = () => {
    return sortedHistory.filter(item => 
      new Date(parseInt(item.date) * 1000) >= ranges[dateRange]
    );
  };

  const filteredData = getFilteredData();

  const chartData: ChartData<'line'> = {
    labels: filteredData.map(item => new Date(parseInt(item.date) * 1000)),
    datasets: [
      {
        label: 'Cash Value',
        data: filteredData.map(item => processValue(item.cash_value)),
        borderColor: '#5865F2',
        backgroundColor: 'rgba(88, 101, 242, 0.2)',
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#5865F2',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Duped Value',
        data: filteredData.map(item => processValue(item.duped_value)),
        borderColor: '#ED4245',
        backgroundColor: 'rgba(237, 66, 69, 0.2)',
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#ED4245',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#D3D9D4',
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        limits: {
          x: {min: 'original', max: 'original', minRange: 3600 * 1000 * 24} // Minimum 1 day range
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#2e3944',
        titleColor: '#FFFFFF',
        bodyColor: '#D3D9D4',
        borderColor: '#37424D',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: function(context: TooltipItem<'line'>[]) {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          },
          label: function(context: TooltipItem<'line'>) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM dd'
          }
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#FFFFFF',
          display: false,
        },
      },
      y: {
        grid: {
          color: '#37424D',
        },
        ticks: {
          color: '#FFFFFF',
          callback: function(tickValue: number | string) {
            return formatValue(Number(tickValue));
          }
        },
      },
    },
  };

  return (
    <div className="rounded-lg bg-[#212A31] p-2 mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm text-[#FFFFFF]">Value History</h3>
        <ButtonGroup size="small" variant="outlined">
          <Button 
            onClick={() => handleDateRangeChange('1w')}
            sx={{ 
              color: dateRange === '1w' ? '#5865F2' : '#FFFFFF',
              borderColor: '#37424D',
              '&:hover': { borderColor: '#5865F2' },
              opacity: hasDataForRange('1w') ? 1 : 0.5,
            }}
          >
            1W
          </Button>
          <Button 
            onClick={() => handleDateRangeChange('1m')}
            sx={{ 
              color: dateRange === '1m' ? '#5865F2' : '#FFFFFF',
              borderColor: '#37424D',
              '&:hover': { borderColor: '#5865F2' },
              opacity: hasDataForRange('1m') ? 1 : 0.5,
            }}
          >
            1M
          </Button>
          <Button 
            onClick={() => handleDateRangeChange('6m')}
            sx={{ 
              color: dateRange === '6m' ? '#5865F2' : '#FFFFFF',
              borderColor: '#37424D',
              '&:hover': { borderColor: '#5865F2' },
              opacity: hasDataForRange('6m') ? 1 : 0.5,
            }}
          >
            6M
          </Button>
          <Button 
            onClick={() => handleDateRangeChange('1y')}
            sx={{ 
              color: dateRange === '1y' ? '#5865F2' : '#FFFFFF',
              borderColor: '#37424D',
              '&:hover': { borderColor: '#5865F2' },
              opacity: hasDataForRange('1y') ? 1 : 0.5,
            }}
          >
            1Y
          </Button>
          <Button 
            onClick={() => handleDateRangeChange('all')}
            sx={{ 
              color: dateRange === 'all' ? '#5865F2' : '#FFFFFF',
              borderColor: '#37424D',
              '&:hover': { borderColor: '#5865F2' },
              opacity: hasDataForRange('all') ? 1 : 0.5,
            }}
          >
            All
          </Button>
        </ButtonGroup>
      </div>
      <div className="h-[350px]">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          onClick={() => chartRef.current?.resetZoom()}
          size="small"
          variant="outlined"
          sx={{
            color: '#5865F2',
            borderColor: '#37424D',
            backgroundColor: 'rgba(88, 101, 242, 0.08)',
            borderRadius: '6px',
            fontWeight: 600,
            boxShadow: '0 1px 4px 0 rgba(88,101,242,0.04)',
            '&:hover': {
              borderColor: '#5865F2',
              backgroundColor: 'rgba(88, 101, 242, 0.16)',
            },
          }}
        >
          Reset Zoom
        </Button>
      </div>
    </div>
  );
};

export default ItemValueChart; 