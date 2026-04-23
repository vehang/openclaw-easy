'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { getQRCodeUrl } from '@/utils/toolRedirect';
import { getLinkRel } from '@/lib/utils';
import { CollectionItem } from '../types';

interface CollectionCardProps {
  item: CollectionItem;
  isEditMode: boolean;
  onEdit: (item: CollectionItem) => void;
  onDelete: (item: CollectionItem) => void;
  onMoveUp?: (item: CollectionItem) => void;
  onMoveDown?: (item: CollectionItem) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  item,
  isEditMode,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState('');
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 客户端标记
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检测描述文本是否被截断
  useEffect(() => {
    if (!isClient) return;
    const checkIfTruncated = () => {
      const element = descriptionRef.current;
      if (element) {
        setIsDescriptionTruncated(
          element.scrollWidth > element.clientWidth ||
          element.scrollHeight > element.clientHeight
        );
      }
    };

    checkIfTruncated();
    window.addEventListener('resize', checkIfTruncated);

    return () => {
      window.removeEventListener('resize', checkIfTruncated);
    };
  }, [item.msg, isClient]);

  // 默认图标数组
  const defaultIcons = [
    '/icons/default-icon1.png',
    '/icons/default-icon2.png',
    '/icons/default-icon3.png',
    '/icons/default-icon4.png',
    '/icons/default-icon5.png',
  ];

  // 当图片加载失败时，根据 URL 选择一个稳定的默认图标
  const handleImageError = () => {
    // 使用 URL 的 hash 来确保服务端和客户端一致
    const urlHash = item.url ? item.url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;
    const randomIndex = Math.abs(urlHash) % defaultIcons.length;
    setFallbackIcon(defaultIcons[randomIndex]);
    setImageError(true);
  };

  // 获取安全的图片源
  const getSafeImageSrc = () => {
    if (imageError && fallbackIcon) {
      return fallbackIcon;
    }

    if (item.img && typeof item.img === 'string' && item.img.trim()) {
      return item.img.trim();
    }

    if (item.url && typeof item.url === 'string') {
      try {
        const match = item.url.match(/^(https?:\/\/[^/]+)/);
        if (match && match[1]) {
          return match[1] + '/favicon.ico';
        }
      } catch (error) {
        console.error('Error parsing URL for favicon:', error);
      }
    }

    return '/icons/default-icon1.png';
  };

  // 检查是否应该渲染图片
  const shouldRenderImage = () => {
    const src = getSafeImageSrc();
    return src && src.trim() !== '';
  };

  // 更新提示框位置
  useEffect(() => {
    if (isClient && showTooltip && isDescriptionTruncated && cardRef.current) {
      const updatePosition = () => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          // 只有当元素可见且有有效位置时才更新
          if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
            setTooltipPosition({
              top: rect.bottom + 10,
              left: rect.left + rect.width / 2
            });
          } else {
            // 如果元素不可见，隐藏提示框
            setShowTooltip(false);
          }
        }
      };

      // 初始更新位置
      updatePosition();

      // 监听滚动事件，实时更新位置
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [showTooltip, isDescriptionTruncated, isClient]);

  // 处理点击事件，将收藏转换为标准格式并保存
  const handleCollectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 使用新的跳转逻辑
    const { handleToolClick: handleRedirect } = require('@/utils/toolRedirect');

    handleRedirect({
      toolId: item.urlId,
      title: item.title,
      url: item.url,
      desc: item.msg,
      img: item.img,
      source: 'favorite',
      bindId: item.bindId
    }, e);
  };

  // 获取二维码URL
  const getQRCodeURL = useCallback(() => {
    return getQRCodeUrl({
      toolId: item.urlId,
      title: item.title,
      url: item.url,
      desc: item.msg,
      img: item.img,
      source: 'favorite',
      bindId: item.bindId
    });
  }, [item]);

  return (
    <div
      className="relative"
      ref={cardRef}
      onMouseEnter={() => {
        if (!isEditMode) setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
    >
      <a
        href={item.url}
        target="_blank"
        rel={getLinkRel(item.url)}
        className="block p-2 sm:p-3 h-full rounded-lg transition-all duration-200 hover:shadow-xl hover:bg-white group border border-transparent hover:border-gray-100"
        onClick={(e) => {
          if (isEditMode) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          handleCollectionClick(e);
        }}
      >
        <div className="flex">
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 mt-1">
            {shouldRenderImage() ? (
              <Image
                src={getSafeImageSrc()}
                alt={item.title || '收藏图标'}
                fill
                sizes="24px"
                className="rounded object-cover"
                unoptimized
                onError={handleImageError}
              />
            ) : (
              // 默认SVG图标作为占位符
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-2 flex-1 flex flex-col min-w-0">
            <h3 className="font-medium text-xs sm:text-sm text-gray-900 truncate group-hover:text-[#39aba4]">
              {item.customTitle || item.title}
            </h3>
            <p ref={descriptionRef} className="text-xs text-gray-500 line-clamp-1 mt-0.5 leading-tight">{item.customDesc || item.msg || '暂无描述'}</p>
          </div>

          {/* 正常模式下显示二维码按钮 - 只在桌面端显示 */}
          {!isEditMode && (
            <div
              id={`qrcode-btn-${item.urlId}`}
              className="hidden sm:block w-0 group-hover:w-6 flex-shrink-0 overflow-hidden transition-all duration-200 ml-0 group-hover:ml-2 self-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQRCode(!showQRCode);
              }}
              onMouseEnter={() => setShowQRCode(true)}
              onMouseLeave={() => setShowQRCode(false)}
            >
              <div className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </a>

      {/* 编辑模式下的遮罩与按钮：仅在悬停时显示 */}
      {isEditMode && isHovered && (
        <div className="absolute inset-0 z-20 bg-gradient-to-br from-teal-500/25 via-teal-400/15 to-teal-500/25 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="w-full flex items-center justify-center gap-2 px-6 sm:px-8">
            {/* 合并的上移下移按钮 */}
            {(onMoveUp || onMoveDown) && (
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-teal-500/25 shadow-sm ring-1 ring-white/30 backdrop-blur overflow-hidden">
                  {/* 上移区域 */}
                  {onMoveUp && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMoveUp(item);
                      }}
                      disabled={!canMoveUp}
                      className={`absolute top-0 left-0 w-full h-1/2 flex items-center justify-center transition-colors ${
                        canMoveUp
                          ? 'hover:bg-teal-500/35 text-white'
                          : 'bg-gray-500/25 text-gray-400 cursor-not-allowed'
                      }`}
                      title="上移"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {/* 下移区域 */}
                  {onMoveDown && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onMoveDown(item);
                      }}
                      disabled={!canMoveDown}
                      className={`absolute bottom-0 left-0 w-full h-1/2 flex items-center justify-center transition-colors ${
                        canMoveDown
                          ? 'hover:bg-teal-500/35 text-white'
                          : 'bg-gray-500/25 text-gray-400 cursor-not-allowed'
                      }`}
                      title="下移"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 rounded-full bg-teal-500/25 hover:bg-teal-500/35 text-white shadow-sm ring-1 ring-white/30 transition transform hover:scale-105 backdrop-blur"
              title="编辑"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-2 rounded-full bg-teal-500/25 hover:bg-teal-500/35 text-white shadow-sm ring-1 ring-white/30 transition transform hover:scale-105 backdrop-blur"
              title="删除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 描述提示框 - 编辑模式下不显示，仅在正常模式且描述被截断时显示 */}
      {showTooltip && !isEditMode && isDescriptionTruncated && !showQRCode && tooltipPosition.top > 0 && tooltipPosition.left > 0 && (
        <div className="fixed z-[100] p-4 bg-white rounded-lg shadow-xl max-w-xs border border-gray-100" style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translateX(-50%)'
        }}>
          <p className="text-sm text-gray-600">{item.msg || '暂无描述'}</p>
        </div>
      )}

      {/* 二维码弹窗 - 只在桌面端显示 */}
      {showQRCode && (
        <div className="hidden sm:block fixed z-50 p-4 bg-white rounded-lg shadow-xl" style={{
          top: 'auto',
          left: 'auto',
          right: `${window.innerWidth - (document.getElementById(`qrcode-btn-${item.urlId}`)?.getBoundingClientRect().right || 0)}px`,
          bottom: `${window.innerHeight - (document.getElementById(`qrcode-btn-${item.urlId}`)?.getBoundingClientRect().top || 0)}px`
        }}>
          <div className="flex flex-col items-center">
            <QRCodeSVG value={getQRCodeURL()} size={90} />
            <p className="mt-2 text-xs text-gray-600">扫码访问</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionCard;