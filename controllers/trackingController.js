import dotenv from 'dotenv'
import puppeteer from "puppeteer"
import { delay } from "./helperController.js"
import { loginFashionphile } from "./loginScrapeController.js"
import { getSheetTracking, updateTrackingPhoshmark, updateTrackingFashionphile } from "../config/spreadsheet.js"

dotenv.config()

const headless = process.env.HIDE_BROWSER
let browser = {}

export const poshmarkTrack = async () => {

    if(typeof browser == 'undefined' || Object.keys(browser).length === 0){

        console.log(`wait puppetter launch...`)
        // launch browser
        browser = await puppeteer.launch({
                headless: (headless === 'true'),
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                args: [
                '--disable-infobars',
                '--no-sandbox',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list '
            ]
        });
    
    }

    const page = await browser.newPage()
    await page.setViewport({ width: 1366, height: 768})

    const tracking = await getSheetTracking()

    if (tracking.length == 0) {
        await browser.close()
        browser = {}
    }else{
        for (let index = 0; index < tracking.length; index++) {
            const tr = tracking[index]
            await page.goto(tr.poshmark_url, { waitUntil: 'networkidle2', timeout: 0 })
            
            const availabilityCheck = await page.evaluate(() => {
    
                const sold = (document.querySelector('.listing__status-banner__title--sold'))? 'Sold' : 'Available'
                return sold
            })
            
            await updateTrackingPhoshmark(tr.row, availabilityCheck)
    
            await delay(10000)
        }
    }

}

export const fashionphileTrack = async() => {

    if(typeof browser == 'undefined' || Object.keys(browser).length === 0){

        console.log(`wait puppetter launch...`)
        // launch browser
        browser = await puppeteer.launch({
                headless: (headless === 'true'),
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                args: [
                '--disable-infobars',
                '--no-sandbox',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list '
            ]
        });
    
    }
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1366, height: 768})

    const trackingSheet = await getSheetTracking()

    if (trackingSheet.length == 0) {
        await browser.close()
        browser = {}
    }else{

        await loginFashionphile(page)
    
        await delay(2000)
        await page.goto('https://www.fashionphile.com/account/sales/quotes', { waitUntil: 'networkidle2', timeout: 0 })
    
        const trackId = await page.evaluate(() => {
            const idTag = Array.from(document.querySelectorAll('.images>.text-muted'))
            const id = idTag.map(cat => cat.outerText)
            return id
        })
    
    
        for (let index = 0; index < trackId.length; index++) {
            let id = trackId[index].split(" ")
            let trackUrl = `https://www.fashionphile.com/quote-tracker?quoteId=${id[2]}`
    
            await page.goto(trackUrl, { waitUntil: 'networkidle2', timeout: 0 })
            
            const trackingData = await page.evaluate(() => {
                const statusTag = document.querySelectorAll('.done')[document.querySelectorAll('.done').length-1].cloneNode(true)
                statusTag.removeChild(statusTag.querySelector('.children'))
                statusTag.removeChild(statusTag.querySelector('div'))
    
                const title = document.querySelector('.description>p').outerText
                const status = statusTag.outerText
                const offer = document.querySelector('.quoteCard>div>div>div.semibold').outerText
    
                return { title: title, status: status, offer: offer }
            })
    
            for (let index = 0; index < trackingSheet.length; index++) {
                const tr = trackingSheet[index]
                
                if(tr.title == trackingData.title){
                    await updateTrackingFashionphile(tr.row, trackUrl, trackingData.status, trackingData.offer)
                }
            }
    
        }
    }
}

// poshmarkTrack()

// fashionphileTrack()