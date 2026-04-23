'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CodeModal } from '@/components/ui/modal';
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { jsonToJava, JsonToJavaOptions } from '@/utils/jsonToJava';

import { FaCopy, FaDownload, FaUpload, FaRedo, FaExpand, FaCompress, FaJava, FaCode } from 'react-icons/fa';

// 🚀 全新的层级嵌套组件 - 真正的DOM层级结构
const JsonTreeNode = React.memo<{
  obj: any;
  keyName?: string;
  level?: number;
  nodeId?: string;
  parentId?: string;
  onToggleCollapse: (nodeId: string) => void;
  collapsedNodes: Set<string>;
  onNodeClick?: (nodeId: string, event: React.MouseEvent) => void;
  isLastItem?: boolean;
}>(({ obj, keyName, level = 0, nodeId = 'root', parentId, onToggleCollapse, collapsedNodes, onNodeClick, isLastItem = false }) => {
  const indent = level * 20;
  // 🚀 只在初始渲染时确定折叠状态，后续通过DOM操作控制
  const initiallyCollapsed = collapsedNodes.has(nodeId);

  // 渲染基本值（string, number, boolean, null）
  const renderValue = (value: any, key?: string) => {
    const type = value === null ? 'null' : typeof value;
    const stringValue = type === 'string' ? `"${value}"` : String(value);
    const isLongText = stringValue.length > 50; // 判断是否为长文本
    
    return (
      <div 
        className="flex items-start py-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group" 
        style={{ paddingLeft: `${indent}px` }}
        onDoubleClick={(e) => onNodeClick?.(nodeId, e)}
        title="双击生成访问代码"
      >
        <div className="w-7 flex-shrink-0" />
        <div className="flex items-start min-w-0 flex-1">
          {key && (
            <span className="text-blue-600 dark:text-blue-400 font-medium mr-1 flex-shrink-0">
              {key.startsWith('[') ? `${key}:` : `"${key}":`}
            </span>
          )}
          <span className={`${type === 'string' ? 'text-green-600 dark:text-green-400' :
            type === 'number' ? 'text-purple-600 dark:text-purple-400' :
              type === 'boolean' ? 'text-orange-600 dark:text-orange-400' :
                type === 'null' ? 'text-gray-500 dark:text-gray-400' :
                  'text-gray-800 dark:text-gray-200'
            } ${isLongText ? 'break-words' : 'break-all'} min-w-0`}>
            {stringValue}{!isLastItem && <span className="text-gray-600 dark:text-gray-400">,</span>}
          </span>
          <FaCode 
            className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-0.5 flex-shrink-0 cursor-pointer hover:text-[#00bba7]" 
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick?.(nodeId, e);
            }}
            title="点击生成访问代码"
          />
        </div>
      </div>
    );
  };

  // 如果是基本类型，直接渲染
  if (obj === null || typeof obj !== 'object') {
    return renderValue(obj, keyName);
  }

  const isArray = Array.isArray(obj);
  const entries = isArray ? obj.map((item, index) => [index, item]) : Object.entries(obj);
  const hasChildren = entries.length > 0;

  // 🎯 空对象/数组在一行显示
  if (!hasChildren) {
    return (
      <div data-node-id={nodeId} data-level={level}>
        <div 
          className="flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group" 
          style={{ paddingLeft: `${indent}px` }}
          onDoubleClick={(e) => onNodeClick?.(nodeId, e)}
          title="双击生成访问代码"
        >
          <div className="w-7 flex-shrink-0" />
          <div className="flex items-center min-w-0 flex-1">
            {keyName && (
              <span className="text-blue-600 dark:text-blue-400 font-medium mr-1">
                {keyName.startsWith('[') ? `${keyName}:` : `"${keyName}":`}
              </span>
            )}
            <span className="text-gray-800 dark:text-gray-200">
              {isArray ? '[]' : '{}'}{!isLastItem && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </span>
            <FaCode 
              className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 cursor-pointer hover:text-[#00bba7]" 
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick?.(nodeId, e);
              }}
              title="点击生成访问代码"
            />
          </div>
        </div>
      </div>
    );
  }

  // 🎯 有内容的对象/数组正常显示
  return (
    <div data-node-id={nodeId} data-level={level}>
      {/* 🎯 对象/数组的开始标签 */}
      <div 
        className="flex items-center py-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group" 
        style={{ paddingLeft: `${indent}px` }}
        onDoubleClick={(e) => {
          // 如果双击的是折叠按钮，不触发节点点击
          if ((e.target as HTMLElement).closest('button')) {
            return;
          }
          onNodeClick?.(nodeId, e);
        }}
        title="双击生成访问代码"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(nodeId);
          }}
          className="mr-2 p-1 rounded flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span dangerouslySetInnerHTML={{
            __html: initiallyCollapsed
              ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>'
              : '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>'
          }} />
        </button>

        <div className="flex items-center min-w-0 flex-1">
          {keyName && (
            <span className="text-blue-600 dark:text-blue-400 font-medium mr-1">
              {keyName.startsWith('[') ? `${keyName}:` : `"${keyName}":`}
            </span>
          )}
          <span
            className="text-gray-800 dark:text-gray-200 node-label"
            data-is-array={isArray.toString()}
            data-item-count={isArray ? obj.length.toString() : entries.length.toString()}
          >
            {isArray ? (
              initiallyCollapsed ? `[...] (${obj.length} items)` : '['
            ) : (
              initiallyCollapsed ? `{...} (${entries.length} items)` : '{'
            )}
          </span>
          <FaCode 
            className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0 cursor-pointer hover:text-[#00bba7]" 
            onMouseDown={(e) => {
              e.stopPropagation();
              onNodeClick?.(nodeId, e);
            }}
            title="点击生成访问代码"
          />
        </div>
      </div>

      {/* 🚀 关键：层级嵌套的子节点容器 */}
      <div
        className={`transition-all duration-200 ${initiallyCollapsed ? 'hidden' : 'block'}`}
        data-children-of={nodeId}
      >
        {entries.map(([key, value], index) => {
          const childNodeId = `${nodeId}.${key}`;
          const isLastItem = index === entries.length - 1;

          // 🎯 为数组中的对象显示下标
          let displayKey: string | undefined;
          if (isArray) {
            // 如果是数组中的对象或数组，显示下标
            if (value !== null && typeof value === 'object') {
              displayKey = `[${key}]`;
            }
            // 基本类型不显示key
          } else {
            // 对象的属性正常显示
            displayKey = String(key);
          }

          return (
            <JsonTreeNode
              key={childNodeId}
              obj={value}
              keyName={displayKey}
              level={level + 1}
              nodeId={childNodeId}
              parentId={nodeId}
              onToggleCollapse={onToggleCollapse}
              collapsedNodes={collapsedNodes}
              onNodeClick={onNodeClick}
              isLastItem={isLastItem}
            />
          );
        })}
      </div>

      {/* 🎯 对象/数组的结束标签 */}
      <div
        className={`flex items-center py-1 ${initiallyCollapsed ? 'hidden' : 'block'}`}
        style={{ paddingLeft: `${indent}px` }}
        data-closing-tag-of={nodeId}
      >
        <div className="w-7 flex-shrink-0" />
        <span className="text-gray-800 dark:text-gray-200">
          {isArray ? ']' : '}'}{!isLastItem && <span className="text-gray-600 dark:text-gray-400">,</span>}
        </span>
      </div>
    </div>
  );
});

// 🚀 简化的接口 - 不再需要复杂的节点结构
interface JsonData {
  parsed: any;
  totalNodes: number;
  maxDepth: number;
}

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState('');
  const [formattedJson, setFormattedJson] = useState('');
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isFormatting, setIsFormatting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // JSON转Java相关状态
  const [showJavaModal, setShowJavaModal] = useState(false);
  const [javaCode, setJavaCode] = useState('');
  const [javaOptions, setJavaOptions] = useState<JsonToJavaOptions>({
    useLombok: true,
    useCamelCase: true,
    className: 'JsonData'
  });
  
  // 代码生成相关状态
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeLanguage, setAccessCodeLanguage] = useState<'java' | 'javascript' | 'typescript'>('java');
  const [accessCodeTitle, setAccessCodeTitle] = useState('');
  const [selectedJsonFramework, setSelectedJsonFramework] = useState<'fastjson' | 'jackson' | 'gson'>('jackson');
  
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // 🚀 监听窗口大小变化，动态调整容器宽度
  React.useEffect(() => {
    const updateContainerWidth = () => {
      if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // 🚀 计算节点总数的辅助函数
  const countNodes = useCallback((obj: any): number => {
    if (obj === null || typeof obj !== 'object') return 1;

    let count = 1; // 当前节点
    const entries = Array.isArray(obj) ? obj : Object.values(obj);

    for (const value of entries) {
      count += countNodes(value);
    }

    return count;
  }, []);

  // 🚀 计算JSON最大深度的辅助函数
  const calculateMaxDepth = useCallback((obj: any, currentDepth: number = 0): number => {
    if (obj === null || typeof obj !== 'object') return currentDepth;

    let maxDepth = currentDepth;
    const entries = Array.isArray(obj) ? obj : Object.values(obj);

    for (const value of entries) {
      const depth = calculateMaxDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }, []);

  // 🚀 根据JSON深度和折叠状态计算容器样式
  const getContainerStyle = useCallback((maxDepth: number) => {
    // 考虑折叠状态的有效深度（折叠的节点不计入宽度计算）
    const effectiveDepth = Math.max(1, maxDepth - collapsedNodes.size * 0.3); // 折叠节点减少30%的深度影响
    
    // 基础宽度：每层级20px缩进 + 内容宽度估算
    const baseWidth = 280; // 基础内容宽度
    const indentWidth = effectiveDepth * 20; // 缩进宽度
    const contentWidth = 300; // 预估内容宽度（键名+值+符号）
    const calculatedWidth = baseWidth + indentWidth + contentWidth;
    
    // 响应式容器最大宽度限制
    const currentWidth = containerWidth || 1200;
    const containerMaxWidth = Math.min(currentWidth * 0.7, 1600); // 使用70%的窗口宽度，最大1600px
    const toleranceWidth = containerMaxWidth * 0.8; // 容忍宽度为最大宽度的80%
    
    console.log(`📏 智能深度分析: 原始深度=${maxDepth}, 有效深度=${effectiveDepth.toFixed(1)}, 计算宽度=${calculatedWidth}px, 容忍宽度=${toleranceWidth}px, 折叠节点=${collapsedNodes.size}个`);
    
    if (calculatedWidth <= toleranceWidth) {
      // 内容不超出容忍宽度，使用自适应宽度，不显示横向滚动条
      console.log('✅ 智能自适应: 隐藏横向滚动条，内容自然展示');
      return {
        width: 'fit-content',
        minWidth: '100%',
        maxWidth: 'none',
        overflowX: 'visible' as const,
        whiteSpace: 'nowrap' as const,
      };
    } else {
      // 内容超出容忍宽度，限定宽度并允许滚动和换行
      console.log('📏 智能限宽: 启用横向滚动，支持文本换行');
      return {
        width: '100%',
        maxWidth: `${containerMaxWidth}px`,
        overflowX: 'auto' as const,
        whiteSpace: 'pre-wrap' as const, // 允许换行
        wordBreak: 'break-word' as const, // 强制长单词换行
      };
    }
  }, [containerWidth, collapsedNodes.size]);

  const formatJson = useCallback(async () => {
    if (!inputJson.trim()) {
      showError('请输入JSON文本');
      setFormattedJson('');
      setJsonData(null);
      setCollapsedNodes(new Set());
      return;
    }

    setIsFormatting(true);

    // 使用setTimeout来模拟异步操作，让UI有时间显示loading状态
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputJson(formatted);
      setFormattedJson(formatted);

      const totalNodes = countNodes(parsed);
      const maxDepth = calculateMaxDepth(parsed);
      setJsonData({ parsed, totalNodes, maxDepth });

      // 🔍 调试日志：打印JSON结构信息
      console.log('📊 JSON层级结构信息 (formatJson):');
      console.log('🚀 新架构: 真正的DOM层级嵌套，无需行号计算');
      console.log('📈 总节点数:', totalNodes);
      console.log('📏 最大深度:', maxDepth);
      console.log('🎯 解析的数据:', parsed);

      // 默认折叠深层级节点（level > 2）
      const defaultCollapsed = new Set<string>();

      // 递归收集需要默认折叠的节点ID
      const collectDeepNodes = (obj: any, nodeId: string, level: number) => {
        if (obj === null || typeof obj !== 'object') return;

        if (level > 2) {
          defaultCollapsed.add(nodeId);
          console.log(`🔒 默认折叠深层节点: ${nodeId} (level: ${level})`);
        }

        const entries = Array.isArray(obj) ? obj.map((item, index) => [index, item]) : Object.entries(obj);
        entries.forEach(([key, value]) => {
          const childNodeId = `${nodeId}.${key}`;
          collectDeepNodes(value, childNodeId, level + 1);
        });
      };

      collectDeepNodes(parsed, 'root', 0);

      console.log(`🔒 默认折叠 ${defaultCollapsed.size} 个深层节点`);
      setCollapsedNodes(defaultCollapsed);

      showSuccess('JSON格式化成功');
    } catch (err: any) {
      const errorMessage = err.message;
      let lineNumber = 1;

      const lineMatch = errorMessage.match(/at position (\d+)/);
      if (lineMatch) {
        const position = parseInt(lineMatch[1]);
        const lines = inputJson.substring(0, position).split('\n');
        lineNumber = lines.length;
      }

      setFormattedJson('');
      setJsonData(null);
      setCollapsedNodes(new Set());
      showError('JSON格式错误', `第${lineNumber}行: ${errorMessage}`);
    } finally {
      setIsFormatting(false);
    }
  }, [inputJson, countNodes, showSuccess, showError]);

  const compressJson = useCallback(() => {
    if (!inputJson.trim()) {
      showError('请输入JSON文本');
      setFormattedJson('');
      setJsonData(null);
      setCollapsedNodes(new Set());
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const compressed = JSON.stringify(parsed);
      setInputJson(compressed);
      setFormattedJson(compressed);

      const totalNodes = countNodes(parsed);
      const maxDepth = calculateMaxDepth(parsed);
      setJsonData({ parsed, totalNodes, maxDepth });

      // 默认折叠深层级节点（level > 2）
      const defaultCollapsed = new Set<string>();

      const collectDeepNodes = (obj: any, nodeId: string, level: number) => {
        if (obj === null || typeof obj !== 'object') return;

        if (level > 2) {
          defaultCollapsed.add(nodeId);
        }

        const entries = Array.isArray(obj) ? obj.map((item, index) => [index, item]) : Object.entries(obj);
        entries.forEach(([key, value]) => {
          const childNodeId = `${nodeId}.${key}`;
          collectDeepNodes(value, childNodeId, level + 1);
        });
      };

      collectDeepNodes(parsed, 'root', 0);
      setCollapsedNodes(defaultCollapsed);

      showSuccess('JSON压缩成功');
    } catch (err: any) {
      const errorMessage = err.message;
      let lineNumber = 1;

      const lineMatch = errorMessage.match(/at position (\d+)/);
      if (lineMatch) {
        const position = parseInt(lineMatch[1]);
        const lines = inputJson.substring(0, position).split('\n');
        lineNumber = lines.length;
      }

      setFormattedJson('');
      setJsonData(null);
      setCollapsedNodes(new Set());
      showError('JSON格式错误', `第${lineNumber}行: ${errorMessage}`);
    }
  }, [inputJson, countNodes, showSuccess, showError]);

  const toggleCollapse = useCallback((nodeId: string) => {
    const startTime = performance.now();

    console.log(`\n🔄 切换折叠状态: ${nodeId}`);
    console.log('🚀 直接DOM操作: 跳过React渲染，直接操作DOM元素');

    // 🚀 关键优化：直接操作DOM，避免React重新渲染
    const childrenContainer = document.querySelector(`[data-children-of="${nodeId}"]`) as HTMLElement;
    const toggleButton = document.querySelector(`[data-node-id="${nodeId}"] button`) as HTMLElement;
    const labelSpan = document.querySelector(`[data-node-id="${nodeId}"] .node-label`) as HTMLElement;
    const closingTag = document.querySelector(`[data-closing-tag-of="${nodeId}"]`) as HTMLElement;

    // 空对象/数组没有这些元素，直接返回
    if (!toggleButton || !labelSpan || !closingTag || !childrenContainer) {
      console.log('❌ 空对象/数组无法折叠');
      return;
    }

    const isCurrentlyHidden = childrenContainer.classList.contains('hidden');
    const isArray = labelSpan.dataset.isArray === 'true';
    const itemCount = parseInt(labelSpan.dataset.itemCount || '0');

    console.log(`📊 当前折叠状态: ${isCurrentlyHidden ? '已折叠' : '已展开'}`);

    if (isCurrentlyHidden) {
      // 展开
      childrenContainer.classList.remove('hidden');
      childrenContainer.classList.add('block');
      closingTag.classList.remove('hidden');
      closingTag.classList.add('block');
      toggleButton.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
      labelSpan.textContent = isArray ? '[' : '{';
      console.log('➡️ 操作: 展开节点 - 显示子容器和结束标签');

      // 更新状态（用于其他功能，如全部展开/折叠）
      setCollapsedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    } else {
      // 折叠
      childrenContainer.classList.remove('block');
      childrenContainer.classList.add('hidden');
      closingTag.classList.remove('block');
      closingTag.classList.add('hidden');
      toggleButton.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>';
      labelSpan.textContent = isArray ? `[...] (${itemCount} items)` : `{...} (${itemCount} items)`;
      console.log('➡️ 操作: 折叠节点 - 隐藏子容器和结束标签');

      // 更新状态
      setCollapsedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(nodeId);
        return newSet;
      });
    }

    const endTime = performance.now();
    console.log(`⚡ 折叠操作耗时: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`🎯 极致性能: 直接DOM操作，零React渲染开销`);
  }, []);

  const expandAll = useCallback(() => {
    console.log('\n🔓 全部展开操作');
    console.log('� 直空接DOM操作: 批量展开所有节点');

    const startTime = performance.now();

    // 直接操作所有隐藏的容器
    const hiddenContainers = document.querySelectorAll('[data-children-of].hidden');
    const hiddenClosingTags = document.querySelectorAll('[data-closing-tag-of].hidden');
    const toggleButtons = document.querySelectorAll('[data-node-id] button');
    const nodeLabels = document.querySelectorAll('[data-node-id] .node-label');

    hiddenContainers.forEach(container => {
      container.classList.remove('hidden');
      container.classList.add('block');
    });

    hiddenClosingTags.forEach(tag => {
      tag.classList.remove('hidden');
      tag.classList.add('block');
    });

    // 更新所有按钮图标为展开状态
    toggleButtons.forEach(button => {
      button.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
    });

    // 更新所有标签为展开状态
    nodeLabels.forEach(label => {
      const isArray = (label as HTMLElement).dataset.isArray === 'true';
      (label as HTMLElement).textContent = isArray ? '[' : '{';
    });

    setCollapsedNodes(new Set());

    const endTime = performance.now();
    console.log(`⚡ 全部展开耗时: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 操作了 ${hiddenContainers.length} 个容器`);
  }, []);

  const collapseAll = useCallback(() => {
    if (!jsonData) return;

    console.log('\n🔒 全部折叠操作');
    console.log('🚀 直接DOM操作: 批量折叠所有节点');

    const startTime = performance.now();

    // 直接操作所有可见的容器
    const visibleContainers = document.querySelectorAll('[data-children-of]:not(.hidden)');
    const visibleClosingTags = document.querySelectorAll('[data-closing-tag-of]:not(.hidden)');
    const toggleButtons = document.querySelectorAll('[data-node-id] button');
    const nodeLabels = document.querySelectorAll('[data-node-id] .node-label');

    visibleContainers.forEach(container => {
      container.classList.remove('block');
      container.classList.add('hidden');
    });

    visibleClosingTags.forEach(tag => {
      tag.classList.remove('block');
      tag.classList.add('hidden');
    });

    // 更新所有按钮图标为折叠状态
    toggleButtons.forEach(button => {
      button.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>';
    });

    // 更新所有标签为折叠状态
    nodeLabels.forEach(label => {
      const isArray = (label as HTMLElement).dataset.isArray === 'true';
      const itemCount = (label as HTMLElement).dataset.itemCount || '0';
      (label as HTMLElement).textContent = isArray ? `[...] (${itemCount} items)` : `{...} (${itemCount} items)`;
    });

    // 收集所有节点ID用于状态同步
    const allCollapsible = new Set<string>();
    const collectAllNodes = (obj: any, nodeId: string) => {
      if (obj === null || typeof obj !== 'object') return;
      const entries = Array.isArray(obj) ? obj.map((item, index) => [index, item]) : Object.entries(obj);
      if (entries.length > 0) {
        allCollapsible.add(nodeId);
        entries.forEach(([key, value]) => {
          const childNodeId = `${nodeId}.${key}`;
          collectAllNodes(value, childNodeId);
        });
      }
    };

    collectAllNodes(jsonData.parsed, 'root');
    setCollapsedNodes(allCollapsible);

    const endTime = performance.now();
    console.log(`⚡ 全部折叠耗时: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 操作了 ${visibleContainers.length} 个容器`);
  }, [jsonData]);

  const copyToClipboard = useCallback(async () => {
    if (!formattedJson) return;

    try {
      await navigator.clipboard.writeText(formattedJson);
      showSuccess('已复制到剪贴板');
    } catch (err) {
      showError('复制失败');
    }
  }, [formattedJson, showSuccess, showError]);

  const downloadJson = useCallback(() => {
    if (!formattedJson) return;

    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('文件下载成功');
  }, [formattedJson, showSuccess]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputJson(content);
    };
    reader.readAsText(file);
  }, []);

  const clearAll = useCallback(() => {
    setInputJson('');
    setFormattedJson('');
    setJsonData(null);
    setCollapsedNodes(new Set());
  }, []);

  // JSON转Java功能
  const convertToJava = useCallback(() => {
    if (!jsonData) {
      showError('请先格式化JSON');
      return;
    }

    try {
      const code = jsonToJava(jsonData.parsed, javaOptions);
      setJavaCode(code);
      setShowJavaModal(true);
      showSuccess('Java代码生成成功');
    } catch (err: any) {
      showError('转换失败', err.message);
    }
  }, [jsonData, javaOptions, showSuccess, showError]);

  const handleJavaCopy = useCallback(() => {
    showSuccess('Java代码已复制到剪贴板');
  }, [showSuccess]);

  // 代码生成函数
  const generateAccessCode = useCallback((nodeId: string, language: 'java' | 'javascript' | 'typescript', framework?: string) => {
    if (!jsonData) return '';
    
    // 解析路径
    const pathSegments = nodeId === 'root' ? [] : nodeId.replace('root.', '').split('.');
    let currentValue = jsonData.parsed;
    
    // 获取目标值
    for (const segment of pathSegments) {
      if (Array.isArray(currentValue)) {
        currentValue = currentValue[parseInt(segment)];
      } else if (currentValue && typeof currentValue === 'object') {
        currentValue = currentValue[segment];
      }
    }
    
    const valueType = currentValue === null ? 'null' : typeof currentValue;
    let code = '';
    
    switch (language) {
      case 'java':
        // 根据不同框架生成代码
        const jsonFramework = framework || selectedJsonFramework;
        let javaType = 'Object';
        if (valueType === 'string') javaType = 'String';
        else if (valueType === 'number') javaType = Number.isInteger(currentValue) ? 'Integer' : 'Double';
        else if (valueType === 'boolean') javaType = 'Boolean';
        else if (Array.isArray(currentValue)) javaType = 'JSONArray';
        else if (valueType === 'object') javaType = 'JSONObject';
        
        // 构建JSON路径
        let jsonPath = '';
        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          if (/^\d+$/.test(segment)) {
            jsonPath += `[${segment}]`;
          } else {
            jsonPath += i === 0 ? segment : `.${segment}`;
          }
        }
        
        switch (jsonFramework) {
          case 'fastjson':
            code = `// FastJSON 解析\n`;
            code += `import com.alibaba.fastjson.JSONObject;\n`;
            code += `import com.alibaba.fastjson.JSONArray;\n\n`;
            code += `String jsonString = "你的JSON字符串";\n`;
            code += `JSONObject jsonObject = JSONObject.parseObject(jsonString);\n\n`;
            
            if (pathSegments.length === 0) {
              code += `JSONObject value = jsonObject;\n`;
            } else {
              let accessCode = 'jsonObject';
              for (const segment of pathSegments) {
                if (/^\d+$/.test(segment)) {
                  accessCode = `${accessCode}.getJSONArray("${pathSegments[pathSegments.indexOf(segment) - 1]}").getJSONObject(${segment})`;
                } else {
                  if (Array.isArray(currentValue)) {
                    accessCode += `.getJSONArray("${segment}")`;
                  } else if (typeof currentValue === 'object') {
                    accessCode += `.getJSONObject("${segment}")`;
                  } else {
                    accessCode += `.get${javaType}("${segment}")`;
                  }
                }
              }
              code += `${javaType} value = ${accessCode};\n`;
            }
            break;
            
          case 'jackson':
            code = `// Jackson 解析\n`;
            code += `import com.fasterxml.jackson.databind.JsonNode;\n`;
            code += `import com.fasterxml.jackson.databind.ObjectMapper;\n\n`;
            code += `String jsonString = "你的JSON字符串";\n`;
            code += `ObjectMapper mapper = new ObjectMapper();\n`;
            code += `JsonNode rootNode = mapper.readTree(jsonString);\n\n`;
            
            let jacksonPath = 'rootNode';
            for (const segment of pathSegments) {
              if (/^\d+$/.test(segment)) {
                jacksonPath += `.get(${segment})`;
              } else {
                jacksonPath += `.get("${segment}")`;
              }
            }
            
            if (valueType === 'string') {
              code += `String value = ${jacksonPath}.asText();\n`;
            } else if (valueType === 'number') {
              code += `${Number.isInteger(currentValue) ? 'int' : 'double'} value = ${jacksonPath}.as${Number.isInteger(currentValue) ? 'Int' : 'Double'}();\n`;
            } else if (valueType === 'boolean') {
              code += `boolean value = ${jacksonPath}.asBoolean();\n`;
            } else {
              code += `JsonNode value = ${jacksonPath};\n`;
            }
            break;
            
          case 'gson':
            code = `// Gson 解析\n`;
            code += `import com.google.gson.JsonObject;\n`;
            code += `import com.google.gson.JsonParser;\n`;
            code += `import com.google.gson.JsonElement;\n\n`;
            code += `String jsonString = "你的JSON字符串";\n`;
            code += `JsonObject jsonObject = JsonParser.parseString(jsonString).getAsJsonObject();\n\n`;
            
            let gsonPath = 'jsonObject';
            for (const segment of pathSegments) {
              if (/^\d+$/.test(segment)) {
                gsonPath = `${gsonPath}.getAsJsonArray().get(${segment})`;
              } else {
                gsonPath += `.get("${segment}")`;
              }
            }
            
            if (valueType === 'string') {
              code += `String value = ${gsonPath}.getAsString();\n`;
            } else if (valueType === 'number') {
              code += `${Number.isInteger(currentValue) ? 'int' : 'double'} value = ${gsonPath}.getAs${Number.isInteger(currentValue) ? 'Int' : 'Double'}();\n`;
            } else if (valueType === 'boolean') {
              code += `boolean value = ${gsonPath}.getAsBoolean();\n`;
            } else {
              code += `JsonElement value = ${gsonPath};\n`;
            }
            break;
        }
        
        // 添加空值检查
        code += `\n// 空值检查\nif (value != null) {\n    System.out.println("值: " + value);\n}`;
        break;
        
      case 'javascript':
        // 直接变量访问
        code = `// 直接变量访问\n`;
        let jsPath = 'jsonData';
        for (const segment of pathSegments) {
          if (/^\d+$/.test(segment)) {
            jsPath += `[${segment}]`;
          } else {
            jsPath += `.${segment}`;
          }
        }
        code += `const value = ${jsPath};\n\n`;
        
        // 可选链访问
        code += `// 可选链安全访问\nconst safeValue = jsonData`;
        for (const segment of pathSegments) {
          if (/^\d+$/.test(segment)) {
            code += `?.[${segment}]`;
          } else {
            code += `?.${segment}`;
          }
        }
        code += `;\n\nconsole.log('值:', safeValue);`;
        break;
        
      case 'typescript':
        // 直接变量访问 + 类型
        let tsType = 'unknown';
        if (valueType === 'string') tsType = 'string';
        else if (valueType === 'number') tsType = 'number';
        else if (valueType === 'boolean') tsType = 'boolean';
        else if (Array.isArray(currentValue)) tsType = 'any[]';
        else if (valueType === 'object') tsType = 'object';
        
        code = `// 直接变量访问（带类型）\n`;
        let tsPath = 'jsonData';
        for (const segment of pathSegments) {
          if (/^\d+$/.test(segment)) {
            tsPath += `[${segment}]`;
          } else {
            tsPath += `.${segment}`;
          }
        }
        code += `const value: ${tsType} = ${tsPath};\n\n`;
        
        // 可选链访问
        code += `// 可选链安全访问\nconst safeValue: ${tsType} | undefined = jsonData`;
        for (const segment of pathSegments) {
          if (/^\d+$/.test(segment)) {
            code += `?.[${segment}]`;
          } else {
            code += `?.${segment}`;
          }
        }
        code += `;\n\nconsole.log('值:', safeValue);`;
        break;
    }
    
    return code;
  }, [jsonData, selectedJsonFramework]);

  // 处理节点点击，生成访问代码
  const handleNodeClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!jsonData) return;
    
    // 显示语言选择菜单
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-48';
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 5}px`;
    
    const languages = [
      { 
        key: 'java', 
        name: 'Java', 
        icon: '☕',
        frameworks: [
          { key: 'jackson', name: 'Jackson' },
          { key: 'fastjson', name: 'FastJSON' },
          { key: 'gson', name: 'Gson' }
        ]
      },
      { key: 'javascript', name: 'JavaScript', icon: '🟨' },
      { key: 'typescript', name: 'TypeScript', icon: '🔷' }
    ];
    
    languages.forEach(lang => {
      if (lang.key === 'java') {
        // Java 显示框架选择
        const javaHeader = document.createElement('div');
        javaHeader.className = 'px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600';
        javaHeader.textContent = `${lang.icon} ${lang.name}`;
        menu.appendChild(javaHeader);
        
        lang.frameworks?.forEach(framework => {
          const button = document.createElement('button');
          button.className = 'block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded';
          button.innerHTML = `${framework.name}`;
          button.onclick = () => {
            const code = generateAccessCode(nodeId, lang.key as any, framework.key);
            const pathStr = nodeId === 'root' ? '根对象' : nodeId.replace('root.', '').split('.').join(' → ');
            
            setAccessCode(code);
            setAccessCodeLanguage(lang.key as any);
            setAccessCodeTitle(`访问路径: ${pathStr} (${lang.name} - ${framework.name})`);
            setShowAccessCodeModal(true);
            
            document.body.removeChild(menu);
          };
          menu.appendChild(button);
        });
      } else {
        // JavaScript 和 TypeScript
        const button = document.createElement('button');
        button.className = 'block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded border-t border-gray-200 dark:border-gray-600';
        button.innerHTML = `${lang.icon} ${lang.name}`;
        button.onclick = () => {
          const code = generateAccessCode(nodeId, lang.key as any);
          const pathStr = nodeId === 'root' ? '根对象' : nodeId.replace('root.', '').split('.').join(' → ');
          
          setAccessCode(code);
          setAccessCodeLanguage(lang.key as any);
          setAccessCodeTitle(`访问路径: ${pathStr} (${lang.name})`);
          setShowAccessCodeModal(true);
          
          document.body.removeChild(menu);
        };
        menu.appendChild(button);
      }
    });
    
    document.body.appendChild(menu);
    
    // 点击其他地方关闭菜单
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }, [jsonData, generateAccessCode]);

  const handleAccessCodeCopy = useCallback(() => {
    showSuccess('访问代码已复制到剪贴板');
  }, [showSuccess]);

  // 🚀 优化：只在jsonData变化时重新构建DOM，折叠状态通过CSS类控制
  const jsonTreeElement = useMemo(() => {
    if (!jsonData) return null;

    console.log(`\n🏗️ 构建JSON树DOM: ${jsonData.totalNodes} 个节点`);
    console.log(`🚀 层级嵌套架构: 真正的DOM层级结构`);

    return (
      <JsonTreeNode
        obj={jsonData.parsed}
        nodeId="root"
        onToggleCollapse={toggleCollapse}
        collapsedNodes={collapsedNodes}
        onNodeClick={handleNodeClick}
        isLastItem={true}
      />
    );
  }, [jsonData, toggleCollapse]); // 移除collapsedNodes依赖

  const renderJsonTree = useCallback(() => {
    if (!jsonTreeElement) return null;

    console.log(`\n👁️ 渲染JSON树: 折叠状态 ${collapsedNodes.size} 个节点`);
    console.log(`🎯 性能优化: DOM结构不变，只更新CSS类`);

    return jsonTreeElement;
  }, [jsonTreeElement, collapsedNodes]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 输入区域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-[#00bba7]">Json格式化</div>
                <div className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                  格式化、验证和可视化JSON数据，支持语法错误检测和层级折叠
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-md hover:scale-[1.02] dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800 dark:text-blue-300 dark:hover:from-blue-900 dark:hover:to-indigo-900 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaUpload className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">上传</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 text-gray-700 hover:from-red-50 hover:to-pink-50 hover:border-red-200 hover:text-red-600 hover:shadow-md hover:scale-[1.02] dark:from-gray-900 dark:to-slate-900 dark:border-gray-700 dark:text-gray-300 dark:hover:from-red-950 dark:hover:to-pink-950 dark:hover:border-red-800 dark:hover:text-red-400 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaRedo className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">清空</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              onDoubleClick={formatJson}
              placeholder="请输入JSON文本..."
              className="min-h-[500px] font-mono text-sm cursor-pointer border-2 border-gray-200 focus:border-[#00bba7] focus:ring-2 focus:ring-[#00bba7]/20 focus:outline-none transition-all duration-200 rounded-lg"
              title="双击自动格式化JSON"
            />
            <div className="mt-4 flex gap-2">
              <Button
                onClick={compressJson}
                variant="outline"
                className="flex-1 border-2 border-[#00bba7] text-[#00bba7] hover:bg-[#00bba7] hover:text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                JSON 压缩
              </Button>
              <Button
                onClick={formatJson}
                disabled={isFormatting}
                className="flex-1 bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isFormatting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    格式化中...
                  </div>
                ) : (
                  '格式化 JSON'
                )}
              </Button>
            </div>

            {/* JSON转Java功能区域 */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON 转 Java</h4>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={javaOptions.useLombok}
                      onChange={(e) => setJavaOptions(prev => ({ ...prev, useLombok: e.target.checked }))}
                      className="mr-2 w-4 h-4 text-[#00bba7] bg-gray-100 border-gray-300 rounded focus:ring-[#00bba7] focus:ring-2 dark:focus:ring-[#00bba7] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                      style={{
                        accentColor: '#00bba7'
                      }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Lombok</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={javaOptions.useCamelCase}
                      onChange={(e) => setJavaOptions(prev => ({ ...prev, useCamelCase: e.target.checked }))}
                      className="mr-2 w-4 h-4 text-[#00bba7] bg-gray-100 border-gray-300 rounded focus:ring-[#00bba7] focus:ring-2 dark:focus:ring-[#00bba7] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                      style={{
                        accentColor: '#00bba7'
                      }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">驼峰命名</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={javaOptions.className}
                  onChange={(e) => setJavaOptions(prev => ({ ...prev, className: e.target.value }))}
                  placeholder="类名"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00bba7] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button
                  onClick={convertToJava}
                  disabled={!jsonData}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FaJava className="w-4 h-4 mr-2" />
                  转Java
                </Button>
              </div>
            </div>


          </CardContent>
        </Card>

        {/* 输出区域 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-[#00bba7] text-lg sm:text-xl">格式化结果</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  disabled={!formattedJson}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:from-green-950 dark:to-emerald-950 dark:border-green-800 dark:text-green-300 dark:hover:from-green-900 dark:hover:to-emerald-900 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaExpand className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">全部展开</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  disabled={!formattedJson}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:from-orange-950 dark:to-amber-950 dark:border-orange-800 dark:text-orange-300 dark:hover:from-orange-900 dark:hover:to-amber-900 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaCompress className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">全部折叠</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!formattedJson}
                  className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-700 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:from-purple-950 dark:to-violet-950 dark:border-purple-800 dark:text-purple-300 dark:hover:from-purple-900 dark:hover:to-violet-900 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaCopy className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">复制</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJson}
                  disabled={!formattedJson}
                  className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-teal-700 hover:from-teal-100 hover:to-cyan-100 hover:border-teal-300 hover:shadow-md hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none dark:from-teal-950 dark:to-cyan-950 dark:border-teal-800 dark:text-teal-300 dark:hover:from-teal-900 dark:hover:to-cyan-900 transition-all duration-200 rounded-lg font-medium px-2.5 py-1.5"
                >
                  <FaDownload className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">下载</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formattedJson ? (
              <>
                <div 
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[400px] max-h-[600px] overflow-y-auto"
                  style={{
                    overflowX: jsonData ? getContainerStyle(jsonData.maxDepth).overflowX : 'auto',
                  }}
                >
                  <div 
                    className="font-mono text-sm" 
                    id="json-tree-container"
                    style={jsonData ? {
                      ...getContainerStyle(jsonData.maxDepth),
                      // 确保容器样式正确应用
                      lineHeight: '1.5',
                    } : {}}
                  >
                    {renderJsonTree()}
                  </div>
                </div>
                {jsonData && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-left">
                    📊 总节点 {jsonData.totalNodes} 个 | 折叠节点 {collapsedNodes.size} 个 | 最大深度 {jsonData.maxDepth} 层
                  </div>
                )}
              </>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                格式化后的JSON将在这里显示
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Java代码弹窗 */}
      <CodeModal
        isOpen={showJavaModal}
        onClose={() => setShowJavaModal(false)}
        title="生成的Java代码"
        code={javaCode}
        language="java"
        onCopy={handleJavaCopy}
        showLanguageSelector={false}
        showLineNumbers={true}
        fileName={`${javaOptions.className}.java`}
      />
      
      {/* 访问代码弹窗 */}
      <CodeModal
        isOpen={showAccessCodeModal}
        onClose={() => setShowAccessCodeModal(false)}
        title={accessCodeTitle}
        code={accessCode}
        language={accessCodeLanguage}
        onCopy={handleAccessCodeCopy}
        showLanguageSelector={false}
        showLineNumbers={true}
        fileName={`access_code.${accessCodeLanguage === 'typescript' ? 'ts' : accessCodeLanguage === 'javascript' ? 'js' : 'java'}`}
      />
    </div>
  );
}