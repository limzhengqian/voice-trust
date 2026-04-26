const FAQ = [
  // --- Account opening / general ---
  {
    keywords: ['how long', 'how much time', 'minutes', 'takes', 'duration', 'process time'],
    answer: "The whole account opening process takes about 3 to 5 minutes. Just follow the steps: enter your name, verify your phone, scan your MyKad, upload proof of address, and take a selfie. We'll have your account ready right after!"
  },
  {
    keywords: ['who can', 'eligible', 'qualify', 'requirement', 'age', 'malaysian', 'foreigner', 'citizen'],
    answer: "You must be a Malaysian citizen aged 18 or above with a valid MyKad (NRIC) to open an account. Permanent residents and foreigners are currently not supported through this flow."
  },
  {
    keywords: ['safe', 'secure', 'privacy', 'data', 'store', 'information'],
    answer: "Your data is fully encrypted and stored securely in compliance with Bank Negara Malaysia and PDPA regulations. We only collect what's needed for identity verification and do not share your information with third parties."
  },
  {
    keywords: ['failed', 'error', 'problem', 'issue', 'not working', 'stuck', 'try again', 'retry'],
    answer: "Sorry you're having trouble! Try refreshing the page and starting again. Make sure you have a stable internet connection. If the problem continues, please contact our support team at support@tng.com."
  },

  // --- Name step ---
  {
    keywords: ['name', 'nric name', 'full name', 'type name', 'spell name', 'wrong name'],
    answer: "Please enter your full name exactly as it appears on your MyKad — including any hyphens or special characters. Use capital letters. If you made a mistake, just clear the field and retype it."
  },
  {
    keywords: ['microphone', 'voice input', 'speak name', 'say name', 'voice capture'],
    answer: "You can tap the microphone button and speak your full name clearly. Make sure your device microphone is allowed in your browser settings. If voice capture doesn't work, just type your name manually."
  },

  // --- Phone / OTP step ---
  {
    keywords: ['otp', 'one time', 'code', 'sms', 'not received', 'no sms', 'resend', 'code expired'],
    answer: "If you haven't received the OTP, wait 30 seconds then tap 'Send Code' again. Make sure your phone number includes the country code (e.g. +601X for Malaysia). Check that your phone has signal and SMS is not blocked."
  },
  {
    keywords: ['phone number', 'wrong number', 'change number', 'number format', 'invalid phone'],
    answer: "Enter your phone number with the country code — for Malaysia, use +60 followed by your number (e.g. +60123456789). Tap 'Change Number' if you entered the wrong one before requesting a new OTP."
  },

  // --- IC / MyKad scan step ---
  {
    keywords: ['ic', 'mykad', 'identity card', 'scan', 'photo ic', 'take photo', 'camera', 'blur', 'not clear', 'scan fail'],
    answer: "Lay your MyKad flat on a dark surface with good lighting. Hold your phone steady directly above it. Make sure all four corners are visible and the text is sharp and readable. Avoid glare from lights."
  },
  {
    keywords: ['upload ic', 'gallery', 'existing photo', 'photo library', 'file'],
    answer: "You can either take a new photo with your camera or upload an existing photo from your gallery. Make sure the photo is clear, well-lit, and shows the front of your MyKad with all text visible."
  },
  {
    keywords: ['ic number', 'nric number', 'not detected', 'not read', 'wrong ic', 'extraction fail'],
    answer: "If your IC number wasn't detected, try retaking the photo with better lighting and make sure the card is fully in frame. Avoid shadows across the IC number. The number format should be XXXXXX-XX-XXXX."
  },
  {
    keywords: ['expired ic', 'old ic', 'damaged ic', 'torn', 'faded'],
    answer: "Please use a valid, undamaged MyKad. If your IC is expired or damaged, visit your nearest JPN (National Registration Department) office to get a replacement before opening an account."
  },

  // --- Wrong document content (photo instead of document) ---
  {
    keywords: ['photo', 'picture', 'image', 'selfie', 'no text', 'wrong document', 'wrong picture', 'uploaded photo'],
    answer: "It looks like you uploaded a regular photo instead of a document. The proof of address must be a document that shows your name and address — like a bank statement, utility bill, or telco bill. Please upload one of those instead."
  },

  // --- Wrong file type ---
  {
    keywords: ['why rejected', 'file rejected', 'not accepted', 'wrong file', 'wrong format', 'wrong type', 'cannot upload', 'invalid file'],
    answer: "Your file was rejected because it is not in a supported format. We only accept JPG, PNG, and PDF files for proof of address. You can download a PDF e-statement from your bank or telco app, or take a clear photo of your physical bill and upload it as a JPG."
  },

  // --- POA / proof of address ---
  {
    keywords: ['no bank statement', "don't have bank statement", 'no statement', 'without bank statement', 'dont have bank'],
    answer: "No problem! You can use any of these alternatives: utility bill (electricity, water, or gas) not older than 3 months, telco/internet bill, credit card statement, or any official government-issued letter showing your address."
  },
  {
    keywords: ['utility bill', 'electricity bill', 'water bill', 'tnb', 'syabas', 'indah water', 'gas bill'],
    answer: "Yes, utility bills are accepted — TNB, Syabas, Air Selangor, Gas Malaysia, and Indah Water bills. Make sure it is not older than 3 months and clearly shows your name and address."
  },
  {
    keywords: ['telco', 'phone bill', 'maxis', 'celcom', 'digi', 'unifi', 'time', 'internet bill', 'broadband'],
    answer: "Yes! Mobile or broadband bills from Maxis, Celcom, Digi, Unifi, or TIME are accepted. Make sure it shows your full name and address and is not older than 3 months."
  },
  {
    keywords: ['how old', 'older than', '3 months', 'expir', 'valid', 'how recent'],
    answer: "Your document must not be older than 3 months from today. For example, if today is April 2026, your document must be dated January 2026 or later."
  },
  {
    keywords: ['pdf', 'softcopy', 'digital', 'e-statement', 'online statement', 'electronic'],
    answer: "Yes! Digital or e-statements in PDF format are accepted. Download your e-statement from your bank's mobile app or online portal and upload it here."
  },
  {
    keywords: ['renting', 'tenant', 'rental', 'landlord', 'tenancy', 'rent'],
    answer: "If you are renting, use a utility bill registered in your name. If the bill is under your landlord's name, provide a stamped tenancy agreement together with a utility bill as supporting proof."
  },
  {
    keywords: ['credit card', 'credit card statement', 'credit statement'],
    answer: "Yes, a credit card statement showing your name and address is accepted, as long as it is dated within the last 3 months."
  },
  {
    keywords: ['what is poa', 'why poa', 'why proof', 'reason for', 'purpose of address', 'proof of address'],
    answer: "Proof of Address (POA) is required under Bank Negara Malaysia regulations to verify your residential address. This protects you from identity fraud and is a standard requirement for all bank account openings."
  },
  {
    keywords: ['format', 'file type', 'jpg', 'jpeg', 'png', 'what format', 'file size'],
    answer: "You can upload JPG, PNG, or PDF files. Maximum file size is 8MB. Make sure the document is clear and all text — especially your name and address — is fully visible."
  },
  {
    keywords: ['address different', 'wrong address', 'moved', 'new address', 'different address'],
    answer: "Please upload a document that shows your current residential address. If you have recently moved, use the most recent bill or statement that reflects your new address."
  },

  // --- Selfie / face verification ---
  {
    keywords: ['selfie', 'face', 'photo', 'look', 'front camera', 'selfie fail', 'face not match'],
    answer: "For your selfie, look straight at the front camera in a well-lit area. Remove glasses if possible, and make sure your full face is inside the oval guide. Do not cover your face with hair or hands."
  },
  {
    keywords: ['face not match', 'similarity', 'face verification fail', 'verification failed', 'not pass'],
    answer: "Face verification failed because the selfie didn't closely match your MyKad photo. Try again with better lighting, look straight at the camera, and make sure nothing is covering your face. If it keeps failing, contact support."
  },
  {
    keywords: ['glasses', 'spectacles', 'specs', 'sunglasses'],
    answer: "Please remove your glasses when taking the selfie for better face matching accuracy."
  },
  {
    keywords: ['dark', 'lighting', 'bright', 'light', 'shadow'],
    answer: "Make sure your face is well-lit from the front. Avoid backlighting (e.g. a bright window behind you) and shadows across your face. A simple room light in front of you works best."
  },

  // --- General support ---
  {
    keywords: ['help', 'support', 'contact', 'human', 'agent', 'person', 'call'],
    answer: "Our support team is available via: Email: support@tng.com | Phone: 1-800-88-1234 (Mon–Fri, 9am–6pm) | Live chat at tng.com. You can also visit any TNG branch for in-person assistance."
  },
  {
    keywords: ['epf', 'kwsp', 'lhdn', 'income tax', 'government letter', 'jabatan'],
    answer: "Yes! Official government letters or statements showing your name and address — such as LHDN tax notices, EPF/KWSP statements, or letters from any government department — are accepted as proof of address."
  },
];

const DEFAULT_RESPONSE =
  "I'm not sure about that, but I'm here to help! Common questions include: how to scan your IC, what documents are accepted for proof of address, OTP issues, or selfie tips. You can also reach our support team at support@tng.com or call 1-800-88-1234.";

export function getInquiryResponse(question) {
  const q = question.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some(k => q.includes(k))) {
      return faq.answer;
    }
  }
  return DEFAULT_RESPONSE;
}
