let twilioClient = null;
let aliyunClient = null;

function resolveSpugEndpoint() {
  const { SPUG_SMS_ENDPOINT, SPUG_SMS_BASE_URL, SPUG_SMS_PATH } = process.env;
  if (SPUG_SMS_ENDPOINT) {
    return SPUG_SMS_ENDPOINT;
  }
  if (SPUG_SMS_BASE_URL && SPUG_SMS_PATH) {
    try {
      const url = new URL(SPUG_SMS_PATH, SPUG_SMS_BASE_URL);
      return url.toString();
    } catch (err) {
      console.warn('[SMS] 无法解析 SPUG URL：', err.message);
    }
  }
  return null;
}

function isSpugConfigured() {
  if (getProvider() !== 'spug') {
    return false;
  }
  return Boolean(process.env.SPUG_SMS_TOKEN && resolveSpugEndpoint());
}

function getProvider() {
  return (process.env.SMS_PROVIDER || '').toLowerCase();
}

function getTwilioClient() {
  if (getProvider() !== 'twilio') {
    return null;
  }
  const { SMS_TWILIO_ACCOUNT_SID, SMS_TWILIO_AUTH_TOKEN } = process.env;
  if (!SMS_TWILIO_ACCOUNT_SID || !SMS_TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    twilioClient = twilio(SMS_TWILIO_ACCOUNT_SID, SMS_TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

function getAliyunClient() {
  if (getProvider() !== 'aliyun') {
    return null;
  }
  const { SMS_ALIYUN_ACCESS_KEY_ID, SMS_ALIYUN_ACCESS_KEY_SECRET } = process.env;
  if (!SMS_ALIYUN_ACCESS_KEY_ID || !SMS_ALIYUN_ACCESS_KEY_SECRET) {
    return null;
  }
  if (!aliyunClient) {
    // eslint-disable-next-line global-require
    const Core = require('@alicloud/pop-core');
    aliyunClient = new Core({
      accessKeyId: SMS_ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: SMS_ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25'
    });
  }
  return aliyunClient;
}

function isSmsConfigured() {
  return Boolean(getTwilioClient() || getAliyunClient() || isSpugConfigured());
}

function formatTemplate(template, data) {
  return Object.keys(data).reduce((acc, key) => acc.replace(new RegExp(`{${key}}`, 'g'), data[key]), template);
}

async function sendSpugSms({ phone, code, ttlMinutes }) {
  if (!isSpugConfigured()) {
    throw new Error('Spug SMS 未配置完整');
  }

  const endpoint = resolveSpugEndpoint();
  const {
    SPUG_SMS_TOKEN,
    SPUG_SMS_AUTH_SCHEME = 'Token',
    SPUG_SMS_CHANNEL = 'SMS',
    SPUG_SMS_TEMPLATE_ID,
    SPUG_SMS_MESSAGE_TEMPLATE = '您的验证码是 {code}，{ttl} 分钟内有效，请勿泄露。',
    SPUG_SMS_TIMEOUT_MS = 8000,
    SPUG_SMS_HEADERS_JSON
  } = process.env;

  const headers = {
    'Content-Type': 'application/json'
  };

  if (SPUG_SMS_TOKEN) {
    headers.Authorization = `${SPUG_SMS_AUTH_SCHEME || 'Token'} ${SPUG_SMS_TOKEN}`.trim();
  }

  if (SPUG_SMS_HEADERS_JSON) {
    try {
      Object.assign(headers, JSON.parse(SPUG_SMS_HEADERS_JSON));
    } catch (err) {
      console.warn('[SMS] 解析 SPUG_SMS_HEADERS_JSON 失败：', err.message);
    }
  }

  const payload = {
    channel: SPUG_SMS_CHANNEL || 'SMS',
    receivers: [phone]
  };

  if (SPUG_SMS_TEMPLATE_ID) {
    payload.template_id = SPUG_SMS_TEMPLATE_ID;
    payload.params = { code, ttl: ttlMinutes };
  } else {
    payload.content = formatTemplate(SPUG_SMS_MESSAGE_TEMPLATE, { code, ttl: ttlMinutes });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(SPUG_SMS_TIMEOUT_MS) || 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spug SMS 接口异常：${response.status} ${text}`);
    }
  } finally {
    clearTimeout(timeout);
  }

  return { provider: 'spug' };
}

async function sendSmsVerification({ phone, code, ttlMinutes }) {
  const provider = getProvider();
  if (provider === 'twilio') {
    const client = getTwilioClient();
    if (!client || !process.env.SMS_TWILIO_FROM) {
      throw new Error('Twilio SMS 未配置完整');
    }
    await client.messages.create({
      to: phone,
      from: process.env.SMS_TWILIO_FROM,
      body: `【HP Studio】验证码 ${code}，${ttlMinutes} 分钟内有效，请勿泄露。`
    });
    return { provider: 'twilio' };
  }

  if (provider === 'aliyun') {
    const client = getAliyunClient();
    if (!client || !process.env.SMS_ALIYUN_SIGN_NAME || !process.env.SMS_ALIYUN_TEMPLATE_CODE) {
      throw new Error('阿里云短信未配置完整');
    }
    const params = {
      RegionId: process.env.SMS_ALIYUN_REGION_ID || 'cn-hangzhou',
      PhoneNumbers: phone,
      SignName: process.env.SMS_ALIYUN_SIGN_NAME,
      TemplateCode: process.env.SMS_ALIYUN_TEMPLATE_CODE,
      TemplateParam: JSON.stringify({ code, ttl: ttlMinutes })
    };
    await client.request('SendSms', params, { method: 'POST' });
    return { provider: 'aliyun' };
  }

  if (provider === 'spug') {
    return sendSpugSms({ phone, code, ttlMinutes });
  }

  console.info(`[SMS MOCK] 向 ${phone} 发送验证码 ${code}`);
  return { provider: 'mock', previewCode: code };
}

module.exports = {
  sendSmsVerification,
  isSmsConfigured
};
