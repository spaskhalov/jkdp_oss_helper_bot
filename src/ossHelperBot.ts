/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Scenes, session, Telegraf } from 'telegraf'
import { sendDecisionPapers } from './commonMessages'
import { sendMainMessage, mainScreenKeyboard } from './mainScreenKeyboard'
import { OssDecisionPaperWizard } from './ossDecisionWizard/ossDecisionPaperWizard'
import { OssHelperContext } from "./OssHelperContext"
import { readLegendData } from "./readLegendData"

const ossLegend = readLegendData()
console.log(`Readed ${ossLegend.data.length} fields from legend`)

const token = process.env.BOT_TOKEN
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

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
  return next()
})
bot.use(stage.middleware())

bot.action('OSS_ACTION', (ctx) => ctx.scene.enter('OssDecisionPaperWizard'))
bot.action('DOWNLOAD_EMPTY_DOCS_ACTION',async (ctx) => {
  await ctx.reply('Я отправлю Вам шаблоны. Настоятельно рекомендую поискать именные документы (🗳 Поучаствовать в нашем ОСС).')
  await sendDecisionPapers(ctx, './data/short/Empty.pdf', './data/long/Empty.pdf')  
  await sendMainMessage(ctx)
})
bot.action('LAW_OSS_ACTION',async (ctx) => {
  await ctx.reply('Такая возможность скоро появится.')
  await sendMainMessage(ctx)
})

bot.on('message', (ctx) => ctx.reply('Чем я могу помочь?', mainScreenKeyboard))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

