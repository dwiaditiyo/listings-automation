import { FSDB } from "file-system-db";
import { delay } from './helperController.js'
import { saveCookie, setCookie } from "./cookieController.js";

const db = new FSDB("./db.json", false)

export const loginFashionphile = async (page) => {

    const email = db.get("fs_login.email");
    const password = db.get("fs_login.password");

    await setCookie(page)

    await page.goto('https://www.fashionphile.com/login', { waitUntil: 'networkidle2', timeout: 0 })

    let currurl = await page.url()

    if(currurl.includes("login")){
        await page.click("#btnAcceptCookie")
        await delay(3000)
        await page.type("#login_email", email)
        await page.type("#login_password", password)
    
        await page.evaluate(() => {
            document.querySelector('.btn.btn-black').click()
        })
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

        const cookiesObject = await page.cookies()
        saveCookie(JSON.stringify(cookiesObject))
    }
}