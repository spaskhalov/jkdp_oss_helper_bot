/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Scenes, session, Telegraf } from 'telegraf'
import { sendDecisionPapers } from './commonMessages'
import { sendMainMessage, mainScreenKeyboard } from './mainScreenKeyboard'
import { OssDecisionPaperWizard } from './ossDecisionWizard/ossDecisionPaperWizard'
import { OssHelperContext } from "./OssHelperContext"
import { readLegendData } from "./readLegendData"

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const dataRoot = process.env.DATA_ROOT ?? "./data"
const ossLegend = readLegendData(`${dataRoot}/legend.xlsx`)

// Handler factories
const { leave } = Scenes.Stage

const bot = new Telegraf<OssHelperContext>(token)

bot.start((ctx) => 
{
  sendMainMessage(ctx)     
})

const stage = new Scenes.Stage<OssHelperContext>([OssDecisionPaperWizard], {
  //ttl: 0,
})
bot.use(session())
bot.use((ctx, next) => {
  const now = new Date()
  ctx.ossLegend = ossLegend
  ctx.dataRoot = dataRoot
  return next()
})
bot.use(stage.middleware())

bot.action('OSS_ACTION', (ctx) => ctx.scene.enter('OssDecisionPaperWizard'))
bot.action('DOWNLOAD_EMPTY_DOCS_ACTION',async (ctx) => {
  await ctx.reply('Я отправлю Вам шаблоны. Настоятельно рекомендую поискать именные документы (🗳 Поучаствовать в нашем ОСС).')
  await sendDecisionPapers(ctx, 'шаблона', `${dataRoot}/short/Empty.pdf`, `${dataRoot}/long/Empty.pdf`)  
  await sendMainMessage(ctx)
})
bot.action('LAW_OSS_ACTION',async (ctx) => {
  await ctx.reply('Вот шаблон заявления о присоединение к иску против ОСС УК Объект.')
  await ctx.replyWithDocument({ source: `${dataRoot}/isk_oss.pdf`})
  await sendMainMessage(ctx)
})

bot.action('WHY_WE_NEED_THAT',async (ctx) => {
  await ctx.reply('На этот вопрос ответит мой друг Александр 😅')
  await ctx.replyWithAudio({source: `{${dataRoot}/about_oss.mp3`})  
  await sendMainMessage(ctx)
})
bot.on('message', (ctx) => ctx.reply('Чем я могу помочь?', mainScreenKeyboard))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

