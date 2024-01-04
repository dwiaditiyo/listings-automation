import dotenv from 'dotenv'
import moment from 'moment-timezone';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from "google-spreadsheet"

dotenv.config()

const client_email = process.env.SEVICE_ACC_EMAIL
const private_key = process.env.SEVICE_ACC_PRIVATE_KEY
const sheetId = '1L6fde4INp8vry8IJ-ghbxypWnS9UTgSPnwXWfr60zzA'

const serviceAccountAuth = new JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth)

export const getSheetTracking = async() => {

    await doc.loadInfo()

    const tracking = doc.sheetsByIndex[1]

    const rows = await tracking.getRows()

    let trackingData = []
    rows.map((row, i)=> {
        trackingData.push({ row: i, title: row.get('Title'), poshmark_url: row.get('Poshmark Url'), fashionphile_url: row.get('Fashionphile Url') })
    })

    console.log(trackingData);
    return trackingData
}

export const insertSheetListing = async(listing) => {

    await doc.loadInfo()

    const listingSheet = doc.sheetsByIndex[0]
    const trackingSheet = doc.sheetsByIndex[1]

    await listingSheet.addRow(
        { 
            'Title': listing.title, 
            'Price': listing.price,
            'Seller Username': listing.seller_username,
            'Seller Has Star' : listing.seller_has_star,
            'Designer': listing.designer,
            'Category': listing.category.toString(),
        }
    )

    await trackingSheet.addRow(
        {
            'Title': listing.title,
            'Poshmark Url': listing.listings_url,
            'Price': listing.price,
            'Poshmark Status': 'Available',
            'Ps Updated At': moment().tz("Asia/Jakarta").format("YYYY-MM-DD H:mm:ss")
        }
    )
}

export const updateTrackingPhoshmark = async (row, status) => {

    await doc.loadInfo()

    const tracking = doc.sheetsByIndex[1]

    const rows = await tracking.getRows()

    rows[row].assign({ 'Poshmark Status': status, 'Ps Updated At': moment().tz("Asia/Jakarta").format("YYYY-MM-DD H:mm:ss") })

    await rows[row].save()
}

export const updateTrackingFashionphile = async (row, url, status, offer) => {

    await doc.loadInfo()

    const tracking = doc.sheetsByIndex[1]

    const rows = await tracking.getRows()

    rows[row].assign({ 'Fashionphile Url': url, 'Fashionphile Status': status, 'Buyout Offer': offer, 'Fs Updated At': moment().tz("Asia/Jakarta").format("YYYY-MM-DD H:mm:ss") })

    await rows[row].save()
}

export const grabSheetFetch = async () => {
    await doc.loadInfo()

    const fetchData = doc.sheetsByIndex[2]

    const rows = await fetchData.getRows()

    let listings = []
    rows.map((row, i)=> {

        listings.push({
             row: i, 
             id: row.get('Id'),
             listings_url: row.get('Listings Url'),
             title: row.get('Title'),
             description: row.get('Description'),
             price: row.get('Price'),
             seller_username: row.get('Seller Username'),
             seller_has_star: row.get('Seller Has Star'),
             designer: row.get('Designer'),
             category: row.get('Category'),
             listings_images: row.get('Listings Images')
        })
    })

    return listings
}

export const updateSheetFetch = async (row, grabed_listings) => {

    await doc.loadInfo()

    const fetchData = doc.sheetsByIndex[2]

    const rows = await fetchData.getRows()

    rows[row].assign({ 
        'Title': grabed_listings.product.title, 
        'Description': grabed_listings.product.description, 
        'Price': grabed_listings.product.price, 
        'Seller Username': grabed_listings.product.seller_username, 
        'Seller Has Star': grabed_listings.product.seller_has_star, 
        'Designer': grabed_listings.product.designer, 
        'Category': grabed_listings.product.category.toString(),
        'Listings Images': grabed_listings.image.toString(),
        'Id': `dat-${Date.now()}`
    })

    await rows[row].save()
}

export const deleteSheetFetch = async (id) => {
    await doc.loadInfo()

    const fetchData = doc.sheetsByIndex[2]

    const rows = await fetchData.getRows()

    rows.map(row => {
        if(row.get('Id') == id){
            row.delete()
        }
    })
}