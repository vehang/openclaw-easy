import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '在线工具 - 程序员宝盒',
  description: '提供丰富的在线工具，包括开发工具、设计工具、效率工具等，提高您的工作效率。',
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 