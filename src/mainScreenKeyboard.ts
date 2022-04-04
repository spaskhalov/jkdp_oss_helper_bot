import { Markup } from 'telegraf';
import { OssHelperContext } from "./OssHelperContext";

export const mainScreenKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🗳 Поучаствовать в нашем ОСС', 'OSS_ACTION')],
  [Markup.button.callback('📄 Скачать шаблоны решений', 'DOWNLOAD_EMPTY_DOCS_ACTION'),
  Markup.button.callback('🪓 Иск против ОСС УК Объект', 'LAW_OSS_ACTION')],
  //[Markup.button.callback('❓ Зачем нам ТСН?', 'WHY_WE_NEED_THAT')]
]);

export async function sendMainMessage(ctx: OssHelperContext) {
  return ctx.reply('Привет! Я бот, созданный ИГС Дискавери Парк. Чем я могу помочь тебе?', mainScreenKeyboard);
}
