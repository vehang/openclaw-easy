/**
 * 通用模态框组件
 * 
 * 包含两个组件：
 * 1. Modal - 基础模态框，可用于任何内容
 * 2. CodeModal - 专业的代码显示模态框，支持语法高亮、多语言、复制等功能
 */
import React, { useEffect, useState } from 'react';
import { Button } from './button';
import { FaTimes, FaCopy, FaDownload } from 'react-icons/fa';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* 背景遮罩 */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* 模态框内容 */}
                <div className={`inline-block w-full ${sizeClasses[size]} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl dark:bg-gray-800`}>
                    {/* 头部 */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <FaTimes className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* 内容 */}
                    <div className="mt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 语言配置
const LANGUAGE_CONFIG = {
    java: { name: 'Java', extension: '.java', color: '#f89820' },
    javascript: { name: 'JavaScript', extension: '.js', color: '#f7df1e' },
    typescript: { name: 'TypeScript', extension: '.ts', color: '#3178c6' },
    python: { name: 'Python', extension: '.py', color: '#3776ab' },
    json: { name: 'JSON', extension: '.json', color: '#000000' },
    xml: { name: 'XML', extension: '.xml', color: '#e34c26' },
    yaml: { name: 'YAML', extension: '.yml', color: '#cb171e' },
    sql: { name: 'SQL', extension: '.sql', color: '#336791' },
    css: { name: 'CSS', extension: '.css', color: '#1572b6' },
    html: { name: 'HTML', extension: '.html', color: '#e34c26' },
    go: { name: 'Go', extension: '.go', color: '#00add8' },
    rust: { name: 'Rust', extension: '.rs', color: '#000000' },
    php: { name: 'PHP', extension: '.php', color: '#777bb4' },
    csharp: { name: 'C#', extension: '.cs', color: '#239120' },
    cpp: { name: 'C++', extension: '.cpp', color: '#00599c' },
    c: { name: 'C', extension: '.c', color: '#a8b9cc' },
    kotlin: { name: 'Kotlin', extension: '.kt', color: '#7f52ff' },
    swift: { name: 'Swift', extension: '.swift', color: '#fa7343' },
    dart: { name: 'Dart', extension: '.dart', color: '#0175c2' },
    ruby: { name: 'Ruby', extension: '.rb', color: '#cc342d' },
    shell: { name: 'Shell', extension: '.sh', color: '#89e051' },
    powershell: { name: 'PowerShell', extension: '.ps1', color: '#012456' },
    dockerfile: { name: 'Dockerfile', extension: 'Dockerfile', color: '#2496ed' },
    markdown: { name: 'Markdown', extension: '.md', color: '#083fa1' },
    plaintext: { name: 'Plain Text', extension: '.txt', color: '#6b7280' }
};

interface CodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    code: string;
    language?: keyof typeof LANGUAGE_CONFIG;
    onCopy?: () => void;
    showLanguageSelector?: boolean;
    showLineNumbers?: boolean;
    maxHeight?: string;
    fileName?: string;
}

export function CodeModal({
    isOpen,
    onClose,
    title,
    code,
    language = 'java',
    onCopy,
    showLanguageSelector = false,
    showLineNumbers = true,
    maxHeight = '70vh',
    fileName
}: CodeModalProps) {
    const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof LANGUAGE_CONFIG>(language);
    const [lineCount, setLineCount] = useState(0);

    useEffect(() => {
        setSelectedLanguage(language);
    }, [language]);

    useEffect(() => {
        setLineCount(code.split('\n').length);
    }, [code]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            onCopy?.();
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    const handleDownload = () => {
        const langConfig = LANGUAGE_CONFIG[selectedLanguage];
        const defaultFileName = fileName || `code${langConfig.extension}`;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



    // 语法高亮组件
    const SyntaxHighlightedCode = ({ code, language }: { code: string; language: keyof typeof LANGUAGE_CONFIG }) => {
        const lines = code.split('\n');

        const highlightLine = (line: string, lang: keyof typeof LANGUAGE_CONFIG) => {
            if (lang === 'java') {
                // Java语法高亮规则 - 按优先级排序
                const patterns = [
                    // 注释（最高优先级）
                    { regex: /\/\/.*$/g, className: 'text-gray-500 dark:text-gray-400 italic', priority: 1 },
                    { regex: /\/\*[\s\S]*?\*\//g, className: 'text-gray-500 dark:text-gray-400 italic', priority: 1 },
                    // 字符串
                    { regex: /"[^"]*"/g, className: 'text-red-600 dark:text-red-400', priority: 2 },
                    // 注解
                    { regex: /@\w+/g, className: 'text-orange-600 dark:text-orange-400 font-medium', priority: 3 },
                    // 关键字
                    { regex: /\b(public|private|protected|static|final|class|interface|extends|implements|import|package)\b/g, className: 'text-blue-600 dark:text-blue-400 font-semibold', priority: 4 },
                    // 控制流关键字
                    { regex: /\b(if|else|for|while|do|switch|case|default|break|continue|return|try|catch|finally|throw|throws|new|this|super)\b/g, className: 'text-purple-600 dark:text-purple-400 font-medium', priority: 4 },
                    // 字面量
                    { regex: /\b(null|true|false)\b/g, className: 'text-purple-600 dark:text-purple-400 font-medium', priority: 4 },
                    // 类型
                    { regex: /\b(String|Integer|Double|Boolean|List|Object|void|int|double|boolean|long|float|char|byte|short)\b/g, className: 'text-green-600 dark:text-green-400 font-medium', priority: 5 }
                ];

                const matches: Array<{ start: number; end: number; className: string; text: string; priority: number }> = [];

                // 收集所有匹配
                patterns.forEach(pattern => {
                    let match;
                    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
                    while ((match = regex.exec(line)) !== null) {
                        matches.push({
                            start: match.index,
                            end: match.index + match[0].length,
                            className: pattern.className,
                            text: match[0],
                            priority: pattern.priority
                        });
                    }
                });

                // 按位置排序，位置相同时按优先级排序
                matches.sort((a, b) => {
                    if (a.start !== b.start) return a.start - b.start;
                    return a.priority - b.priority;
                });

                // 去除重叠的匹配（保留优先级高的）
                const filteredMatches: typeof matches = [];
                let lastEnd = 0;

                matches.forEach(match => {
                    if (match.start >= lastEnd) {
                        filteredMatches.push(match);
                        lastEnd = match.end;
                    }
                });

                // 构建tokens
                const tokens: Array<{ text: string; className?: string }> = [];
                lastEnd = 0;

                filteredMatches.forEach(match => {
                    // 添加匹配前的普通文本
                    if (match.start > lastEnd) {
                        tokens.push({ text: line.slice(lastEnd, match.start) });
                    }
                    // 添加高亮的匹配文本
                    tokens.push({ text: match.text, className: match.className });
                    lastEnd = match.end;
                });

                // 添加剩余的普通文本
                if (lastEnd < line.length) {
                    tokens.push({ text: line.slice(lastEnd) });
                }

                return tokens;
            } else if (lang === 'json') {
                // JSON语法高亮
                const tokens: Array<{ text: string; className?: string }> = [];
                const jsonPatterns = [
                    { regex: /"([^"]+)":/g, className: 'text-blue-600 dark:text-blue-400 font-medium' },
                    { regex: /:\s*"([^"]*)"/g, className: 'text-green-600 dark:text-green-400' },
                    { regex: /:\s*(true|false|null)/g, className: 'text-purple-600 dark:text-purple-400 font-medium' },
                    { regex: /:\s*(\d+\.?\d*)/g, className: 'text-orange-600 dark:text-orange-400' }
                ];

                let processedLine = line;
                let hasMatches = false;

                jsonPatterns.forEach(pattern => {
                    if (pattern.regex.test(line)) {
                        hasMatches = true;
                        processedLine = processedLine.replace(pattern.regex, (match) => {
                            return `<HIGHLIGHT:${pattern.className}>${match}</HIGHLIGHT>`;
                        });
                    }
                    pattern.regex.lastIndex = 0;
                });

                if (hasMatches) {
                    const parts = processedLine.split(/(<HIGHLIGHT:[^>]+>.*?<\/HIGHLIGHT>)/);
                    parts.forEach(part => {
                        if (part.startsWith('<HIGHLIGHT:')) {
                            const classMatch = part.match(/<HIGHLIGHT:([^>]+)>(.*?)<\/HIGHLIGHT>/);
                            if (classMatch) {
                                tokens.push({ text: classMatch[2], className: classMatch[1] });
                            }
                        } else if (part) {
                            tokens.push({ text: part });
                        }
                    });
                } else {
                    tokens.push({ text: line });
                }

                return tokens;
            } else {
                // 其他语言或普通文本
                return [{ text: line }];
            }
        };

        return (
            <code className="text-gray-800 dark:text-gray-200">
                {lines.map((line, lineIndex) => {
                    const tokens = highlightLine(line, language);
                    return (
                        <React.Fragment key={lineIndex}>
                            {tokens.map((token, tokenIndex) => (
                                <span key={tokenIndex} className={token.className || 'text-gray-800 dark:text-gray-200'}>
                                    {token.text}
                                </span>
                            ))}
                            {lineIndex < lines.length - 1 && '\n'}
                        </React.Fragment>
                    );
                })}
            </code>
        );
    };

    const renderLineNumbers = () => {
        if (!showLineNumbers) return null;

        return (
            <div className="flex-shrink-0 pr-4 py-4 text-right text-gray-400 dark:text-gray-500 text-sm font-mono select-none border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <pre className="leading-6">
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div key={i + 1}>
                            {i + 1}
                        </div>
                    ))}
                </pre>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
            <div className="space-y-4">
                {/* 工具栏 */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-4">
                        {/* 语言选择器 - 暂时隐藏 */}
                        {false && showLanguageSelector && (
                            <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">语言:</label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value as keyof typeof LANGUAGE_CONFIG)}
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>
                                            {config.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 语言标识 */}
                        <div className="flex items-center space-x-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: LANGUAGE_CONFIG[selectedLanguage].color }}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {LANGUAGE_CONFIG[selectedLanguage].name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {lineCount} 行
                            </span>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            <FaDownload className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="bg-gradient-to-r from-[#00bba7] to-[#00a593] border-[#00bba7] text-white hover:from-[#00a593] hover:to-[#009080] hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                        >
                            <FaCopy className="w-3.5 h-3.5 mr-1.5" />
                            复制代码
                        </Button>
                    </div>
                </div>

                {/* 代码显示区域 */}
                <div className="relative">
                    <div
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                        style={{
                            height: maxHeight,
                            overflow: 'hidden'
                        }}
                    >
                        <div className="flex h-full">
                            {renderLineNumbers()}
                            <div className="flex-1 overflow-auto">
                                <pre className="p-4 text-sm font-mono whitespace-pre h-full">
                                    <SyntaxHighlightedCode code={code} language={selectedLanguage} />
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center space-x-4">
                        <span>字符数: {code.length}</span>
                        <span>行数: {lineCount}</span>
                        <span>语言: {LANGUAGE_CONFIG[selectedLanguage].name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>UTF-8</span>
                        <span>•</span>
                        <span>LF</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}