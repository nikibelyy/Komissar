from telegram import (
    Update,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

import os
import traceback
import requests
import time
import sys

BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_CHAT_ID = int(os.environ.get("ADMIN_CHAT_ID", "0"))

if not BOT_TOKEN or ADMIN_CHAT_ID == 0:
    print("❌ Установи BOT_TOKEN и ADMIN_CHAT_ID в переменные окружения")
    exit(1)

def notify_admin(text: str):
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": ADMIN_CHAT_ID,
            "text": text,
            "parse_mode": "HTML"
        }
        requests.post(url, data=payload)
    except Exception:
        print("⚠️ Не удалось отправить сообщение администратору")
        traceback.print_exc()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "Федеральная служба аварийных комиссаров 89100401116!\n\n"
        "Для вызова аварийного комиссара сначала отправьте свой номер телефона."
    )
    button_phone = KeyboardButton(text="Отправить номер телефона", request_contact=True)
    keyboard = ReplyKeyboardMarkup([[button_phone]], resize_keyboard=True, one_time_keyboard=True)
    await update.message.reply_text(text, reply_markup=keyboard)

async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    user_phone = contact.phone_number
    user_name = update.effective_user.full_name
    msg = f"📞 Новый вызов:\nИмя: {user_name}\nТелефон: {user_phone}"
    await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=msg)
    await update.message.reply_text(
        f"Номер {user_phone} получен.\n\n"
        "Теперь нажмите кнопку «Отправить геолокацию» в меню ниже.",
        reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton(text="Отправить геолокацию", request_location=True)]],
            resize_keyboard=True,
            one_time_keyboard=True
        )
    )

async def location_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    loc = update.message.location
    latitude = loc.latitude
    longitude = loc.longitude
    user_name = update.effective_user.full_name
    msg = (
        f"📍 Геолокация от {user_name}:\n"
        f"Широта: {latitude}\n"
        f"Долгота: {longitude}\n"
        f"https://maps.google.com/?q={latitude},{longitude}"
    )
    await context.bot.send_message(chat_id=ADMIN_CHAT_ID, text=msg)
    await update.message.reply_text(
        "Геолокация получена. В течение 3 минут с Вами свяжется ближайший экипаж!",
        reply_markup=ReplyKeyboardRemove()
    )

def main():
    try:
        print("🚀 Бот запускается...")
        notify_admin("✅ <b>Бот запущен и работает</b>")

        app_bot = ApplicationBuilder().token(BOT_TOKEN).build()
        app_bot.add_handler(CommandHandler("start", start))
        app_bot.add_handler(MessageHandler(filters.CONTACT, contact_handler))
        app_bot.add_handler(MessageHandler(filters.LOCATION, location_handler))

        app_bot.run_polling()
    except Exception:
        print("❌ Бот упал!")
        error_text = traceback.format_exc()
        print(error_text)
        notify_admin(f"❌ <b>Бот упал с ошибкой:</b>\n<pre>{error_text}</pre>")
        print("🔁 Перезапуск через 5 секунд...")
        time.sleep(5)
        os.execv(sys.executable, ['python'] + sys.argv)

if __name__ == "__main__":
    main()
