const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// اطلاعات پنل پیامکی (از متغیرهای محیطی)
const SMS_CONFIG = {
  apiKey: process.env.SMS_API_KEY,
  lineNumber: process.env.SMS_LINE_NUMBER,
  baseURL: process.env.SMS_BASE_URL || 'https://api.sms.ir/v1'
};

// ذخیره موقت کدهای تأیید و زمان آخرین ارسال
const verificationCodes = new Map();
const lastSentTime = new Map(); // برای ذخیره زمان آخرین ارسال کد برای هر شماره

// تابع تولید کد تصادفی
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// تابع ارسال SMS از طریق پنل پیامکی
async function sendSMS(phoneNumber, message) {
  try {
    // در اینجا باید از API پنل پیامکی خود استفاده کنید
    // این یک نمونه برای SMS.ir است
    
    const response = await fetch(`${SMS_CONFIG.baseURL}/send/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SMS_CONFIG.apiKey
      },
      body: JSON.stringify({
        mobile: phoneNumber,
        templateId: 100000, // ID قالب پیامک شما
        parameters: [{
          name: 'CODE',
          value: message.match(/\d{6}/)[0] // استخراج کد از پیام
        }]
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('خطا در ارسال پیامک:', error);
    throw new Error('ارسال پیامک ناموفق بود');
  }
}

// درخواست ارسال کد تأیید
app.post('/api/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل معتبر نیست'
      });
    }
    
    // بررسی زمان آخرین ارسال کد برای این شماره
    const lastSent = lastSentTime.get(phoneNumber);
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 دقیقه به میلی‌ثانیه
    
    if (lastSent && (now - lastSent) < FIVE_MINUTES) {
      const remainingTime = Math.ceil((FIVE_MINUTES - (now - lastSent)) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      
      return res.status(429).json({
        success: false,
        message: `لطفاً ${minutes} دقیقه و ${seconds} ثانیه دیگر مجدداً تلاش کنید`,
        retryAfter: remainingTime
      });
    }
    
    // تولید کد تأیید
    const code = generateVerificationCode();
    const message = `کد تأیید شما: ${code}\nاین کد تا 5 دقیقه معتبر است`;
    
    // در محیط واقعی این خط باید فعال شود
    if (process.env.NODE_ENV === 'production') {
      await sendSMS(phoneNumber, message);
    } else {
      // در محیط توسعه، کد را در کنسول نمایش می‌دهیم
      console.log(`کد تأیید برای ${phoneNumber}: ${code}`);
    }
    
    // ذخیره کد با تاریخ انقضا (5 دقیقه)
    verificationCodes.set(phoneNumber, {
      code,
      expires: now + FIVE_MINUTES
    });
    
    // ذخیره زمان آخرین ارسال
    lastSentTime.set(phoneNumber, now);
    
    // برنامه‌ریزی برای پاک کردن زمان آخرین ارسال پس از 5 دقیقه
    setTimeout(() => {
      lastSentTime.delete(phoneNumber);
    }, FIVE_MINUTES);
    
    res.json({
      success: true,
      message: 'کد تأیید ارسال شد',
      // در محیط توسعه کد را برمی‌گردانیم
      ...(process.env.NODE_ENV !== 'production' && { debugCode: code })
    });
  } catch (error) {
    console.error('خطا در ارسال کد:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در ارسال کد تأیید'
    });
  }
});

// درخواست بررسی کد تأیید
app.post('/api/verify-code', (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل و کد تأیید الزامی است'
      });
    }
    
    const storedData = verificationCodes.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'کد تأیید برای این شماره یافت نشد'
      });
    }
    
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'کد تأیید منقضی شده است'
      });
    }
    
    if (storedData.code !== code) {
      // افزایش شمارش تلاش‌های ناموفق
      const attempts = storedData.attempts || 0;
      if (attempts >= 4) {
        verificationCodes.delete(phoneNumber);
        return res.status(400).json({
          success: false,
          message: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً کد جدیدی دریافت کنید.'
        });
      }
      
      verificationCodes.set(phoneNumber, {
        ...storedData,
        attempts: attempts + 1
      });
      
      return res.status(400).json({
        success: false,
        message: `کد تأیید نامعتبر است. شما ${attempts + 1} از 5 تلاش مجاز را استفاده کرده‌اید`
      });
    }
    
    // کد صحیح است
    verificationCodes.delete(phoneNumber);
    
    res.json({
      success: true,
      message: 'احراز هویت موفقیت‌آمیز بود',
      token: 'generated-jwt-token-here' // در عمل باید یک JWT واقعی تولید کنید
    });
  } catch (error) {
    console.error('خطا در تأیید کد:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در تأیید کد'
    });
  }
});

// route برای بررسی زمان باقیمانده تا ارسال مجدد کد
app.post('/api/check-cooldown', (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل معتبر نیست'
      });
    }
    
    const lastSent = lastSentTime.get(phoneNumber);
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    
    if (!lastSent) {
      return res.json({
        success: true,
        canSend: true,
        remainingTime: 0
      });
    }
    
    const elapsed = now - lastSent;
    const remaining = Math.max(0, FIVE_MINUTES - elapsed);
    
    res.json({
      success: true,
      canSend: remaining === 0,
      remainingTime: Math.ceil(remaining / 1000) // زمان باقیمانده به ثانیه
    });
  } catch (error) {
    console.error('خطا در بررسی زمان:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور در بررسی زمان'
    });
  }
});

// شروع سرور
app.listen(PORT, () => {
  console.log(`سرور در حال اجرا در پورت ${PORT}`);
});