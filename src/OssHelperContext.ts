import { Scenes } from 'telegraf'

interface OssHelperSessionData extends Scenes.WizardSessionData {  
  flatNumber: number;
  FIO: string;
}

export type OssHelperContext = Scenes.WizardContext<OssHelperSessionData>;
