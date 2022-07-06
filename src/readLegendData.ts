import reader from "xlsx";

interface legendRawDataField {
  file_num: string
  address: string
  owners: string
}

export interface legendData{
  fileNum: string,
  flats: number[],
  carPlaces: number[],
  storerooms: number[],
  owners: string[]
  name: string
}

export class OSSLegend{

  data: legendData[] = [];
  
  constructor(rawData: legendRawDataField[]){
    rawData.forEach(d => {      
      const flats = extractNumbers(d.address, /кв\. (\d+)/g)
      const carPlaces = extractNumbers(d.address, /м\/м (\d+)/g)
      const pantries = extractNumbers(d.address, /пом\. (\d+)/g)
      const owners = d.owners?.split(',').map((n) => n.trim().toLowerCase())
      const name = owners !== undefined? capitalizeFirstLetter(owners[0].split(' ')[1]) : ''
      this.data.push({
        fileNum: d.file_num,
        flats: flats,
        carPlaces: carPlaces,
        storerooms: pantries,      
        owners: owners,
        name: name,
      })
    });
  }
}

function capitalizeFirstLetter(st: string) {
  return st.charAt(0).toUpperCase() + st.slice(1);
}

function extractNumbers(st: String, flatsRegex: RegExp) {
  return Array.from(st.matchAll(flatsRegex), ns => Number.parseInt(ns[1]));
}

export function readLegendData(fileName: string) {  
  // Reading our test file
  const file = reader.readFile(fileName)
  let data: legendRawDataField[] = []    
  const sheetName = file.SheetNames[0]
    
  const temp = reader.utils.sheet_to_json<legendRawDataField>(file.Sheets[sheetName])
  temp.forEach((res) => {
    data.push(res)   
  })
  
  return new OSSLegend(data)
}