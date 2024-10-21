import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wifi, X } from 'lucide-react';
import CurrentDateTime from './CurrentDateTime';
import Loading from './Loading';
import './CardReading.css';

const CardReading = ({ formData, attendanceData, onCancel }) => {
  const [isCardDetected, setIsCardDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // API呼び出しの共通関数
  const callApi = async (url, data) => {
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('APIエラー:', error);
    }
    setIsLoading(false);
  };

  const handleCardDetection = useCallback(async () => {
    setIsCardDetected(true);

    const test_id = 'test'; // 実際のカードIDをここで取得

    if (formData) {
      const { fullName, attribute, description } = formData;
      await callApi('https://fast-gnni-shizuokauniversity-8f675ed2.koyeb.app/register_id', {
        id: test_id, name: fullName, attribute, description
      });
    } else if (attendanceData) {
      await callApi('https://fast-gnni-shizuokauniversity-8f675ed2.koyeb.app/register_attendance', {
        id: test_id, next_state: attendanceData
      });
    } else {
      alert('No data available');
    }

    setTimeout(() => {
      setIsCardDetected(false);
    }, 3000);
  }, [formData, attendanceData]);

  useEffect(() => {
    const cardDetectionTimeout = setTimeout(() => {
      handleCardDetection();
    }, 3000);

    return () => clearTimeout(cardDetectionTimeout);
  }, [handleCardDetection]);

  if (isLoading) {
      return <Loading />;
  }

  return (
    <div className="CardReading">
      <header className="CardReading-header">
        <CurrentDateTime />
        <motion.div
          className={`icon-container ${isCardDetected ? 'card-detected' : ''}`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Wifi className="wifi-icon" />
        </motion.div>
        <p className="touch-message-jp">カード・デバイスをかざしてください</p>
        <p className="touch-message-en">Please tap your card or device</p>

        <button className="cancel-button" onClick={onCancel}>
          <X className="cancel-icon" />
          <span className="cancel-text">中断<br />Cancel</span>
        </button>
      </header>
    </div>
  );
};

export default CardReading;