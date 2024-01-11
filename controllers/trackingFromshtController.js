import { grabForManualTracking } from "../config/spreadsheet.js";
import { insertPoshmark } from "../config/database.js";
import { FSDB } from "file-system-db";

const poshmark = new FSDB("./dbposhmark.json", false)

export const oke = async() =>{
    const data = await grabForManualTracking()

    await poshmark.delete("poshmark");
    await poshmark.set("poshmark", [])
    data.map(dt => {
        insertPoshmark({
            title: dt.title,
            url: dt.url,
            status: dt.status,
            price: dt.price,
            updated_at: Date.now()
        })
    })
}

// oke()