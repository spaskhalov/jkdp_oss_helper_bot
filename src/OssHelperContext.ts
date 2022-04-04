import { Scenes, Context } from 'telegraf'
import { OSSLegend } from './readLegendData';


interface OssHelperSessionData extends Scenes.WizardSessionData {  
  flats: number[];
  carPlaces: number[];
  storerooms: number[];
  owners: string[];  
}

export interface OssHelperContext extends Context {  
  ossLegend: OSSLegend
  dataRoot: string  
  scene: Scenes.SceneContextScene<OssHelperContext, OssHelperSessionData> 
  wizard: Scenes.WizardContextWizard<OssHelperContext>  
}