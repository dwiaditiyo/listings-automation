import path from "path";
import dotenv from 'dotenv'
import express  from "express";
import puppeteer from "puppeteer";
import { fileURLToPath } from 'url';
import { FSDB } from "file-system-db";
import { runJob } from "./job/schedule.js";
import { grabListing } from "./controllers/grabListingController.js";
import { uploadListing } from "./controllers/uploadListingController.js";
import { insertSheetListing, grabSheetFetch, updateSheetFetch, deleteSheetFetch } from "./config/spreadsheet.js";

dotenv.config()

const db = new FSDB("./db.json", false)

const app = express()
const port = 3000

var browser = {}
const headless = process.env.HIDE_BROWSER

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'views')))

// tracking part
runJob()

app.get('/', async (req, res) => {
    const login_data = db.get("fs_login")
    login_data.password = 'its not a password'
    res.render('index.ejs', { data : login_data })
})

app.get('/fetch-listings', async (req, res) => {
    try {
        res.redirect('/')

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

        const url = await grabSheetFetch()
        
        if (url.length == 0) {
            await browser.close()
            browser = {}
        }else{

            for (let index = 0; index < url.length; index++) {
            
                const poshMarkUrl = url[index].listings_url;
                console.log(poshMarkUrl);
                const listing = await grabListing(browser, poshMarkUrl)
                
                await updateSheetFetch(index, listing)
            }

            await browser.close()
            browser = {}
        }

    } catch (error) {

        console.log(error.message)
    }
})

app.post('/update-fashionphile-login', async (req, res) => {
    const { email, password } = req.body;

    db.set("fs_login.email", email);
    if(password !== 'its not a password'){
        db.set("fs_login.password", password);
    }

    res.redirect('/');
})

app.get('/upload-listings', async (req, res) => {

    try {
        res.redirect('/')

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
    
            const page = await browser.newPage()

            await page.setViewport({ width: 1366, height: 768})
        }
        
        const fetchData = await grabSheetFetch()
        
        if (fetchData.length == 0) {
            await browser.close()
            browser = {}
        }else{

            for (let index = 0; index < fetchData.length; index++) {
            
                await uploadListing(browser, fetchData[index])
    
                await insertSheetListing(fetchData[index])
    
                await deleteSheetFetch(fetchData[index].id)
            }

            await browser.close()
            browser = {}
        }

    } catch (error) {

        console.log(error.message)
    }

   
})

app.get('/test', async (req, res) => {
    const fetchData = await grabSheetFetch()
    console.log(fetchData);
})

app.listen(port, () =>{
    console.log(`server running on port:${port}`)
})