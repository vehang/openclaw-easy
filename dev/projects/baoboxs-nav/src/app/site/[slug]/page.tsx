import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import SiteDetailPage from '@/components/SiteDetailPage';
import { fetchSiteDetail } from '@/services/api';

interface SiteDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 生成页面元数据
export async function generateMetadata({ params }: SiteDetailPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const siteDetail = await fetchSiteDetail(resolvedParams.slug);
    
    return {
      title: `${siteDetail.title} | 程序员宝盒 - 开发者常用导航大全 - 一站式效率提升平台`,
      description: siteDetail.desc || `了解${siteDetail.title}的详细信息，程序员宝盒为您提供优质的开发者工具导航服务`,
      keywords: `${siteDetail.title}, 开发者工具, 程序员宝盒, 效率工具, 导航大全`,
      openGraph: {
        title: `${siteDetail.title} | 程序员宝盒`,
        description: siteDetail.desc || `了解${siteDetail.title}的详细信息`,
        images: siteDetail.img ? [siteDetail.img] : [],
        type: 'website',
        siteName: '程序员宝盒',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${siteDetail.title} | 程序员宝盒`,
        description: siteDetail.desc || `了解${siteDetail.title}的详细信息`,
        images: siteDetail.img ? [siteDetail.img] : [],
      },
    };
  } catch (error) {
    return {
      title: '站点详情 | 程序员宝盒 - 开发者常用导航大全 - 一站式效率提升平台',
      description: '程序员宝盒为您提供优质的开发者工具导航服务，一站式效率提升平台',
    };
  }
}

// 服务端渲染的页面组件
export default async function Page({ params }: SiteDetailPageProps) {
  try {
    // 在服务端获取站点详情数据
    const resolvedParams = await params;
    const siteDetail = await fetchSiteDetail(resolvedParams.slug);

    // 从请求头获取当前页面 URL
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host') || 'localhost:3000';
    const currentUrl = `${protocol}://${host}/site/${resolvedParams.slug}`;

    return <SiteDetailPage siteDetail={siteDetail} currentUrl={currentUrl} />;
  } catch (error) {
    console.error('获取站点详情失败:', error);
    notFound();
  }
}
