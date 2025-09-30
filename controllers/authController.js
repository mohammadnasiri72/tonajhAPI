const { connectToDatabase } = require("../config/db");
const userSchema = require("../models/userSchema");
const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

const paternMobile = /^09[0|1|2|3|9][0-9]{8}$/;

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// اطلاعات پنل پیامکی (از متغیرهای محیطی)
const SMS_CONFIG = {
  apiKey: process.env.SMS_API_KEY,
  lineNumber: process.env.SMS_LINE_NUMBER,
  baseURL: process.env.SMS_BASE_URL || 'https://api.sms.ir/v1'
};

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

// ذخیره موقت کدهای تأیید
const verificationCodes = new Map();
const lastSentTime = new Map();

// تابع تولید کد تصادفی
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendOtp = async (req, res) => {
  try {
     const { mobile } = req.body;
     

    // بررسی صحت شماره موبایل
    if (!paternMobile.test(mobile)) {
      return res.status(400).json({
        status: "fail",
        message: "شماره موبایل معتبر نیست",
      });
    }


    // بررسی زمان آخرین ارسال کد برای این شماره
    const lastSent = lastSentTime.get(mobile);
    const now = Date.now();
    const TIME = 2 * 60 * 1000; 

    
    
    if (lastSent && (now - lastSent) < TIME) {
      const remainingTime = Math.ceil((TIME - (now - lastSent)) / 1000);
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
    const message = `کد تأیید شما: ${code}\nاین کد تا 2 دقیقه معتبر است`;

    // در محیط واقعی این خط باید فعال شود
    if (process.env.NODE_ENV === 'production') {
      await sendSMS(mobile, message);
    } else {
      // در محیط توسعه، کد را در کنسول نمایش می‌دهیم
      // console.log(`کد تأیید برای ${mobile}: ${code}`);
    }

    // ذخیره کد با تاریخ انقضا (5 دقیقه)
    verificationCodes.set(mobile, {
      code,
      expires: Date.now() + TIME
    });

     // ذخیره زمان آخرین ارسال
    lastSentTime.set(mobile, now);
    
   res.json({
      success: true,
      message: 'کد تأیید ارسال شد',
      // در محیط توسعه کد را برمی‌گردانیم
      ...(process.env.NODE_ENV !== 'production' && { debugCode: code })
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "خطای سرور",
    });
  }
};

exports.checkMobile = async (req, res) => {
  try {
    const db = await connectToDatabase();
     const { mobile, code } = req.body;

     

    // بررسی صحت شماره موبایل
    if (!paternMobile.test(mobile)) {
      return res.status(400).json({
        status: "fail",
        message: "شماره موبایل معتبر نیست",
      });
    }


    const storedData = verificationCodes.get(mobile);

     if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'کد تأیید برای این شماره یافت نشد'
      });
    }
    
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(mobile);
      return res.status(400).json({
        success: false,
        message: 'کد تأیید منقضی شده است'
      });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'کد تأیید نامعتبر است'
      });
    }

      // کد صحیح است
    verificationCodes.delete(mobile);

    // بررسی وجود کاربر
    const user = await db.collection("users").findOne({
      mobile: mobile,
    });

    if (user) {
      const token = signToken(user._id)
      // کاربر وجود دارد - برای لاگین هدایت شود
      return res.status(200).json({
        status: "login",
        message: "با موفقیت وارد شدید",
        user,
        token,
      });
    } else {
      // کاربر وجود ندارد - برای ثبت‌نام هدایت شود
      return res.status(200).json({
        status: "register",
        message: "لطفا برای ثبت نام مشخصات خود را وارد کنید",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "خطای سرور",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // 1) بررسی وجود شماره موبایل و رمز عبور
    if (!mobile || !password) {
      return res.status(400).json({
        status: "fail",
        message: "لطفا شماره موبایل و رمز عبور را وارد کنید",
      });
    }

    // 2) بررسی وجود کاربر و صحت رمز عبور
    const user = await User.findOne({ mobile }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "شماره موبایل یا رمز عبور اشتباه است",
      });
    }

    // 3) اگر همه چیز درست بود، توکن ایجاد کنید
    const token = signToken(user._id);

    // 4) پاسخ به کلاینت
    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          id: user._id,
          mobile: user.mobile,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "خطای سرور",
    });
  }
};

exports.register = async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "فرمت داده نامعتبره", details: error.details });
  }
  try {
    const db = await connectToDatabase();
    const userData = {
      ...value,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").insertOne(userData);

    // ایجاد توکن
    const token = signToken(userData._id);

    res.status(201).json({
      status: "success",
      message:'ثبت نام شما با موفقیت انجام شد',
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "خطای سرور",
    });
  }
};
