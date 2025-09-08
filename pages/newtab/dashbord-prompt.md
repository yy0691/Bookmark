```index.tsx
import './index.css'
import React from "react";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.getElementById("root"));

```
```App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Dashboard } from './pages/Dashboard'
import { Analysis } from './pages/Analysis'
export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container pt-6 pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

```
```AppRouter.tsx
import React from "react";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import { App } from "./App";

  export function AppRouter() {
    return (
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
          </Routes>
      </BrowserRouter>
    );
  }
```
```tailwind.config.js
module.exports = {
  darkMode: "selector",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
}
```
```index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 100% 50%;
    --destructive-foreground: 210 40% 98%;

    --ring: 215 20.2% 65.1%;

    --radius: 0.5rem;
  }

  :root[class~="dark"] {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;

    --muted: 223 47% 11%;
    --muted-foreground: 215.4 16.3% 56.9%;

    --accent: 216 34% 17%;
    --accent-foreground: 210 40% 98%;

    --popover: 224 71% 4%;
    --popover-foreground: 215 20.2% 65.1%;

    --border: 216 34% 17%;
    --input: 216 34% 17%;

    --card: 224 71% 4%;
    --card-foreground: 213 31% 91%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 1.2%;

    --secondary: 222.2 47.4% 11.2%;
    --secondary-foreground: 210 40% 98%;

    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;

    --ring: 216 34% 17%;

    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```
```components/layout/Navbar.tsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { RefreshCw, Download, Save } from 'lucide-react'
export function Navbar() {
  const location = useLocation()
  return (
    <nav className="border-b bg-background">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">书签分析与管理</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${location.pathname === '/' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}
            >
              数据概览
            </Link>
            <Link
              to="/analysis"
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${location.pathname === '/analysis' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}
            >
              智能分析中心
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-secondary"
            title="刷新数据"
          >
            <RefreshCw size={16} />
            <span>刷新</span>
          </button>
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-secondary"
              title="导出/备份"
            >
              <Download size={16} />
              <span>导出/备份</span>
            </button>
            <div className="absolute right-0 z-10 invisible w-48 p-1 mt-1 bg-popover border rounded-md shadow-md group-hover:visible">
              <button className="flex items-center w-full gap-2 px-3 py-2 text-sm font-medium text-left transition-colors rounded-md hover:bg-accent">
                <Download size={16} />
                导出为HTML
              </button>
              <button className="flex items-center w-full gap-2 px-3 py-2 text-sm font-medium text-left transition-colors rounded-md hover:bg-accent">
                <Save size={16} />
                创建应用备份
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

```
```utils/mockData.ts
// Generate mock data for the bookmark dashboard
// Generate dates for the past year
export const generateDates = (days = 365) => {
  const dates = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates.reverse()
}
// Generate activity data (bookmarks added per day)
export const generateActivityData = () => {
  const dates = generateDates()
  return dates.map((date) => ({
    date,
    count: Math.floor(Math.random() * 5), // 0-4 bookmarks per day
  }))
}
// Generate category data
export const generateCategoryData = () => {
  const categories = [
    '工作',
    '学习',
    '娱乐',
    '新闻',
    '社交媒体',
    '开发',
    '设计',
    '购物',
    '金融',
    '健康',
    '旅游',
    '美食',
    '技术博客',
  ]
  return categories
    .map((name) => ({
      name,
      count: 5 + Math.floor(Math.random() * 45), // 5-49 bookmarks per category
    }))
    .sort((a, b) => b.count - a.count)
}
// Generate word cloud data
export const generateWordCloudData = () => {
  const words = [
    'React',
    '前端',
    '设计',
    'JavaScript',
    'CSS',
    '教程',
    '博客',
    '工具',
    '框架',
    '开源',
    '学习',
    '文档',
    '示例',
    '参考',
    'GitHub',
    '项目',
    '代码',
    '算法',
    '数据',
    '分析',
    '可视化',
    '资源',
    '视频',
    '课程',
    '书籍',
    '新闻',
    '趋势',
    '技术',
    '创新',
  ]
  return words.map((text) => ({
    text,
    value: 10 + Math.floor(Math.random() * 90), // 10-99 frequency
  }))
}
// Generate metrics data
export const generateMetricsData = () => {
  return {
    totalBookmarks: 1287,
    duplicateBookmarks: 42,
    deadLinks: 23,
    emptyFolders: 7,
  }
}
// Generate analysis results for duplicates
export const generateDuplicateResults = () => {
  const results = []
  const urls = [
    'https://react.dev/learn',
    'https://tailwindcss.com/docs',
    'https://github.com/facebook/react',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ]
  for (let i = 0; i < urls.length; i++) {
    const count = 2 + Math.floor(Math.random() * 3) // 2-4 duplicates
    for (let j = 0; j < count; j++) {
      results.push({
        id: `${i}-${j}`,
        title: `书签 ${i + 1} - 副本 ${j > 0 ? j : ''}`,
        url: urls[i],
        folder: ['收藏夹', '工作', '学习', '个人'][
          Math.floor(Math.random() * 4)
        ],
      })
    }
  }
  return results
}
// Generate analysis results for dead links
export const generateDeadLinkResults = () => {
  return Array(23)
    .fill(0)
    .map((_, i) => ({
      id: `dead-${i}`,
      title: `失效链接 ${i + 1}`,
      url: `https://example.com/dead-link-${i + 1}`,
      folder: ['收藏夹', '工作', '学习', '个人'][Math.floor(Math.random() * 4)],
      lastChecked: new Date().toISOString(),
    }))
}
// Generate analysis results for empty folders
export const generateEmptyFolderResults = () => {
  return Array(7)
    .fill(0)
    .map((_, i) => ({
      id: `folder-${i}`,
      name: `空文件夹 ${i + 1}`,
      path: `收藏夹/${['工作', '学习', '个人'][Math.floor(Math.random() * 3)]}/空文件夹 ${i + 1}`,
      createdAt: new Date().toISOString(),
    }))
}
// Generate analysis results for smart categorization
export const generateSmartCategorizationResults = () => {
  const categories = [
    '工作',
    '学习',
    '娱乐',
    '新闻',
    '社交媒体',
    '开发',
    '设计',
  ]
  return Array(30)
    .fill(0)
    .map((_, i) => ({
      id: `uncategorized-${i}`,
      title: `未分类书签 ${i + 1}`,
      url: `https://example.com/page-${i + 1}`,
      suggestedCategory:
        categories[Math.floor(Math.random() * categories.length)],
      confidence: 0.5 + Math.random() * 0.5, // 0.5-1.0 confidence
    }))
}

```
```components/dashboard/KeyMetrics.tsx
import React, { cloneElement } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  Copy,
  AlertCircle,
  Folder,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
interface MetricCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  link: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}
const MetricCard = ({
  title,
  value,
  icon,
  color,
  link,
  trend = 'neutral',
  trendValue = '0%',
}: MetricCardProps) => {
  // Get trend icon and color
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <TrendingUp size={14} className="text-green-500" />
    } else if (trend === 'down') {
      return <TrendingDown size={14} className="text-red-500" />
    }
    return null
  }
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500'
    if (trend === 'down') return 'text-red-500'
    return 'text-muted-foreground'
  }
  return (
    <Link
      to={link}
      className="flex flex-col p-6 transition-all duration-300 bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm hover:shadow-md hover:translate-y-[-2px]"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl ${color} bg-opacity-15`}>
          {cloneElement(icon as React.ReactElement, {
            className: color.replace('bg-', 'text-').replace('-500', '-600'),
            size: 22,
          })}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-bold tracking-tight">
            {value.toLocaleString()}
          </span>
          {trend !== 'neutral' && (
            <div
              className={`flex items-center gap-1 text-xs ${getTrendColor()}`}
            >
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
      <h3 className="mt-3 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
    </Link>
  )
}
interface KeyMetricsProps {
  metrics: {
    totalBookmarks: number
    duplicateBookmarks: number
    deadLinks: number
    emptyFolders: number
  }
}
export function KeyMetrics({ metrics }: KeyMetricsProps) {
  // Mock trend data for visual enhancement
  const trends = {
    total: {
      type: 'up' as const,
      value: '2.5%',
    },
    duplicates: {
      type: 'up' as const,
      value: '0.8%',
    },
    deadLinks: {
      type: 'down' as const,
      value: '1.2%',
    },
    emptyFolders: {
      type: 'neutral' as const,
      value: '0%',
    },
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="书签总数"
        value={metrics.totalBookmarks}
        icon={<Bookmark />}
        color="bg-blue-500"
        link="/analysis"
        trend={trends.total.type}
        trendValue={trends.total.value}
      />
      <MetricCard
        title="重复书签"
        value={metrics.duplicateBookmarks}
        icon={<Copy />}
        color="bg-amber-500"
        link="/analysis?tab=duplicates"
        trend={trends.duplicates.type}
        trendValue={trends.duplicates.value}
      />
      <MetricCard
        title="失效链接"
        value={metrics.deadLinks}
        icon={<AlertCircle />}
        color="bg-red-500"
        link="/analysis?tab=deadlinks"
        trend={trends.deadLinks.type}
        trendValue={trends.deadLinks.value}
      />
      <MetricCard
        title="空文件夹"
        value={metrics.emptyFolders}
        icon={<Folder />}
        color="bg-green-500"
        link="/analysis?tab=emptyfolders"
        trend={trends.emptyFolders.type}
        trendValue={trends.emptyFolders.value}
      />
    </div>
  )
}

```
```components/dashboard/WordCloud.tsx
import React from 'react'
interface WordCloudProps {
  words: {
    text: string
    value: number
  }[]
}
export function WordCloud({ words }: WordCloudProps) {
  // Simple word cloud implementation
  const maxValue = Math.max(...words.map((w) => w.value))
  const minValue = Math.min(...words.map((w) => w.value))
  const range = maxValue - minValue
  // Sort words by value (descending)
  const sortedWords = [...words].sort((a, b) => b.value - a.value)
  // Calculate font size based on value
  const calculateFontSize = (value: number) => {
    const minSize = 12
    const maxSize = 36
    const normalized = (value - minValue) / range
    return minSize + normalized * (maxSize - minSize)
  }
  // Calculate color based on value
  const calculateColor = (value: number) => {
    const normalized = (value - minValue) / range
    // Use a more vibrant color palette
    const colors = [
      'rgb(59, 130, 246)',
      'rgb(99, 102, 241)',
      'rgb(139, 92, 246)',
      'rgb(168, 85, 247)',
      'rgb(217, 70, 239)', // fuchsia-500
    ]
    const colorIndex = Math.min(
      Math.floor(normalized * colors.length),
      colors.length - 1,
    )
    return colors[colorIndex]
  }
  // Calculate rotation for more natural appearance
  const calculateRotation = (index: number) => {
    const rotations = [0, 0, 0, -15, 15, -30, 30]
    return rotations[index % rotations.length]
  }
  return (
    <div className="p-6 bg-card rounded-lg shadow-md border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">书签主题词云</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {words.length} 个主题
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 p-6 min-h-[240px] bg-gradient-to-br from-background to-background/50 rounded-lg">
        {sortedWords.map((word, index) => (
          <span
            key={index}
            className="inline-block cursor-pointer transition-all duration-300 hover:scale-110 hover:drop-shadow-md"
            style={{
              fontSize: `${calculateFontSize(word.value)}px`,
              color: calculateColor(word.value),
              padding: '0.25rem',
              fontWeight: word.value > (minValue + maxValue) / 2 ? 600 : 400,
              transform: `rotate(${calculateRotation(index)}deg)`,
            }}
            title={`${word.text}: ${word.value} 个书签`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  )
}

```
```components/dashboard/CategoryChart.tsx
import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
interface CategoryChartProps {
  data: {
    name: string
    count: number
  }[]
}
export function CategoryChart({ data }: CategoryChartProps) {
  // Use only top 10 categories
  const topCategories = data.slice(0, 10)
  // Custom tooltip style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 border rounded-lg shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {`${payload[0].value} 个书签`}
          </p>
        </div>
      )
    }
    return null
  }
  // Custom label for bars
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props
    const radius = 10
    return (
      <g>
        <text
          x={x + width - 5}
          y={y + height / 2}
          fill="#fff"
          textAnchor="end"
          dominantBaseline="middle"
          className="font-medium text-xs"
        >
          {value}
        </text>
      </g>
    )
  }
  return (
    <div className="p-6 bg-card rounded-lg shadow-md border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">分类统计图</h2>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"></span>
          <span className="text-xs text-muted-foreground">按书签数量排序</span>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={topCategories}
            margin={{
              top: 5,
              right: 40,
              left: 60,
              bottom: 5,
            }}
            barSize={24}
            className="[&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted"
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{
                fontSize: 12,
                fill: '#888',
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              axisLine={false}
              tickLine={false}
              style={{
                fontSize: '12px',
                fill: '#666',
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: 'rgba(0, 0, 0, 0.05)',
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              animationDuration={1200}
              animationEasing="ease-in-out"
            >
              <LabelList dataKey="count" content={renderCustomizedLabel} />
              {topCategories.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#colorGradient${index})`}
                  stroke="none"
                />
              ))}
            </Bar>
            <defs>
              {topCategories.map((entry, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`colorGradient${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stopColor={`hsl(${210 + index * 15}, 80%, 60%)`}
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor={`hsl(${240 + index * 15}, 80%, 65%)`}
                    stopOpacity={0.9}
                  />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

```
```components/dashboard/ActivityHeatmap.tsx
import React from 'react'
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RectangleProps,
} from 'recharts'
interface ActivityData {
  date: string
  count: number
}
interface ActivityHeatmapProps {
  data: ActivityData[]
}
const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]
export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Process data into a format suitable for the heatmap
  const processData = () => {
    const cells: {
      x: number
      y: number
      date: string
      count: number
    }[] = []
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - 364) // ~1 year ago
    // Create a map for quick lookup
    const countMap = new Map(data.map((item) => [item.date, item.count]))
    // Generate a grid of dates
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay() // 0-6, where 0 is Sunday
      // Calculate week offset (x position)
      const weekOffset = Math.floor(
        (d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
      cells.push({
        x: weekOffset,
        y: dayOfWeek,
        date: dateStr,
        count: countMap.get(dateStr) || 0,
      })
    }
    return cells
  }
  const cells = processData()
  // Calculate color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'rgb(240, 240, 240)'
    // Different intensity of green based on count
    const intensity = Math.min(0.2 + count * 0.2, 1) // 0.2-1.0
    return `rgba(35, 134, 54, ${intensity})`
  }
  // Calculate month positions for labels
  const getMonthLabels = () => {
    const labels: {
      month: string
      x: number
    }[] = []
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - 364) // ~1 year ago
    let currentMonth = startDate.getMonth()
    let currentDate = new Date(startDate)
    while (currentDate <= today) {
      const month = currentDate.getMonth()
      if (month !== currentMonth) {
        currentMonth = month
        const daysSinceStart = Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
        )
        const x = Math.floor(daysSinceStart / 7)
        labels.push({
          month: MONTHS[month],
          x,
        })
      }
      currentDate.setDate(currentDate.getDate() + 7)
    }
    return labels
  }
  const monthLabels = getMonthLabels()
  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <h2 className="mb-4 text-lg font-medium">收藏活跃度热力图</h2>
      <div className="h-[160px]">
        <div className="relative w-full h-full">
          {/* Month labels */}
          <div
            className="absolute top-0 left-0 w-full flex text-xs text-muted-foreground"
            style={{
              height: '20px',
            }}
          >
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${label.x * 16 + 20}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>
          {/* Day labels */}
          <div className="absolute top-20 left-0 flex flex-col justify-between h-[112px] text-xs text-muted-foreground">
            {DAYS.map((day, i) => (
              <div key={i} className="h-4 flex items-center">
                {day}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="absolute top-20 left-20">
            {cells.map((cell, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-blue-400"
                style={{
                  left: `${cell.x * 16}px`,
                  top: `${cell.y * 16}px`,
                  backgroundColor: getColor(cell.count),
                }}
                title={`${cell.date}: ${cell.count} 个书签`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="absolute bottom-0 right-0 flex items-center gap-1 text-xs text-muted-foreground">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((count) => (
              <div
                key={count}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: getColor(count),
                }}
              />
            ))}
            <span>多</span>
          </div>
        </div>
      </div>
    </div>
  )
}

```
```components/analysis/TaskTabs.tsx
import React from 'react'
import { PieChart, AlertCircle, Folder, LayoutGrid } from 'lucide-react'
interface TaskTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}
export function TaskTabs({ activeTab, onTabChange }: TaskTabsProps) {
  const tabs = [
    {
      id: 'smart',
      label: '智能分类',
      icon: <LayoutGrid size={16} />,
    },
    {
      id: 'duplicates',
      label: '重复项检测',
      icon: <PieChart size={16} />,
    },
    {
      id: 'deadlinks',
      label: '失效链接检测',
      icon: <AlertCircle size={16} />,
    },
    {
      id: 'emptyfolders',
      label: '空文件夹检测',
      icon: <Folder size={16} />,
    },
  ]
  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

```
```components/analysis/ResultsPanel.tsx
import React, { useState } from 'react'
import {
  Trash2,
  Settings,
  ExternalLink,
  FileDown,
  CheckCircle,
} from 'lucide-react'
interface ResultsPanelProps {
  activeTab: string
  isAnalyzing: boolean
  progress: number
  duplicateResults: any[]
  deadLinkResults: any[]
  emptyFolderResults: any[]
  smartCategorization: any[]
}
export function ResultsPanel({
  activeTab,
  isAnalyzing,
  progress,
  duplicateResults,
  deadLinkResults,
  emptyFolderResults,
  smartCategorization,
}: ResultsPanelProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  )
  const toggleSelectAll = (items: any[]) => {
    if (items.every((item) => selectedItems[item.id])) {
      // If all are selected, unselect all
      const newSelected = {
        ...selectedItems,
      }
      items.forEach((item) => {
        newSelected[item.id] = false
      })
      setSelectedItems(newSelected)
    } else {
      // Otherwise, select all
      const newSelected = {
        ...selectedItems,
      }
      items.forEach((item) => {
        newSelected[item.id] = true
      })
      setSelectedItems(newSelected)
    }
  }
  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }
  // Render analyzing state
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-full max-w-md bg-secondary rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>
        <p className="text-muted-foreground">
          正在分析中，请稍候... {Math.round(progress)}%
        </p>
      </div>
    )
  }
  // Render empty state (before analysis)
  if (!isAnalyzing && progress === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <div className="p-3 bg-muted rounded-full">
          {activeTab === 'smart' && <LayoutGrid size={24} />}
          {activeTab === 'duplicates' && <PieChart size={24} />}
          {activeTab === 'deadlinks' && <AlertCircle size={24} />}
          {activeTab === 'emptyfolders' && <Folder size={24} />}
        </div>
        <h3 className="text-lg font-medium">
          {activeTab === 'smart' && '开始智能分类分析'}
          {activeTab === 'duplicates' && '开始重复项检测'}
          {activeTab === 'deadlinks' && '开始失效链接检测'}
          {activeTab === 'emptyfolders' && '开始空文件夹检测'}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {activeTab === 'smart' &&
            '分析您的书签并提供智能分类建议，帮助您更好地组织书签。'}
          {activeTab === 'duplicates' &&
            '检测您的书签库中的重复项，帮助您清理冗余内容。'}
          {activeTab === 'deadlinks' &&
            '检测您的书签库中已失效的链接，保持书签库的健康。'}
          {activeTab === 'emptyfolders' &&
            '查找并标记空文件夹，帮助您保持书签结构整洁。'}
        </p>
        <button className="px-4 py-2 font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90">
          开始分析
        </button>
      </div>
    )
  }
  // Helper function to render duplicate results
  const renderDuplicateResults = () => {
    const grouped: Record<string, any[]> = {}
    duplicateResults.forEach((item) => {
      if (!grouped[item.url]) {
        grouped[item.url] = []
      }
      grouped[item.url].push(item)
    })
    return (
      <>
        <div className="p-4 mb-4 bg-muted/50 rounded-md">
          <h3 className="font-medium">分析结果摘要</h3>
          <p className="text-sm text-muted-foreground">
            共发现 {duplicateResults.length} 个重复书签，分布在{' '}
            {Object.keys(grouped).length} 个URL中。
          </p>
        </div>
        <div className="space-y-4">
          {Object.entries(grouped).map(([url, items], groupIndex) => (
            <div key={groupIndex} className="p-4 border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">重复URL #{groupIndex + 1}</h4>
                <span className="text-xs text-muted-foreground">
                  {items.length}个副本
                </span>
              </div>
              <a
                href="#"
                className="flex items-center mb-3 text-sm text-blue-600 hover:underline gap-1 truncate"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink size={14} />
                {url}
              </a>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 text-sm bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary"
                        checked={!!selectedItems[item.id]}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        文件夹: {item.folder}
                      </span>
                      <button className="p-1 text-red-500 rounded-md hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-md sticky bottom-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-primary focus:ring-primary"
              checked={duplicateResults.every((item) => selectedItems[item.id])}
              onChange={() => toggleSelectAll(duplicateResults)}
            />
            <span className="text-sm">全选</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent flex items-center gap-1">
              <FileDown size={14} />
              导出结果
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white transition-colors rounded-md bg-red-500 hover:bg-red-600 flex items-center gap-1">
              <Trash2 size={14} />
              一键清理所有重复项
            </button>
          </div>
        </div>
      </>
    )
  }
  // Helper function to render dead link results
  const renderDeadLinkResults = () => {
    return (
      <>
        <div className="p-4 mb-4 bg-muted/50 rounded-md">
          <h3 className="font-medium">分析结果摘要</h3>
          <p className="text-sm text-muted-foreground">
            共发现 {deadLinkResults.length} 个失效链接。
          </p>
        </div>
        <div className="space-y-2">
          {deadLinkResults.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleSelectItem(item.id)}
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {item.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  文件夹: {item.folder}
                </span>
                <button className="p-1 text-red-500 rounded-md hover:bg-red-100">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-md sticky bottom-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-primary focus:ring-primary"
              checked={deadLinkResults.every((item) => selectedItems[item.id])}
              onChange={() => toggleSelectAll(deadLinkResults)}
            />
            <span className="text-sm">全选</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent flex items-center gap-1">
              <FileDown size={14} />
              导出结果
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white transition-colors rounded-md bg-red-500 hover:bg-red-600 flex items-center gap-1">
              <Trash2 size={14} />
              批量删除所有失效链接
            </button>
          </div>
        </div>
      </>
    )
  }
  // Helper function to render empty folder results
  const renderEmptyFolderResults = () => {
    return (
      <>
        <div className="p-4 mb-4 bg-muted/50 rounded-md">
          <h3 className="font-medium">分析结果摘要</h3>
          <p className="text-sm text-muted-foreground">
            共发现 {emptyFolderResults.length} 个空文件夹。
          </p>
        </div>
        <div className="space-y-2">
          {emptyFolderResults.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleSelectItem(item.id)}
                />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 text-red-500 rounded-md hover:bg-red-100">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-md sticky bottom-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-primary focus:ring-primary"
              checked={emptyFolderResults.every(
                (item) => selectedItems[item.id],
              )}
              onChange={() => toggleSelectAll(emptyFolderResults)}
            />
            <span className="text-sm">全选</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent flex items-center gap-1">
              <FileDown size={14} />
              导出结果
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white transition-colors rounded-md bg-red-500 hover:bg-red-600 flex items-center gap-1">
              <Trash2 size={14} />
              一键清理所有空文件夹
            </button>
          </div>
        </div>
      </>
    )
  }
  // Helper function to render smart categorization results
  const renderSmartCategorizationResults = () => {
    return (
      <>
        <div className="p-4 mb-4 bg-muted/50 rounded-md">
          <h3 className="font-medium">分析结果摘要</h3>
          <p className="text-sm text-muted-foreground">
            发现 {smartCategorization.length}{' '}
            个未分类书签，已为它们生成智能分类建议。
          </p>
        </div>
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent">
            <Settings size={14} />
            分类偏好设置
          </button>
        </div>
        <div className="space-y-2">
          {smartCategorization.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleSelectItem(item.id)}
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {item.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  建议分类: {item.suggestedCategory}
                  <span className="ml-1 text-xs text-blue-600">
                    ({Math.round(item.confidence * 100)}%)
                  </span>
                </div>
                <button className="p-1 text-green-500 rounded-md hover:bg-green-100">
                  <CheckCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 p-4 bg-muted/50 rounded-md sticky bottom-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded text-primary focus:ring-primary"
              checked={smartCategorization.every(
                (item) => selectedItems[item.id],
              )}
              onChange={() => toggleSelectAll(smartCategorization)}
            />
            <span className="text-sm">全选</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent flex items-center gap-1">
              <FileDown size={14} />
              导出结果
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90 flex items-center gap-1">
              <CheckCircle size={14} />
              应用所有分类建议
            </button>
          </div>
        </div>
      </>
    )
  }
  // Render results based on active tab
  return (
    <div className="mt-4">
      {activeTab === 'duplicates' && renderDuplicateResults()}
      {activeTab === 'deadlinks' && renderDeadLinkResults()}
      {activeTab === 'emptyfolders' && renderEmptyFolderResults()}
      {activeTab === 'smart' && renderSmartCategorizationResults()}
    </div>
  )
}
// Import icons that were referenced but not imported
import { LayoutGrid, PieChart, AlertCircle, Folder } from 'lucide-react'

```
```pages/Dashboard.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { KeyMetrics } from '../components/dashboard/KeyMetrics'
import { WordCloud } from '../components/dashboard/WordCloud'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap'
import {
  generateMetricsData,
  generateWordCloudData,
  generateCategoryData,
  generateActivityData,
} from '../utils/mockData'
export function Dashboard() {
  // Generate mock data
  const metricsData = generateMetricsData()
  const wordCloudData = generateWordCloudData()
  const categoryData = generateCategoryData()
  const activityData = generateActivityData()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据概览</h1>
        <Link
          to="/analysis"
          className="px-4 py-2 font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
        >
          前往智能分析中心
        </Link>
      </div>
      <KeyMetrics metrics={metricsData} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WordCloud words={wordCloudData} />
        <CategoryChart data={categoryData} />
      </div>
      <ActivityHeatmap data={activityData} />
    </div>
  )
}

```
```pages/Analysis.tsx
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TaskTabs } from '../components/analysis/TaskTabs'
import { ResultsPanel } from '../components/analysis/ResultsPanel'
import { AnalysisLogs, LogEntry } from '../components/analysis/AnalysisLogs'
import {
  generateDuplicateResults,
  generateDeadLinkResults,
  generateEmptyFolderResults,
  generateSmartCategorizationResults,
} from '../utils/mockData'
export function Analysis() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'smart')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  // Generate mock results
  const duplicateResults = generateDuplicateResults()
  const deadLinkResults = generateDeadLinkResults()
  const emptyFolderResults = generateEmptyFolderResults()
  const smartCategorizationResults = generateSmartCategorizationResults()
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({
      tab,
    })
  }
  // Generate log messages based on active tab and progress
  const generateLogMessage = (
    progress: number,
    tab: string,
  ): LogEntry | null => {
    // Generate a unique ID for the log entry
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const timestamp = new Date()
    // Logs for different analysis types
    const logsByTab: Record<
      string,
      Array<{
        threshold: number
        message: string
        type: LogEntry['type']
      }>
    > = {
      smart: [
        {
          threshold: 5,
          message: '开始智能分类分析...',
          type: 'info',
        },
        {
          threshold: 15,
          message: '正在加载书签数据...',
          type: 'info',
        },
        {
          threshold: 25,
          message: '正在分析书签内容...',
          type: 'info',
        },
        {
          threshold: 40,
          message: '正在提取关键词...',
          type: 'info',
        },
        {
          threshold: 55,
          message: '正在生成分类建议...',
          type: 'info',
        },
        {
          threshold: 70,
          message: '发现30个未分类书签',
          type: 'warning',
        },
        {
          threshold: 85,
          message: '正在计算分类置信度...',
          type: 'info',
        },
        {
          threshold: 95,
          message: '正在整理分析结果...',
          type: 'info',
        },
        {
          threshold: 100,
          message: '智能分类分析完成！',
          type: 'success',
        },
      ],
      duplicates: [
        {
          threshold: 5,
          message: '开始重复项检测...',
          type: 'info',
        },
        {
          threshold: 20,
          message: '正在比较URL...',
          type: 'info',
        },
        {
          threshold: 40,
          message: '正在比较书签标题...',
          type: 'info',
        },
        {
          threshold: 60,
          message: '正在比较书签内容...',
          type: 'info',
        },
        {
          threshold: 75,
          message: '发现潜在重复项...',
          type: 'warning',
        },
        {
          threshold: 85,
          message: '正在验证重复项...',
          type: 'info',
        },
        {
          threshold: 95,
          message: '正在整理分析结果...',
          type: 'info',
        },
        {
          threshold: 100,
          message: '重复项检测完成！找到42个重复书签',
          type: 'success',
        },
      ],
      deadlinks: [
        {
          threshold: 5,
          message: '开始失效链接检测...',
          type: 'info',
        },
        {
          threshold: 15,
          message: '正在准备链接列表...',
          type: 'info',
        },
        {
          threshold: 30,
          message: '开始验证链接状态...',
          type: 'info',
        },
        {
          threshold: 45,
          message: '正在检查HTTP状态码...',
          type: 'info',
        },
        {
          threshold: 60,
          message: '发现潜在失效链接...',
          type: 'warning',
        },
        {
          threshold: 75,
          message: '正在进行二次验证...',
          type: 'info',
        },
        {
          threshold: 85,
          message: '正在分析重定向链接...',
          type: 'info',
        },
        {
          threshold: 95,
          message: '正在整理分析结果...',
          type: 'info',
        },
        {
          threshold: 100,
          message: '失效链接检测完成！找到23个失效链接',
          type: 'success',
        },
      ],
      emptyfolders: [
        {
          threshold: 5,
          message: '开始空文件夹检测...',
          type: 'info',
        },
        {
          threshold: 25,
          message: '正在遍历文件夹结构...',
          type: 'info',
        },
        {
          threshold: 50,
          message: '正在统计文件夹内容...',
          type: 'info',
        },
        {
          threshold: 75,
          message: '正在识别空文件夹...',
          type: 'info',
        },
        {
          threshold: 90,
          message: '正在整理分析结果...',
          type: 'info',
        },
        {
          threshold: 100,
          message: '空文件夹检测完成！找到7个空文件夹',
          type: 'success',
        },
      ],
    }
    // Find appropriate log message based on progress
    const logs = logsByTab[tab] || logsByTab['smart']
    for (const log of logs) {
      if (progress >= log.threshold && progress < log.threshold + 5) {
        return {
          id,
          timestamp,
          message: log.message,
          type: log.type,
        }
      }
    }
    // Occasionally add random error or warning messages
    if (progress > 10 && progress < 90 && Math.random() < 0.05) {
      const errorMessages = [
        {
          message: '无法访问某些书签，将跳过...',
          type: 'warning' as const,
        },
        {
          message: '网络连接不稳定，分析速度可能受影响',
          type: 'warning' as const,
        },
        {
          message: '解析某些书签时遇到问题',
          type: 'error' as const,
        },
      ]
      const randomError =
        errorMessages[Math.floor(Math.random() * errorMessages.length)]
      return {
        id,
        timestamp,
        message: randomError.message,
        type: randomError.type,
      }
    }
    return null
  }
  // Simulate analysis process for demo purposes
  const startAnalysis = () => {
    setIsAnalyzing(true)
    setProgress(0)
    setLogs([
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date(),
        message: `开始${activeTab === 'smart' ? '智能分类' : activeTab === 'duplicates' ? '重复项检测' : activeTab === 'deadlinks' ? '失效链接检测' : '空文件夹检测'}分析...`,
        type: 'info',
      },
    ])
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (Math.random() * 3 + 1) // Random progress increment
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          return 100
        }
        return Math.min(newProgress, 99) // Cap at 99 until complete
      })
    }, 200)
  }
  // Add log messages as progress increases
  useEffect(() => {
    if (isAnalyzing) {
      const logEntry = generateLogMessage(progress, activeTab)
      if (logEntry) {
        setLogs((prev) => [...prev, logEntry])
      }
      // Add final success message when analysis completes
      if (progress >= 100) {
        setTimeout(() => {
          setLogs((prev) => [
            ...prev,
            {
              id: `log-complete-${Date.now()}`,
              timestamp: new Date(),
              message: '分析完成！结果已准备就绪',
              type: 'success',
            },
          ])
        }, 500)
      }
    }
  }, [progress, isAnalyzing, activeTab])
  // Start analysis when component mounts (for demo only)
  useEffect(() => {
    if (progress === 0) {
      startAnalysis()
    }
  }, [])
  // Reset logs when tab changes
  useEffect(() => {
    if (!isAnalyzing) {
      setLogs([])
    }
  }, [activeTab])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">智能分析中心</h1>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium transition-colors rounded-md border hover:bg-accent">
            历史版本
          </button>
          {!isAnalyzing && progress === 0 && (
            <button
              className="px-4 py-2 font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
              onClick={startAnalysis}
            >
              开始分析
            </button>
          )}
          {isAnalyzing && (
            <button className="px-4 py-2 font-medium transition-colors rounded-md border border-destructive text-destructive hover:bg-destructive/10">
              取消分析
            </button>
          )}
        </div>
      </div>
      <TaskTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <ResultsPanel
        activeTab={activeTab}
        isAnalyzing={isAnalyzing}
        progress={progress}
        duplicateResults={duplicateResults}
        deadLinkResults={deadLinkResults}
        emptyFolderResults={emptyFolderResults}
        smartCategorization={smartCategorizationResults}
      />
      {isAnalyzing && <AnalysisLogs logs={logs} activeTab={activeTab} />}
    </div>
  )
}

```
```components/analysis/AnalysisLogs.tsx
import React, { useEffect, useRef } from 'react'
import { Clock, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
export interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}
interface AnalysisLogsProps {
  logs: LogEntry[]
  activeTab: string
}
export function AnalysisLogs({ logs, activeTab }: AnalysisLogsProps) {
  // Auto scroll to bottom when logs update
  const logsEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [logs])
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />
      case 'error':
        return <XCircle size={16} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" />
      case 'info':
      default:
        return <Info size={16} className="text-blue-500" />
    }
  }
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  return (
    <div className="mt-4 bg-card border border-border/50 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Clock size={16} />
          分析日志
        </h3>
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {logs.length} 条记录
        </span>
      </div>
      <div className="p-3 max-h-[240px] overflow-y-auto bg-muted/30">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
            尚无分析日志
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2 text-sm bg-card rounded border-l-2"
                style={{
                  borderLeftColor:
                    log.type === 'success'
                      ? 'rgb(34, 197, 94)'
                      : log.type === 'error'
                        ? 'rgb(239, 68, 68)'
                        : log.type === 'warning'
                          ? 'rgb(245, 158, 11)'
                          : 'rgb(59, 130, 246)',
                }}
              >
                <div className="mt-0.5">{getLogIcon(log.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

```