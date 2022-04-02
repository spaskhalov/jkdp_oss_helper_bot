/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Markup, Scenes, session, Telegraf } from 'telegraf'
import { OssDecisionPaperWizard } from './ossDecisionPaperWizard'
import { OssHelperContext } from "./OssHelperContext"

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

// Handler factories
const { leave } = Scenes.Stage

const bot = new Telegraf<OssHelperContext>(token)

const mainScreenKeyboard = Markup.inlineKeyboard([  
   Markup.button.callback('🗳 Поучаствовать в нашем ОСС', 'OSS_ACTION'),
   Markup.button.callback('🪓 Иск против ОСС УК Объект', 'LAW_OSS_ACTION')   
])

bot.start((ctx) => 
{
  ctx.reply('Привет! Я бот, созданный ИГС Дискавери Парк. Чем я могу помочь тебе?' , mainScreenKeyboard)     
})

const stage = new Scenes.Stage<OssHelperContext>([OssDecisionPaperWizard], {
  //ttl: 0,
})
bot.use(session())
bot.use(stage.middleware())

// bot.hears('🔍 oss', (ctx) => ctx.scene.enter('ossDecisionPaperWizard'))
// bot.command('echo', (ctx) => ctx.reply('idi nafig'))
bot.action('OSS_ACTION', (ctx) => ctx.scene.enter('OssDecisionPaperWizard'))
//bot.action('LAW_OSS_ACTION', (ctx) => ctx.scene.enter('ossDecisionPaperWizard'))

bot.on('message', (ctx) => ctx.reply('Чем я могу помочь?', mainScreenKeyboard))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))