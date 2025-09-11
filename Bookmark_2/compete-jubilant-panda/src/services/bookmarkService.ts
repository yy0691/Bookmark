/**
 * 书签服务模块 - React Hook 版本
 * 处理书签获取、分析、分类等核心功能
 */

import { useState, useCallback, useEffect } from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  dateAdded?: number;
  dateGroupModified?: number;
  originalTitle?: string;
}

export interface CategorizedBookmarks {
  [category: string]: Bookmark[];
}

export interface BookmarkStats {
  totalBookmarks: number;
  totalCategories: number;
  avgBookmarksPerCategory: number;
  largestCategory: { name: string; count: number };
  uniqueDomains: number;
  duplicateUrls: number;
}

export const useBookmarkService = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<CategorizedBookmarks>({});
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExtensionContext = typeof chrome !== 'undefined' && chrome.bookmarks;

  // 获取所有书签
  const getAllBookmarks = useCallback(async (): Promise<Bookmark[]> => {
    if (!isExtensionContext) {
      // 浏览器测试环境下的模拟数据
      const mockBookmarks = getMockBookmarks();
      console.log(`浏览器测试模式: 使用模拟书签数据 (${mockBookmarks.length}个书签)`);
      return mockBookmarks;
    }
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks: Bookmark[] = [];
        
        console.log(`开始获取书签树...`);
        
        // 递归函数，遍历书签树
        const processNode = (node: any) => {
          if (node.url) {
            // 验证并处理标题
            let processedTitle = node.title || '';
            if (!processedTitle || /^\d+$/.test(processedTitle)) {
              try {
                const url = new URL(node.url);
                processedTitle = url.hostname.replace(/^www\./, '');
                console.log(`发现无效书签标题(${node.title})，已自动替换为: ${processedTitle}`);
              } catch (e) {
                processedTitle = node.title || '未命名书签';
              }
            }
            
            bookmarks.push({
              id: node.id,
              title: processedTitle,
              url: node.url,
              parentId: node.parentId,
              originalTitle: node.title
            });
          }
          
          if (node.children) {
            for (const child of node.children) {
              processNode(child);
            }
          }
        };
        
        // 从根节点开始处理
        for (const node of bookmarkTreeNodes) {
          processNode(node);
        }
        
        console.log(`书签获取完成: 总计${bookmarks.length}个书签`);
        resolve(bookmarks);
      });
    });
  }, [isExtensionContext]);

  // 获取书签树
  const getTree = useCallback(async (): Promise<any[]> => {
    if (!isExtensionContext) return [getMockTree()];
    
    return new Promise((resolve) => {
      chrome.bookmarks.getTree(resolve);
    });
  }, [isExtensionContext]);

  // 搜索书签
  const search = useCallback(async (query: string): Promise<Bookmark[]> => {
    if (!query) return [];
    if (!isExtensionContext) {
      const mockBookmarks = getMockBookmarks();
      return mockBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return new Promise<Bookmark[]>((resolve) => {
      chrome.bookmarks.search(query, (results) => {
        const bookmarks: Bookmark[] = results
          .filter(node => node.url)
          .map(node => ({
            id: node.id,
            title: node.title || '',
            url: node.url!,
            parentId: node.parentId,
            dateAdded: node.dateAdded,
            dateGroupModified: node.dateGroupModified
          }));
        resolve(bookmarks);
      });
    });
  }, [isExtensionContext]);

  // 获取最近的书签
  const getRecent = useCallback(async (count: number): Promise<Bookmark[]> => {
    if (!isExtensionContext) {
      const mockBookmarks = getMockBookmarks();
      return mockBookmarks.slice(0, count);
    }
    
    return new Promise<Bookmark[]>((resolve) => {
      chrome.bookmarks.getRecent(count, (results) => {
        const bookmarks: Bookmark[] = results
          .filter(node => node.url)
          .map(node => ({
            id: node.id,
            title: node.title || '',
            url: node.url!,
            parentId: node.parentId,
            dateAdded: node.dateAdded,
            dateGroupModified: node.dateGroupModified
          }));
        resolve(bookmarks);
      });
    });
  }, [isExtensionContext]);

  // 执行预分类
  const performPreCategorization = useCallback((bookmarkData: any[]): CategorizedBookmarks => {
    const preCategorized: CategorizedBookmarks = {};
    
    // 域名模式匹配
    const domainPatterns = {
      'AI工具': [/gemini\.google\.com/, /openai\.com/, /chat\.openai\.com/, /perplexity\.ai/, /claude\.ai/, /poe\.com/],
      'AI开发平台': [/aistudio\.google\.com/, /platform\.openai\.com/, /colab\.research\.google/, /huggingface\.co/],
      'UI设计工具': [/figma\.com/, /sketch\.com/, /adobe\.com/, /canva\.com/, /framer\.com/],
      '代码托管': [/github\.com/, /gitlab\.com/, /gitee\.com/, /bitbucket\.org/],
      '技术问答': [/stackoverflow\.com/, /stackexchange\.com/, /zhihu\.com/],
      '视频娱乐': [/youtube\.com/, /bilibili\.com/, /netflix\.com/, /youku\.com/, /iqiyi\.com/],
      '社交媒体': [/twitter\.com/, /facebook\.com/, /instagram\.com/, /weibo\.com/, /linkedin\.com/, /reddit\.com/],
      '电商购物': [/taobao\.com/, /jd\.com/, /amazon\.com/, /tmall\.com/, /pinduoduo\.com/],
      '新闻资讯': [/news\./, /sina\.com/, /qq\.com/, /163\.com/, /bbc\./, /cnn\./]
    };
    
    // 基于书签标题的关键词匹配
    const titleKeywords = {
      'AI工具教程': ['AI教程', 'ChatGPT教程', 'Gemini使用', '人工智能教程', 'AI学习', 'machine learning'],
      'UI设计素材': ['设计素材', 'UI素材', '图标', 'icon', '配色', 'color', '字体', 'font'],
      'UI设计案例': ['设计案例', 'UI案例', '界面设计', '交互设计', 'UX案例', '设计灵感'],
      'Figma教程': ['Figma', 'figma教程', '组件库', 'design system'],
      '前端开发': ['前端', 'frontend', 'Vue', 'React', 'Angular', 'JavaScript'],
      '后端开发': ['后端', 'backend', 'API', 'Node.js', 'Python', 'Java']
    };
    
    // 尝试预分类
    bookmarkData.forEach(bookmark => {
      let categorized = false;
      
      // 首先尝试域名匹配
      for (const [category, patterns] of Object.entries(domainPatterns)) {
        if (patterns.some(pattern => pattern.test(bookmark.domain || bookmark.url))) {
          if (!preCategorized[category]) {
            preCategorized[category] = [];
          }
          preCategorized[category].push(bookmark);
          categorized = true;
          break;
        }
      }
      
      // 如果域名没有匹配到，尝试标题关键词匹配
      if (!categorized && bookmark.title) {
        const title = bookmark.title.toLowerCase();
        for (const [category, keywords] of Object.entries(titleKeywords)) {
          if (keywords.some(keyword => title.includes(keyword.toLowerCase()))) {
            if (!preCategorized[category]) {
              preCategorized[category] = [];
            }
            preCategorized[category].push(bookmark);
            break;
          }
        }
      }
    });
    
    console.log(`预分类结果:`, Object.keys(preCategorized).length, '个分类');
    return preCategorized;
  }, []);

  // 生成统计信息
  const generateStats = useCallback((bookmarks: Bookmark[], categories: CategorizedBookmarks): BookmarkStats => {
    const totalBookmarks = bookmarks.length;
    const domains = new Set();
    const urlSet = new Set();
    let duplicateUrls = 0;
    
    // 统计域名和重复URL
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        if (urlSet.has(bookmark.url)) {
          duplicateUrls++;
        } else {
          urlSet.add(bookmark.url);
        }
        
        try {
          const domain = new URL(bookmark.url).hostname.replace(/^www\./, '');
          domains.add(domain);
        } catch (e) {
          // 忽略无效URL
        }
      }
    });
    
    // 计算分类统计
    const categoryStats = Object.entries(categories).map(([name, items]) => ({
      name,
      count: items.length
    })).sort((a, b) => b.count - a.count);
    
    const largestCategory = categoryStats[0] || { name: '无', count: 0 };
    const avgBookmarksPerCategory = categoryStats.length > 0 
      ? Math.round(totalBookmarks / categoryStats.length) 
      : 0;
    
    return {
      totalBookmarks,
      totalCategories: categoryStats.length,
      avgBookmarksPerCategory,
      largestCategory,
      uniqueDomains: domains.size,
      duplicateUrls
    };
  }, []);

  // 加载书签数据
  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedBookmarks = await getAllBookmarks();
      setBookmarks(fetchedBookmarks);
      
      // 生成分类数据
      const bookmarkData = fetchedBookmarks.map(b => ({
        title: b.title || '未命名书签',
        url: b.url || '',
        domain: extractDomain(b.url)
      }));
      
      const categorized = performPreCategorization(bookmarkData);
      setCategories(categorized);
      
      // 生成统计信息
      const generatedStats = generateStats(fetchedBookmarks, categorized);
      setStats(generatedStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载书签失败');
    } finally {
      setIsLoading(false);
    }
  }, [getAllBookmarks, performPreCategorization, generateStats]);

  // 提取域名
  const extractDomain = useCallback((url: string): string => {
    try {
      if (url) {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
      }
    } catch (e) {
      // URL解析失败，忽略
    }
    return '';
  }, []);

  // 获取模拟书签数据用于浏览器测试
  const getMockBookmarks = (): Bookmark[] => [
    {
      id: "1",
      title: "GitHub",
      url: "https://github.com",
      parentId: "0"
    },
    {
      id: "2", 
      title: "ChatGPT",
      url: "https://chat.openai.com",
      parentId: "0"
    },
    {
      id: "3",
      title: "Figma",
      url: "https://figma.com",
      parentId: "0"
    },
    {
      id: "4",
      title: "Vue.js 官方文档",
      url: "https://vuejs.org",
      parentId: "0"
    },
    {
      id: "5",
      title: "Stack Overflow",
      url: "https://stackoverflow.com",
      parentId: "0"
    },
    {
      id: "6",
      title: "YouTube",
      url: "https://youtube.com",
      parentId: "0"
    },
    {
      id: "7",
      title: "淘宝网",
      url: "https://taobao.com",
      parentId: "0"
    },
    {
      id: "8",
      title: "知乎",
      url: "https://zhihu.com",
      parentId: "0"
    },
    {
      id: "9",
      title: "Gemini",
      url: "https://gemini.google.com",
      parentId: "0"
    },
    {
      id: "10",
      title: "React 文档",
      url: "https://react.dev",
      parentId: "0"
    }
  ];

  // 获取模拟书签树
  const getMockTree = () => ({
    id: "0",
    title: "书签栏",
    children: getMockBookmarks().map(bookmark => ({
      ...bookmark,
      children: []
    }))
  });

  // 初始化时加载数据
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return {
    bookmarks,
    categories,
    stats,
    isLoading,
    error,
    getAllBookmarks,
    getTree,
    search,
    getRecent,
    performPreCategorization,
    generateStats,
    loadBookmarks,
    extractDomain
  };
};
