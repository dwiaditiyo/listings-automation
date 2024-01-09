import { FSDB } from "file-system-db";

const poshmark = new FSDB("./dbposhmark.json", false)
const fashionphile = new FSDB("./dbfashionphile.json", false)

export const insertPoshmark = (data) =>{
    poshmark.push("poshmark", [data.title, data.url, data.status, data.price, data.updated_at]);
}

export const insertFashionphile = (data) =>{
    fashionphile.push("fashionphile", [data.title, data.quote_id, data.status, data.buyout_offer, data.updated_at]);
}