"use client";

import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaQrcode, FaComment } from 'react-icons/fa';
import FeedbackModal from './FeedbackModal';
import Image from "next/image";

const FloatingButtons: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 降低显示阈值，从300px改为100px
      if (window.scrollY > 100) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // 初始检查，确保页面加载时就正确显示
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <div className="fixed right-6 bottom-20 flex flex-col space-y-4">
        {showBackToTop && (
          <button 
            onClick={scrollToTop}
            className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="回到顶部"
          >
            <FaArrowUp className="text-gray-600" />
          </button>
        )}
        
        <div className="relative">
          <button 
            onMouseEnter={() => setShowQrCode(true)}
            onMouseLeave={() => setShowQrCode(false)}
            className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="联系作者"
          >
            <FaQrcode className="text-gray-600" />
          </button>
          
          {showQrCode && (
            <div 
              className="absolute right-12 bottom-0 bg-white p-4 rounded-md shadow-lg transition-opacity duration-200"
              onMouseEnter={() => setShowQrCode(true)}
              onMouseLeave={() => setShowQrCode(false)}
            >
              <div className="w-32 h-32 bg-white-200 flex items-center justify-center">
                <Image
                    src="/icons/wx_qrcode.png"
                    alt="微信公众号"
                    width={258}
                    height={258}
                    className="mb-2"
                />
              </div>
              <p className="text-center mt-2 text-sm">扫码加V 备注：宝盒</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="意见反馈"
        >
          <FaComment className="text-gray-600" />
        </button>
      </div>

      {/* 反馈弹窗 */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
};

export default FloatingButtons;