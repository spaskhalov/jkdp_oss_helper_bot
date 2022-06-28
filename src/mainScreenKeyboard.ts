import { Markup } from 'telegraf';
import { OssHelperContext } from "./OssHelperContext";

export const mainScreenKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🗳 Найти бланк', 'OSS_ACTION')],
  [Markup.button.callback('📄 Шаблоны ОСС', 'DOWNLOAD_EMPTY_DOCS_ACTION'),
  Markup.button.callback('🪓 Шаблон иск', 'LAW_OSS_ACTION')],
  [Markup.button.callback('ℹ️ Получить инструкцию по голосованию', 'GET_INSTRUCTION')],  
]);

export async function sendMainMessage(ctx: OssHelperContext) {
  return ctx.reply('Привет! Я бот, созданный ИГС Дискавери Парк. Не делись этим ботом с людьми, не состоящими в ИГС. Чем я могу помочь тебе?', mainScreenKeyboard);
}
