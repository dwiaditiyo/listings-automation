import { download } from './helperController.js';

export const grabListing = async (browser, pageUrl) => {

    try {
        
        const pages = await browser.pages()
        const page = pages[1]
    
        console.log(`go to page...`)
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 0 })
    
        const product = await page.evaluate(() => {
    
            const title = document.querySelector('.listing__title>h1').outerText
            const price = document.querySelector('.listing__ipad-centered>.h1').outerText
            const description = document.querySelector('.listing__description').outerText
            const seller_username = document.querySelector('.seller-details__user-name').outerText
            const seller_has_star = (document.querySelector('.pa-badge__star'))? true : false
            const designer = (document.querySelector('.listing__brand'))? document.querySelector('.listing__brand').outerText.toLowerCase() : ''
            
            const categoryTag = Array.from(document.querySelectorAll('div.tag-details__btn'))
            const category = categoryTag.map(cat => cat.outerText.toLowerCase())
    
            const imagesTag = Array.from(document.querySelectorAll('.carousel__item>div>a>.img__container:not(.img__container--video-thumbnail)>picture>img'))
            const images = imagesTag.map(img => img.attributes[0].value)
    
            return { title: title, price: price, description: description, seller_username: seller_username, seller_has_star: seller_has_star, designer: designer, category: category, images: images }
        })
    
        const clean_str = product.title.replace(/[^a-zA-Z0-9 ]/g, "")
        const image_name = clean_str.toLowerCase().replace(/ /g,"_")
    
        var local_image = []
    
        await product.images.map(async url => {
            let full_img_name = `${image_name}_${Date.now()}.jpeg`
            local_image.push(full_img_name)
            await download(url, full_img_name)  
        })
    
        return { url: pageUrl, product: product, image: local_image }

    } catch (error) {
        
        console.log(error.message)
    }
}