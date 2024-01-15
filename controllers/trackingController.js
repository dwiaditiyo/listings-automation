import dotenv from 'dotenv'
import puppeteer from "puppeteer-extra"
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

import { oke } from './trackingFromshtController.js';
import { FSDB } from "file-system-db";
import { delay } from "./helperController.js"
import { insertFashionphile, ignoreTrack } from '../config/database.js'
import { loginFashionphile } from "./loginScrapeController.js"
import { getSheetTracking, updateTrackingPhoshmark, updateTrackingFashionphile } from "../config/spreadsheet.js"

dotenv.config()

const headless = process.env.HIDE_BROWSER
const browserPath = process.env.BROWSER_PATH

const fashionphile = new FSDB("./dbfashionphile.json", false)
const dbignoretrack = new FSDB("./dbignoretrack.json", false)


puppeteer.use(StealthPlugin())

export const poshmarkTrack = async () => {

    let browser = {}

    try {
        
        if(typeof browser == 'undefined' || Object.keys(browser).length === 0){
    
            console.log(`wait puppetter launch...`)
            // launch browser
            browser = await puppeteer.launch({
                    headless: (headless === 'true'),
                    executablePath: browserPath,
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
        await page.setRequestInterception(true)

        page.on('request', (req) => {
            if(req.resourceType() === 'image'){
                req.abort();
            }
            else {
                req.continue();
            }
        })

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
                
                try {
                    await updateTrackingPhoshmark(tr.row, availabilityCheck)
                } catch (error) {
                    console.log(error.message)
                }
        
                await delay(10000)
            }
            // grab poshmark from sheets
            await oke()
        }
    
        await browser.close()
        browser = {}

    } catch (error) {
        console.log(error)

        // await browser.close()
        // browser = {}
    }
}

export const fashionphileTrack = async() => {
    let browser = {}

    try {
        
        if(typeof browser == 'undefined' || Object.keys(browser).length === 0){
    
            console.log(`wait puppetter launch...`)
            // launch browser
            browser = await puppeteer.launch({
                    headless: (headless === 'true'),
                    executablePath: browserPath,
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
        await page.setRequestInterception(true)
        
        page.on('request', (req) => {
            if(req.resourceType() === 'image'){
                req.abort();
            }
            else {
                req.continue();
            }
        });

        try {
            var ignore = dbignoretrack.get('ignoreTrack')
            var trackingSheet = await getSheetTracking()
        } catch (error) {
            console.log(error.message)
        }
    
        if (trackingSheet.length == 0) {
            await browser.close()
            browser = {}
        }else{
    
            await loginFashionphile(page)
        
            await delay(2000)
            await page.goto('https://www.fashionphile.com/account/sales/quotes', { waitUntil: 'networkidle2', timeout: 0 })
            
            const pagination = await page.evaluate(() => {
                if(document.querySelectorAll('.page-link').length>0){
                    const pagi = Array.from(document.querySelectorAll('.page-link'))
                    const pagination = pagi.map(pg => pg.outerText)
    
                    return pagination
                }else{
                    return null
                }
            })
    
            var trackId = await page.evaluate(() => {
                const idTag = Array.from(document.querySelectorAll('.images>.text-muted'))
                var id = idTag.map(cat => cat.outerText)

                const quotesTag = Array.from(document.querySelectorAll('.panel-body>div.col-sm-6'))
                const quotesText = quotesTag.map(qtag => qtag.outerText)

                var noQuotes = []
                quotesText.map(qtext => {
                    let theText = qtext.split(" ")
                    let finalText = theText[2].replace(/(\r\n|\n|\r)/gm, " ").split(" ")

                    if(qtext.includes('sorry')){
                        noQuotes.push(finalText[0])
                    }
                })

                id = id.filter(val => !val.includes(noQuotes));

                return id
            })
    
            if(pagination !== null){
                
                for (let index = 2; index < pagination.length -1; index++) {
                    const element = pagination[index];
                    await delay(2000)
                    await page.goto(`https://www.fashionphile.com/account/sales/quotes?page=${element}`, { waitUntil: 'networkidle2', timeout: 0 })
    
                    const trackIdPgn = await page.evaluate(() => {
                        const idTag = Array.from(document.querySelectorAll('.images>.text-muted'))
                        var id = idTag.map(cat => cat.outerText)

                        const quotesTag = Array.from(document.querySelectorAll('.panel-body>div.col-sm-6'))
                        const quotesText = quotesTag.map(qtag => qtag.outerText)

                        var noQuotes = []
                        quotesText.map(qtext => {
                            let theText = qtext.split(" ")
                            let finalText = theText[2].replace(/(\r\n|\n|\r)/gm, " ").split(" ")

                            if(qtext.includes('sorry')){
                                noQuotes.push(finalText[0])
                            }
                        })

                        id = id.filter(val => !val.includes(noQuotes));

                        return id
                       
                    })
    
                    trackId = trackId.concat(trackIdPgn)
                }
            }
            
            trackId = trackId.filter(val => !val.includes(ignore));

            await fashionphile.delete("fashionphile");
            await fashionphile.set("fashionphile", [])
    
            for (let index = 0; index < trackId.length; index++) {
                let id = trackId[index].split(" ")
                let trackUrl = `https://www.fashionphile.com/quote-tracker?quoteId=${id[2]}`
                
                await delay(1000)
                await page.goto(trackUrl, { waitUntil: 'networkidle2', timeout: 0 })
                
                try {
                    
                    var trackingData = await page.evaluate(() => {
                        const statusTag = document.querySelectorAll('.done')[document.querySelectorAll('.done').length-1].cloneNode(true)
                        statusTag.removeChild(statusTag.querySelector('.children'))
                        statusTag.removeChild(statusTag.querySelector('div'))
            
                        const title = document.querySelector('.description>p').outerText
                        const status = statusTag.outerText
                        const offer = document.querySelector('.quoteCard>div>div>div.semibold').outerText
            
                        return { title: title, status: status, offer: offer }
                    })

                } catch (error) {
                    var trackingData = null
                }
                
                if(trackingData != null){

                    await insertFashionphile({
                        title: trackingData.title,
                        quote_id: id[2],
                        status: trackingData.status,
                        buyout_offer: trackingData.offer,
                        updated_at: Date.now()
                    })
        
                    for (let index = 0; index < trackingSheet.length; index++) {
                        const tr = trackingSheet[index]
    
                        let idFahionphile = trackingData.title.split(" ")
                        let idPoshmark = tr.title.split(" ")
    
                        if(`#${idPoshmark[0]}` == `#${idFahionphile[0]}`){
                            try {
                                await updateTrackingFashionphile(tr.row, trackUrl, trackingData.status, trackingData.offer)
                            } catch (error) {
                                console.log(error.message);
                            }
                        }
                    }
                }
        
            }
            
            const fashionphiledt = fashionphile.get('fashionphile')
            fashionphiledt.forEach(element => {
             
                if(element[3] == 'no offer'){
        
                    ignoreTrack(element[1])
                }
            })

            await browser.close()
            browser = {}
        }

    } catch (error) {

        console.log(error.message)
    }
}

// poshmarkTrack()

// fashionphileTrack()