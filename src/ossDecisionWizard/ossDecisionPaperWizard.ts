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
  await verifyDataAndSendDocuments(ctx)
  await ctx.scene.leave()
  await sendMainMessage(ctx)
}

async function verifyDataAndSendDocuments(ctx: OssHelperContext){
  const rowsByFlatNum = getRowsByFlatNum()
  const rowsByCarPlacesNum = getRowsByCarPlacesNum()
  const rowsByStoreroomNum = getRowsByStoreroomNum()
  if(!checkOwners()){
    await ctx.reply(`Собственники указанные в реестре отличаются от введенных Вами. Попробуйте еще раз.`)
    return
  }

  const rez = await verifyDataAndSendDocumentsInner(rowsByFlatNum, 'квартиры', [])
  if(ctx.scene.session?.carPlaces && ctx.scene.session?.carPlaces.length > 0){
    const r = await verifyDataAndSendDocumentsInner(rowsByCarPlacesNum, 'м/м', rez.sendedRows)
    rez.isPreFilled = r.isPreFilled || rez.isPreFilled
    rez.sendedRows = rez.sendedRows.concat(r.sendedRows)
  }
  if(ctx.scene.session?.storerooms && ctx.scene.session?.storerooms.length > 0){
    const r = await verifyDataAndSendDocumentsInner(rowsByStoreroomNum, 'кладовки', rez.sendedRows)
    rez.isPreFilled = r.isPreFilled || rez.isPreFilled
    rez.sendedRows = rez.sendedRows.concat(r.sendedRows)
  }

  await ctx.replyWithMarkdown(`При заполнение решений обратите внимание на следующие моменты:
- Необходимо расписаться внизу каждой страницы.
- Необходимо подписаться под таблицей на последней странице решения.
- Поставить галочки в каждой строчке таблицы за/против/воздержался.`);
  if(!rez.isPreFilled){
    await ctx.replyWithMarkdown(`❗️Обратите внимание, что у вас есть *частично заполенные бланки*. В них Вам необходимо дополнительно заполнить следующие поля:
- ФИО всех собственников.
_Например: Иванов Иван Иванович, Иванова Ивана Ивановна_
- Сведения о документе на право собственности. Номер и дату можно найти в выписке из ЕГРН.
_Например Номер No 77:09:0001007:13872-77/060/2021-1 от 08.10.2021_
  `)
  }
  await ctx.replyWithMarkdown(`❗️❗️❗️Распечатайте, заполните и отдайте все документы:❗️❗️❗️
  - [Александру Шаповалову](https://t.me/alamar1A22). Кв. 819, башня 3, 22-й этаж. Можно принести документы в любой день с 9:00 до 20:00. 
  - [Леониду](https://t.me/leonid_tj). Свяжитесь заранее через телеграм `)

  async function verifyDataAndSendDocumentsInner(
    rows: legendData [],
    objectName: string,
    alreadySended: string[]): Promise<{ isPreFilled: boolean; sendedRows: string[]; }>
  {    
    const isPreFilled = rows.some(r => r?.owners && r?.owners.length > 0)  
    let shortOSSBlankPath = `${ctx.dataRoot}/short/Empty.pdf`
    let longOSSBlankPath = `${ctx.dataRoot}/long/Empty.pdf`
    const name = rows.find(r => r.name.length > 0)?.name
    const greetingsMsg = name && name.length > 0 ? `${name}, я` : 'Я'
    const blankName = isPreFilled ? 'именные' : 'частично заполненные'
    const sendedRows: string [] = []
  
    if(rows.length > 0){      
      await ctx.reply(`Отлично! ${greetingsMsg} нашел ${blankName} бланки для ${objectName}!`)
      for await (const row of rows) {
        shortOSSBlankPath = `${ctx.dataRoot}/short/files/${row.fileNum}.pdf`
        longOSSBlankPath = `${ctx.dataRoot}/long/files/${row.fileNum}.pdf`  
        if(!alreadySended.includes(row.fileNum) && !sendedRows.includes(row.fileNum)){
          await sendDecisionPapers(ctx, objectName, shortOSSBlankPath, longOSSBlankPath, isPreFilled)
          sendedRows.push(row.fileNum)
        } 
      }      
    }else
    {
      await ctx.reply(`Простите... Но я не нашел именные бланки для ${objectName}:( Я отправлю Вам шаблоны.`)
      await sendDecisionPapers(ctx, objectName, shortOSSBlankPath, longOSSBlankPath, isPreFilled)
    }
    
    return {isPreFilled, sendedRows}
  }

  function getRowsByFlatNum(): legendData []{
    var rez:legendData[] = [] 
    if(ctx.scene.session?.flats && ctx.scene.session?.flats.length > 0){
      for(let flatNum of ctx.scene.session.flats){    
        const rows = ctx.ossLegend.data.filter(((d) => d.flats.includes(flatNum)))
        if(rows !== [])
          rez = rez.concat(rows)          
      }
    }
    return rez
  }

  function getRowsByCarPlacesNum(): legendData []{  
    var rez:legendData[] = []  
    if(ctx.scene.session?.carPlaces && ctx.scene.session?.carPlaces.length > 0){
      for(let carPlace of ctx.scene.session.carPlaces){    
        const rows = ctx.ossLegend.data.filter(((d) => d.carPlaces.includes(carPlace)))
        if(rows !== [])
          rez = rez.concat(rows)
      }
    }
    return rez
  }

  function getRowsByStoreroomNum(): legendData[]{    
    var rez:legendData[] = []  
    if(ctx.scene.session?.storerooms && ctx.scene.session?.storerooms.length > 0){
      for(let storeroom of ctx.scene.session.storerooms){    
        const rows = ctx.ossLegend.data.filter(((d) => d.storerooms.includes(storeroom)))
        if(rows !== [])
          rez = rez.concat(rows)
      }
    }
    return rez
  }

  function checkOwners() {
    return rowsByFlatNum.every((d) => checkOneOwner(d)) 
      && rowsByCarPlacesNum.every((d) => checkOneOwner(d))
      && rowsByStoreroomNum.every((d) => checkOneOwner(d))

    function checkOneOwner(data: legendData){
      if(!data?.owners || data?.owners.length == 0)
        return true
      return data?.owners.every((fio) => ctx.scene.session?.owners.includes(fio))
    }
  }
}


