# MapBD Telegram Mini App — প্রকাশ করার প্রস্তুত প্যাকেজ

এই প্রজেক্টটি Node.js + Express + Vite + React দিয়ে তৈরি। Telegram Mini App হিসেবে চালাতে হলে public HTTPS URL দরকার।

## সবচেয়ে সহজ পদ্ধতি: Render

1. Render.com-এ একটি account খুলুন।
2. GitHub-এ এই project upload করুন (অথবা Render-এর Git repository ব্যবহার করুন)।
3. **New → Web Service** নির্বাচন করুন।
4. Repository নির্বাচন করুন।
5. Environment হিসেবে **Docker** রাখুন। এই project-এর `Dockerfile` নিজে থেকেই build করবে।
6. Deploy করুন। Deploy শেষ হলে Render একটি `https://....onrender.com` URL দেবে।
7. Telegram BotFather-এ গিয়ে আপনার bot-এর **Menu Button / Web App**-এ ওই HTTPS URL বসান।
8. Telegram থেকে bot খুলে Menu/Web App চাপলে অ্যাপটি চালু হবে।

## Bot token

Production-এ Telegram initData যাচাই করতে `TELEGRAM_BOT_TOKEN` environment variable-এ আপনার bot token দিন। Bot token কখনও frontend code-এ রাখবেন না।

## গুরুত্বপূর্ণ

বর্তমান server-এর data store in-memory/JSON ভিত্তিক; hosting restart হলে runtime data হারাতে পারে। স্থায়ী user/design/trip data দরকার হলে পরে PostgreSQL/SQLite persistent storage যোগ করা উচিত।
