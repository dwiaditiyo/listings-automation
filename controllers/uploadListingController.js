import { delay } from './helperController.js';
import { loginFashionphile } from './loginScrapeController.js';

export const uploadListing = async (browser, product) => {

    const pages = await browser.pages()
    const page = pages[1]

    await loginFashionphile(page)

    let currurl = await page.url()

    if(currurl.includes("account/dashboard")){

        await page.goto('https://www.fashionphile.com/sell-your-bag', { waitUntil: 'networkidle2', timeout: 0 })
        
        
        await delay(2000)
        // type the title
        await page.evaluate(text => { document.querySelector('#itemName').value = text; }, product.title);
        
        const designerArray = await page.evaluate(() => {

            const designerTag = Array.from(document.querySelectorAll('#Designer>option'))
            const designer = designerTag.map(des => [des.outerText, des.value])
    
            return designer
        })
    
        console.log(designerArray);

        let designer = []
        await designerArray.map(des => {
            if(des[0].toLowerCase().includes(product.designer)){
                 designer = des
            }
        })
        console.log(designer);

        if(designer.length != 0){

            await page.select('#Designer', designer[1])
    
            await delay(2000)
            const categoryArray = await page.evaluate(() => {
    
                const categoryTag = Array.from(document.querySelectorAll('#Category>option'))
                const category = categoryTag.map(cat => [cat.outerText, cat.value])
    
                return category
            })
    
            console.log(categoryArray);
    
            let category = []
            const split_category = product.category.split(",")
            await categoryArray.map(cat => {

                split_category.map(scat => {

                    if(cat[0].toLowerCase().includes(scat)){
                        category = cat
                    }
                })
            })
            console.log(category)

            if(category.length != 0){

                await page.select('#Category', category[1])
        
                // await page.type("#itemName", product.title)
                await page.type("#description", product.description)
                
                const inputUploadHandle = await page.$('.image-uploader>div>[type="file"]')

                const local_image = product.listings_images.split(",")

                for (let index = 0; index < local_image.length; index++) {

                    let fileToUpload = `./resources/images/${local_image[index]}`;

                    await delay(2000)
                    await inputUploadHandle.uploadFile(fileToUpload);
                }
                await delay(5000)
                // await page.waitForSelector('#sell-submission>button:not([disabled])')
                await page.click("#sell-submission>button")

                return { status: true, message: 'Listings Submited!' }

            }else{
                console.log('Category not found!')

                return { status: false, message: 'Category not found!' }
            }
    
        }else{
            console.log('Designer not found!')
            return { status: false, message: 'Designer not found!' }
        }
    }
}