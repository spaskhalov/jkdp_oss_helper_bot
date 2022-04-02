import { Scenes, Composer, Markup } from 'telegraf'
import { OssHelperContext } from './OssHelperContext'

const enterFlatNumber = new Composer<OssHelperContext>()
enterFlatNumber.on('text', async (ctx) => {     
  ctx.scene.session.flatNumber = parseInt(ctx.message.text)
  if(isNaN(ctx.scene.session.flatNumber))
    await ctx.reply(`Вы ввели не правильный номер. Повторите еще раз.`)
  else
  {
    ctx.replyWithMarkdown(`Введите полные ФИО всех собственников через запятую. 
_Например: Иванов Иван Иванович, Иванова Ивана Ивановна_`)    
    return ctx.wizard.next()
  }
})

const enterFIOStep = new Composer<OssHelperContext>()
enterFIOStep.on('text', async (ctx) => {
  ctx.scene.session.FIO = ctx.message.text
  await ctx.reply(`Пока ${ctx.scene.session.FIO} из квартиры ${ctx.scene.session.flatNumber}`)

  return await ctx.scene.leave()
})

export const OssDecisionPaperWizard = new Scenes.WizardScene(  
  'OssDecisionPaperWizard',
  async (ctx) => 
  {        
    await ctx.reply('Введите номер вашей квартиры:')
    return ctx.wizard.next()
  },
  enterFlatNumber,  
  enterFIOStep
)

