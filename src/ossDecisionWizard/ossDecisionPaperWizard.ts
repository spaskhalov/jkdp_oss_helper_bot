import { Scenes, Composer } from 'telegraf'
import { OssHelperContext } from '../OssHelperContext'
import { YesOrNoComposer, yesOrNoKeyboard } from './yesOrNoStepHandler'
import { WizardContextWizard } from 'telegraf/typings/scenes';
import { legendData } from '../readLegendData'
import { sendMainMessage } from '../mainScreenKeyboard'
import { sendDecisionPapers } from '../commonMessages'

function extractNumbers(st: string): false | number[] {
  const rez = Array.from(st.split(','), s => Number.parseInt(s))
  if (rez.some((v) => isNaN(v)))
    return false
  return rez
}

function goNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.next()
}

function goNextNext(ctx: OssHelperContext): WizardContextWizard<OssHelperContext>{
  return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
}

const enterFlatHander = new Composer<OssHelperContext>()
enterFlatHander.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер квартиры. Повторите еще раз.`)
  else
  {
    ctx.scene.session.flats = rez
    ctx.replyWithMarkdown(`Введите ФИО собственника. Если их несколько, перечисляйте их через запятую.\n_Например: Иванов Иван Иванович, Иванова Ивана Ивановна_`)    
    return ctx.wizard.next()    
  }
})

const enterFIOHandler = new Composer<OssHelperContext>()
enterFIOHandler.on('text', async (ctx) => {
  ctx.scene.session.owners = ctx.message.text.split(',').map((n) => n.trim().toLowerCase())
  await ctx.reply('У вас есть парковочное место?', yesOrNoKeyboard)
  return ctx.wizard.next()  
})

const yesOrNoCarPlaceHandler = new YesOrNoComposer(
  (ctx) => {
    ctx.replyWithMarkdown(`Введите номер парковочного места. Если их несколько, перечисляйте их через запятую.\n_Например: 123, 124_`,)
    goNext(ctx)
  }, (ctx) => {
    ctx.reply('У вас есть кладовка?', yesOrNoKeyboard)    
    goNextNext(ctx)
  })

const enterCarPlacesHandler = new Composer<OssHelperContext>()
enterCarPlacesHandler.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер парковочного места. Повторите еще раз.`)
  else
  {
    ctx.scene.session.carPlaces = rez
    ctx.reply('У вас есть кладовка?', yesOrNoKeyboard)
    return ctx.wizard.next()    
  }
})

const yesOrNoStoreroomsHandler = new YesOrNoComposer(
  (ctx) => {
    ctx.replyWithMarkdown(`Введите номер кладовки. Если их несколько, перечисляйте их через запятую.\n_Например: 123, 124_`,)
    goNext(ctx)
  }, (ctx) => {
    lastStep(ctx)
  })

const enterStoreroomsHandler = new Composer<OssHelperContext>()
enterStoreroomsHandler.on('text', async (ctx) => {   
  const rez = extractNumbers(ctx.message.text)
  if(!rez)
    await ctx.reply(`Вы ввели не правильный номер кладовки. Повторите еще раз.`)
  else
  {
    ctx.scene.session.storerooms = rez    
    lastStep(ctx)
  }
})

export const OssDecisionPaperWizard = new Scenes.WizardScene(  
  'OssDecisionPaperWizard',
  async (ctx) => {         
    await ctx.replyWithMarkdown('Введите номер Вашей квартиры. Если их несколько, перечисляйте их через запятую.\n_Например: 1023, 1024_')
    return ctx.wizard.next()
  },
  enterFlatHander,  
  enterFIOHandler,
  yesOrNoCarPlaceHandler,
  enterCarPlacesHandler,
  yesOrNoStoreroomsHandler,
  enterStoreroomsHandler
)

async function lastStep(ctx: OssHelperContext){
  await verifyData(ctx)
  await ctx.scene.leave()
  await sendMainMessage(ctx)
}

async function verifyData(ctx: OssHelperContext){
  const rowByFlatNum = getRowByFlatNum()
  if(!checkOwners()){
    await ctx.reply(`Собственники указанные в реестре отличаются от введенных Вами. Попробуйте еще раз.`)
    return
  }

  await verifyDataInner(rowByFlatNum, 'квартиры')
  if(ctx.scene.session?.carPlaces && ctx.scene.session?.carPlaces.length > 0)
    await verifyDataInner(getRowByCarPlacesNum(), 'м/м')
  if(ctx.scene.session?.storerooms && ctx.scene.session?.storerooms.length > 0)
    await verifyDataInner(getRowByCarPlacesNum(), 'кладовки')

  //const rowByCarPlaces = getRowByCarPlacesNum()

  async function verifyDataInner(
    row: legendData | undefined,
    objectName: string)
  {    
    let shortOSSBlankPath = './data/short/Empty.pdf'
    let longOSSBlankPath = './data/long/Empty.pdf'
  
    if(row){    
        if(row.name.length > 0)  
          await ctx.reply(`Отлично! ${row.name}, я нашел именные бланки для ${objectName}!`)
        else
          await ctx.reply(`Отлично! Я нашел именные бланки для ${objectName}!`)
        shortOSSBlankPath = `./data/short/files/${row.fileNum} _ .pdf`
        longOSSBlankPath = `./data/long/files/${row.fileNum} _ .pdf`            
    }else
    {
      await ctx.reply(`Простите... Но я не нашел именные бланки для ${objectName}:( Я отправлю Вам шаблоны.`)    
    }
  
    await sendDecisionPapers(ctx, objectName, shortOSSBlankPath, longOSSBlankPath)
  }

  function getRowByFlatNum(): legendData | undefined{    
    for(let flatNum of ctx.scene.session.flats){    
      const row = ctx.ossLegend.data.find(((d) => d.flats.includes(flatNum)))
      if(row !== undefined)
        return row
    }
    return undefined
  }

  function getRowByCarPlacesNum(): legendData | undefined{    
    for(let carPlace of ctx.scene.session.carPlaces){    
      const row = ctx.ossLegend.data.find(((d) => d.carPlaces.includes(carPlace)))
      if(row !== undefined)
        return row
    }
    return undefined
  }

  function getRowByStoreroomNum(): legendData | undefined{    
    for(let storeroom of ctx.scene.session.storerooms){    
      const row = ctx.ossLegend.data.find(((d) => d.storerooms.includes(storeroom)))
      if(row !== undefined)
        return row
    }
    return undefined
  }

  function checkOwners() {
    if(!rowByFlatNum?.owners || rowByFlatNum?.owners.length == 0)
      return true
    return rowByFlatNum?.owners.every((fio) => ctx.scene.session?.owners.includes(fio))
  }
}


