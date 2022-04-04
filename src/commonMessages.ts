import { OssHelperContext } from "./OssHelperContext";

export async function sendDecisionPapers(ctx: OssHelperContext, objectName: string, shortOSSPath: string, longOSSPath: string) {
  await ctx.replyWithMarkdown(`Это Ваш бланк ${objectName} для "короткого" ОСС. Его необходимо сдать до *31ого августа* 2022 года.`);
  await ctx.replyWithDocument({ source:  shortOSSPath});
  await ctx.replyWithMarkdown(`Это Ваш бланк ${objectName} для "длинного" ОСС. Его необходимо сдать до *30ого ноябра* 2022 года.`);
  await ctx.replyWithDocument({ source:  longOSSPath});
  await ctx.replyWithMarkdown(`Обратите внимание на моменты:
- Необходимо расписаться внизу каждой страницы.
- Необходимо подписаться под таблицей на последней странице решения.
- Поставить галочки в каждой строчке таблицы за/против/воздержался.`);
}